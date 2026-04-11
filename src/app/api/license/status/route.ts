import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth, errorResponse } from "@/lib/auth-helpers";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

const LICENSE_API = process.env.LICENSE_API_URL || "https://api.mangorack.dev/v1/license";

function maskKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 8) return "****";
  return key.slice(0, 4) + "****" + key.slice(-4);
}
const REVALIDATION_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const REVALIDATION_CACHE_KEY = "license:last_revalidation";

// In-memory fallback for revalidation timestamp when Redis is unavailable
let lastRevalidationTimestamp = 0;

function recordRevalidation() {
  lastRevalidationTimestamp = Date.now();
  // Also try Redis, but don't depend on it
  try {
    redis.setex(REVALIDATION_CACHE_KEY, 300, Date.now().toString()).catch(() => {});
  } catch { /* Redis unavailable */ }
}

export async function GET() {
  try {
    await requireAuth();

    const license = await prisma.license.findFirst({
      where: { isValid: true },
      orderBy: { activatedAt: "desc" },
    });

    if (!license) {
      return NextResponse.json({
        data: {
          plan: "FREE",
          isValid: true,
          key: null,
          activatedAt: null,
          expiresAt: null,
          email: null,
        },
      });
    }

    // Periodically re-validate the stored key against the license server
    // to detect revocations
    let shouldRevalidate = true;
    try {
      // Try Redis first with a timeout to avoid hanging when Redis is down
      const lastCheck = await Promise.race([
        redis.get(REVALIDATION_CACHE_KEY),
        new Promise<null>((_, reject) =>
          setTimeout(() => reject(new Error("Redis timeout")), 2000)
        ),
      ]);
      if (lastCheck) {
        const elapsed = Date.now() - parseInt(lastCheck, 10);
        if (elapsed < REVALIDATION_INTERVAL_MS) {
          shouldRevalidate = false;
        }
      }
    } catch {
      // Redis unavailable — fall back to in-memory timestamp
      if (lastRevalidationTimestamp > 0) {
        const elapsed = Date.now() - lastRevalidationTimestamp;
        if (elapsed < REVALIDATION_INTERVAL_MS) {
          shouldRevalidate = false;
        }
      }
    }

    if (shouldRevalidate && license.key) {
      try {
        const res = await fetch(`${LICENSE_API}/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: license.key }),
          signal: AbortSignal.timeout(10000),
        });

        if (res.ok) {
          const data: { valid?: boolean; plan?: string; expiresAt?: string } = await res.json();

          if (!data.valid) {
            // License has been revoked — mark as invalid locally
            await prisma.license.update({
              where: { id: license.id },
              data: { isValid: false },
            });

            // Clear plan cache
            try {
              await Promise.race([
                Promise.all([
                  redis.del("license:current_plan"),
                  redis.del(`license:${license.key}`),
                ]),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("Redis timeout")), 2000)
                ),
              ]);
            } catch { /* Redis unavailable */ }

            recordRevalidation();
            logger.info(`License ${maskKey(license.key)} revoked by server — downgrading to FREE`);

            return NextResponse.json({
              data: {
                plan: "FREE",
                isValid: false,
                key: maskKey(license.key),
                activatedAt: license.activatedAt,
                expiresAt: license.expiresAt,
                email: license.email,
              },
            });
          }

          // Update plan in case it changed on the server
          const serverPlan = data.plan as "PRO" | "LIFETIME" | undefined;
          if (serverPlan && serverPlan !== license.plan) {
            await prisma.license.update({
              where: { id: license.id },
              data: { plan: serverPlan },
            });

            // Clear plan cache so the updated plan is picked up
            try {
              await Promise.race([
                redis.del("license:current_plan"),
                new Promise((_, reject) =>
                  setTimeout(() => reject(new Error("Redis timeout")), 2000)
                ),
              ]);
            } catch { /* Redis unavailable */ }

            recordRevalidation();

            return NextResponse.json({
              data: {
                plan: serverPlan,
                isValid: license.isValid,
                key: maskKey(license.key),
                activatedAt: license.activatedAt,
                expiresAt: license.expiresAt,
                email: license.email,
              },
            });
          }
        }

        // Record successful revalidation (license is still valid, no plan change)
        recordRevalidation();
      } catch (err) {
        // License server unreachable — use cached local data
        logger.warn("Could not reach license server for re-validation:", err);
      }
    }

    return NextResponse.json({
      data: {
        plan: license.plan,
        isValid: license.isValid,
        key: maskKey(license.key),
        activatedAt: license.activatedAt,
        expiresAt: license.expiresAt,
        email: license.email,
      },
    });
  } catch (err) {
    const { status, body } = errorResponse(err);
    return NextResponse.json(body, { status });
  }
}
