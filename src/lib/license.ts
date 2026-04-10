import crypto from "crypto"
import { prisma } from "./prisma"
import { redis } from "./redis"

const LICENSE_SECRET = process.env.LICENSE_SECRET || "default-secret"
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ" // no 0,O,1,I,L
const CACHE_TTL = 3600 // 1 hour
const CACHE_KEY_PREFIX = "license:"
const PLAN_CACHE_KEY = "license:current_plan"

export interface LicenseValidationResult {
  valid: boolean
  plan: "FREE" | "PRO" | "LIFETIME"
  expiresAt?: Date
  error?: string
}

function base32Encode(buffer: Buffer): string {
  let result = ""
  let bits = 0
  let value = 0

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i]
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result += ALPHABET[(value >> bits) & 0x1f]
    }
  }

  if (bits > 0) {
    result += ALPHABET[(value << (5 - bits)) & 0x1f]
  }

  return result
}

function base32Decode(encoded: string): Buffer {
  const bytes: number[] = []
  let bits = 0
  let value = 0

  for (let i = 0; i < encoded.length; i++) {
    const idx = ALPHABET.indexOf(encoded[i])
    if (idx === -1) throw new Error("Invalid character in key")
    value = (value << 5) | idx
    bits += 5
    while (bits >= 8) {
      bits -= 8
      bytes.push((value >> bits) & 0xff)
    }
  }

  return Buffer.from(bytes)
}

function formatKey(encoded: string): string {
  // Pad or trim to 20 chars, split into 4 groups of 5
  const chars = encoded.substring(0, 20).padEnd(20, ALPHABET[0])
  return `MANGO-${chars.slice(0, 5)}-${chars.slice(5, 10)}-${chars.slice(10, 15)}-${chars.slice(15, 20)}`
}

function parseKeyString(key: string): string | null {
  const match = key
    .toUpperCase()
    .trim()
    .match(/^MANGO-([23456789A-Z]{5})-([23456789A-Z]{5})-([23456789A-Z]{5})-([23456789A-Z]{5})$/)
  if (!match) return null
  return match[1] + match[2] + match[3] + match[4]
}

export function generateLicenseKey(
  plan: "PRO" | "LIFETIME",
  expiresAt?: Date
): string {
  // 10 random bytes for uniqueness
  const randomBytes = crypto.randomBytes(10)

  // Plan byte: P = PRO, L = LIFETIME
  const planByte = plan === "PRO" ? 0x50 : 0x4c

  // Expiry as 4-byte unix timestamp (0 if no expiry)
  const expiryTimestamp = expiresAt
    ? Math.floor(expiresAt.getTime() / 1000)
    : 0
  const expiryBytes = Buffer.alloc(4)
  expiryBytes.writeUInt32BE(expiryTimestamp, 0)

  // Construct payload: random(10) + plan(1) + expiry(4) = 15 bytes
  const payload = Buffer.concat([
    randomBytes,
    Buffer.from([planByte]),
    expiryBytes,
  ])

  // Sign payload
  const hmac = crypto.createHmac("sha256", LICENSE_SECRET)
  hmac.update(payload)
  const signature = hmac.digest()

  // Take first 4 bytes of signature
  const sigBytes = signature.subarray(0, 4)

  // Final data: payload(15) + sig(4) = 19 bytes
  const finalData = Buffer.concat([payload, sigBytes])

  // Encode and format
  const encoded = base32Encode(finalData)
  return formatKey(encoded)
}

export async function validateLicenseKey(
  key: string
): Promise<LicenseValidationResult> {
  // Check Redis cache
  try {
    const cached = await redis.get(`${CACHE_KEY_PREFIX}${key}`)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {
    // Redis unavailable, continue without cache
  }

  // Parse the key format
  const encoded = parseKeyString(key)
  if (!encoded) {
    return {
      valid: false,
      plan: "FREE",
      error: "Invalid key format. Expected MANGO-XXXXX-XXXXX-XXXXX-XXXXX",
    }
  }

  // Decode
  let decoded: Buffer
  try {
    decoded = base32Decode(encoded)
  } catch {
    return { valid: false, plan: "FREE", error: "Invalid key encoding" }
  }

  if (decoded.length < 19) {
    return { valid: false, plan: "FREE", error: "Invalid key data" }
  }

  // Extract parts
  const payload = decoded.subarray(0, 15)
  const providedSig = decoded.subarray(15, 19)

  // Verify HMAC
  const hmac = crypto.createHmac("sha256", LICENSE_SECRET)
  hmac.update(payload)
  const expectedSig = hmac.digest().subarray(0, 4)

  if (!crypto.timingSafeEqual(providedSig, expectedSig)) {
    return { valid: false, plan: "FREE", error: "Invalid license key" }
  }

  // Extract plan
  const planByte = payload[10]
  let plan: "PRO" | "LIFETIME"
  if (planByte === 0x50) {
    plan = "PRO"
  } else if (planByte === 0x4c) {
    plan = "LIFETIME"
  } else {
    return { valid: false, plan: "FREE", error: "Invalid plan in key" }
  }

  // Extract expiry
  const expiryTimestamp = payload.readUInt32BE(11)
  let expiresAt: Date | undefined
  if (expiryTimestamp > 0) {
    expiresAt = new Date(expiryTimestamp * 1000)
    if (expiresAt < new Date()) {
      const result: LicenseValidationResult = {
        valid: false,
        plan: "FREE",
        expiresAt,
        error: "License key has expired",
      }
      try {
        await redis.setex(
          `${CACHE_KEY_PREFIX}${key}`,
          CACHE_TTL,
          JSON.stringify(result)
        )
      } catch {
        // Redis unavailable
      }
      return result
    }
  }

  // Store in database
  try {
    await prisma.license.upsert({
      where: { key },
      update: {
        plan,
        isValid: true,
        expiresAt: expiresAt || null,
        activatedAt: new Date(),
      },
      create: {
        key,
        plan,
        isValid: true,
        expiresAt: expiresAt || null,
        activatedAt: new Date(),
      },
    })
  } catch (error) {
    console.error("Failed to store license:", error)
  }

  const result: LicenseValidationResult = {
    valid: true,
    plan,
    expiresAt,
  }

  // Cache result
  try {
    await redis.setex(
      `${CACHE_KEY_PREFIX}${key}`,
      CACHE_TTL,
      JSON.stringify(result)
    )
    await redis.setex(PLAN_CACHE_KEY, CACHE_TTL, plan)
  } catch {
    // Redis unavailable
  }

  return result
}

export async function getCurrentLicensePlan(): Promise<
  "FREE" | "PRO" | "LIFETIME"
> {
  // Check Redis cache first
  try {
    const cached = await redis.get(PLAN_CACHE_KEY)
    if (cached === "PRO" || cached === "LIFETIME") {
      return cached
    }
  } catch {
    // Redis unavailable
  }

  // Check database for valid license
  try {
    const license = await prisma.license.findFirst({
      where: {
        isValid: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { activatedAt: "desc" },
    })

    if (license) {
      const plan = license.plan as "FREE" | "PRO" | "LIFETIME"
      if (plan === "PRO" || plan === "LIFETIME") {
        try {
          await redis.setex(PLAN_CACHE_KEY, CACHE_TTL, plan)
        } catch {
          // Redis unavailable
        }
        return plan
      }
    }
  } catch (error) {
    console.error("Failed to check license:", error)
  }

  return "FREE"
}
