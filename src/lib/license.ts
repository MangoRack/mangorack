import { prisma } from "./prisma"
import { redis } from "./redis"
import { logger } from "./logger"

const LICENSE_API = process.env.LICENSE_API_URL || "https://api.mangorack.dev/v1/license"
const CACHE_TTL = 300 // 5 minutes
const CACHE_KEY_PREFIX = "license:"
const PLAN_CACHE_KEY = "license:current_plan"

export interface LicenseValidationResult {
  valid: boolean
  plan: "FREE" | "PRO" | "LIFETIME"
  expiresAt?: Date
  error?: string
}

export async function validateLicenseKey(
  key: string
): Promise<LicenseValidationResult> {
  // Basic format check
  const formatted = key.toUpperCase().trim()
  if (!/^MANGO-[23456789A-Z]{5}-[23456789A-Z]{5}-[23456789A-Z]{5}-[23456789A-Z]{5}$/.test(formatted)) {
    return {
      valid: false,
      plan: "FREE",
      error: "Invalid key format. Expected MANGO-XXXXX-XXXXX-XXXXX-XXXXX",
    }
  }

  // Check Redis cache (with timeout to avoid hanging when Redis is down)
  try {
    const cached = await Promise.race([
      redis.get(`${CACHE_KEY_PREFIX}${formatted}`),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 2000)
      ),
    ])
    if (cached) {
      return JSON.parse(cached)
    }
  } catch {
    // Redis unavailable
  }

  // Validate against external license server
  let result: LicenseValidationResult
  try {
    const res = await fetch(`${LICENSE_API}/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: formatted }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) {
      const errorData: { error?: string } = await res.json().catch(() => ({}))
      result = {
        valid: false,
        plan: "FREE",
        error: errorData.error || "License validation failed",
      }
    } else {
      const data: { valid?: boolean; plan?: string; expiresAt?: string; error?: string } = await res.json()
      result = {
        valid: data.valid === true,
        plan: (data.plan as LicenseValidationResult["plan"]) || "FREE",
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        error: data.error,
      }
    }
  } catch (error) {
    // If the license server is unreachable, check local database for a previously validated key
    try {
      const local = await prisma.license.findFirst({
        where: {
          key: formatted,
          isValid: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      })

      if (local) {
        result = {
          valid: true,
          plan: local.plan as "PRO" | "LIFETIME",
          expiresAt: local.expiresAt || undefined,
        }
      } else {
        result = {
          valid: false,
          plan: "FREE",
          error: "Unable to reach license server. Please check your internet connection.",
        }
      }
    } catch {
      result = {
        valid: false,
        plan: "FREE",
        error: "Unable to validate license. Please try again later.",
      }
    }
  }

  // Store valid license in local database
  if (result.valid && (result.plan === "PRO" || result.plan === "LIFETIME")) {
    try {
      await prisma.license.upsert({
        where: { key: formatted },
        update: {
          plan: result.plan,
          isValid: true,
          expiresAt: result.expiresAt || null,
          activatedAt: new Date(),
        },
        create: {
          key: formatted,
          plan: result.plan,
          isValid: true,
          expiresAt: result.expiresAt || null,
          activatedAt: new Date(),
        },
      })
    } catch (error) {
      logger.error("Failed to store license:", error)
    }
  }

  // Cache result (fire-and-forget, don't block on Redis)
  try {
    Promise.race([
      (async () => {
        await redis.setex(
          `${CACHE_KEY_PREFIX}${formatted}`,
          CACHE_TTL,
          JSON.stringify(result)
        )
        if (result.valid) {
          await redis.setex(PLAN_CACHE_KEY, CACHE_TTL, result.plan)
        }
      })(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 2000)
      ),
    ]).catch(() => {})
  } catch {
    // Redis unavailable
  }

  return result
}

export async function getCurrentLicensePlan(): Promise<
  "FREE" | "PRO" | "LIFETIME"
> {
  // Check Redis cache first (with timeout to avoid hanging when Redis is down)
  try {
    const cached = await Promise.race([
      redis.get(PLAN_CACHE_KEY),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Redis timeout")), 2000)
      ),
    ])
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
          redis.setex(PLAN_CACHE_KEY, CACHE_TTL, plan).catch(() => {})
        } catch {
          // Redis unavailable
        }
        return plan
      }
    }
  } catch (error) {
    logger.error("Failed to check license:", error)
  }

  return "FREE"
}
