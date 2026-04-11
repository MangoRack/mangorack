import crypto from "crypto"
import { prisma } from "./prisma"
import { redis } from "./redis"

const LICENSE_SECRET = process.env.LICENSE_SECRET!
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"
const CACHE_TTL = 3600
const CACHE_KEY_PREFIX = "license:"
const PLAN_CACHE_KEY = "license:current_plan"

export interface LicenseValidationResult {
  valid: boolean
  plan: "FREE" | "PRO" | "LIFETIME"
  expiresAt?: Date
  error?: string
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

function parseKeyString(key: string): string | null {
  const match = key
    .toUpperCase()
    .trim()
    .match(/^MANGO-([23456789A-Z]{5})-([23456789A-Z]{5})-([23456789A-Z]{5})-([23456789A-Z]{5})$/)
  if (!match) return null
  return match[1] + match[2] + match[3] + match[4]
}

export async function validateLicenseKey(
  key: string
): Promise<LicenseValidationResult> {
  if (!LICENSE_SECRET) {
    return { valid: false, plan: "FREE", error: "License validation unavailable" }
  }

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
