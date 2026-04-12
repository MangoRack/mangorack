const prefix = "[MangoRack]"

function formatMessage(level: string, message: string, meta?: Record<string, unknown>): string {
  if (process.env.NODE_ENV === "production") {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    })
  }
  return `[${new Date().toISOString()}] ${prefix} [${level.toUpperCase()}] ${message}`
}

function parseMeta(args: unknown[]): Record<string, unknown> | undefined {
  if (args.length === 0) return undefined
  if (args.length === 1 && typeof args[0] === "object" && args[0] !== null && !(args[0] instanceof Error)) {
    return args[0] as Record<string, unknown>
  }
  return { extra: args.length === 1 ? args[0] : args }
}

export const logger = {
  info(message: string, ...args: unknown[]) {
    const meta = parseMeta(args)
    const formatted = formatMessage("info", message, meta)
    if (process.env.NODE_ENV === "production") {
      console.info(formatted)
    } else {
      console.info(formatted, ...args)
    }
  },
  warn(message: string, ...args: unknown[]) {
    const meta = parseMeta(args)
    const formatted = formatMessage("warn", message, meta)
    if (process.env.NODE_ENV === "production") {
      console.warn(formatted)
    } else {
      console.warn(formatted, ...args)
    }
  },
  error(message: string, ...args: unknown[]) {
    const meta = parseMeta(args)
    const formatted = formatMessage("error", message, meta)
    if (process.env.NODE_ENV === "production") {
      console.error(formatted)
    } else {
      console.error(formatted, ...args)
    }
  },
}
