const REQUIRED_ENV = ["DATABASE_URL", "NEXTAUTH_SECRET"] as const

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_SECRET.length < 32) {
  throw new Error("NEXTAUTH_SECRET must be at least 32 characters")
}

const PLACEHOLDER_SECRETS = ["your-secret-here-min-32-chars", "change-me", "changeme"]
if (PLACEHOLDER_SECRETS.some(p => process.env.NEXTAUTH_SECRET?.includes(p))) {
  throw new Error("NEXTAUTH_SECRET contains a placeholder value — set a real secret")
}
