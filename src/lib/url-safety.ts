/**
 * Shared URL safety validator to prevent SSRF attacks.
 * Blocks requests to internal/private networks, metadata endpoints,
 * and other potentially dangerous destinations.
 */

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "[::]",
  "metadata.google.internal",
]);

function isPrivateIPv4(hostname: string): boolean {
  // Match x.x.x.x pattern
  const parts = hostname.split(".");
  if (parts.length !== 4) return false;
  const nums = parts.map(Number);
  if (nums.some((n) => isNaN(n) || n < 0 || n > 255)) return false;

  // 10.0.0.0/8
  if (nums[0] === 10) return true;
  // 172.16.0.0/12
  if (nums[0] === 172 && nums[1] >= 16 && nums[1] <= 31) return true;
  // 192.168.0.0/16
  if (nums[0] === 192 && nums[1] === 168) return true;
  // 169.254.0.0/16 (link-local / AWS metadata)
  if (nums[0] === 169 && nums[1] === 254) return true;
  // 127.0.0.0/8 (loopback range)
  if (nums[0] === 127) return true;

  return false;
}

function isIPv4MappedIPv6Blocked(hostname: string): boolean {
  // Match ::ffff:x.x.x.x
  const match = hostname.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (!match) return false;
  const inner = match[1];
  // Block if the inner IPv4 is private or loopback
  return isPrivateIPv4(inner) || inner === "127.0.0.1";
}

function isDecimalIP(hostname: string): boolean {
  return /^\d+$/.test(hostname);
}

function isHexIP(hostname: string): boolean {
  return hostname.toLowerCase().startsWith("0x");
}

export function isSafeUrl(urlString: string): boolean {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    return false;
  }

  // Only allow http and https protocols
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return false;
  }

  const hostname = url.hostname;

  // Block known dangerous hostnames
  if (BLOCKED_HOSTNAMES.has(hostname)) return false;

  // Block hostnames containing ".." (directory traversal / malformed)
  if (hostname.includes("..")) return false;

  // Block decimal IPs (all-numeric hostnames)
  if (isDecimalIP(hostname)) return false;

  // Block hex IPs
  if (isHexIP(hostname)) return false;

  // Block private/internal IPv4 ranges
  if (isPrivateIPv4(hostname)) return false;

  // Block IPv4-mapped IPv6 addresses pointing to internal ranges
  if (isIPv4MappedIPv6Blocked(hostname)) return false;

  return true;
}

/**
 * Validates whether a hostname/IP is safe for TCP connections.
 * Similar to isSafeUrl but works on raw hostnames instead of full URLs.
 */
export function isSafeHost(host: string): boolean {
  if (BLOCKED_HOSTNAMES.has(host)) return false;
  if (host.includes("..")) return false;
  if (isDecimalIP(host)) return false;
  if (isHexIP(host)) return false;
  if (isPrivateIPv4(host)) return false;
  if (isIPv4MappedIPv6Blocked(host)) return false;
  return true;
}
