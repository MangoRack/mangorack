import { generateLicenseKey } from "../src/lib/license"

function main() {
  const args = process.argv.slice(2)

  let plan: "PRO" | "LIFETIME" = "PRO"
  let expiresAt: Date | undefined

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--plan" && args[i + 1]) {
      const p = args[i + 1].toUpperCase()
      if (p !== "PRO" && p !== "LIFETIME") {
        console.error("Error: --plan must be PRO or LIFETIME")
        process.exit(1)
      }
      plan = p as "PRO" | "LIFETIME"
      i++
    } else if (args[i] === "--expires" && args[i + 1]) {
      const date = new Date(args[i + 1])
      if (isNaN(date.getTime())) {
        console.error("Error: --expires must be a valid date (YYYY-MM-DD)")
        process.exit(1)
      }
      expiresAt = date
      i++
    } else if (args[i] === "--help" || args[i] === "-h") {
      console.log("Usage: generate-license [options]")
      console.log("")
      console.log("Options:")
      console.log("  --plan PRO|LIFETIME    License plan (default: PRO)")
      console.log("  --expires YYYY-MM-DD   Expiration date (optional)")
      console.log("  --help, -h             Show this help message")
      process.exit(0)
    }
  }

  const key = generateLicenseKey(plan, expiresAt)

  console.log("")
  console.log("MangoLab License Key Generated")
  console.log("==============================")
  console.log(`Plan:    ${plan}`)
  console.log(`Expires: ${expiresAt ? expiresAt.toISOString().split("T")[0] : "Never"}`)
  console.log(`Key:     ${key}`)
  console.log("")
}

main()
