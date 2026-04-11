const prefix = "[MangoRack]"

function timestamp(): string {
  return new Date().toISOString()
}

export const logger = {
  info(message: string, ...args: unknown[]) {
    console.info(`${timestamp()} ${prefix} ${message}`, ...args)
  },
  warn(message: string, ...args: unknown[]) {
    console.warn(`${timestamp()} ${prefix} ${message}`, ...args)
  },
  error(message: string, ...args: unknown[]) {
    console.error(`${timestamp()} ${prefix} ${message}`, ...args)
  },
}
