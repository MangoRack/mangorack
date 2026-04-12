/**
 * Shared URL safety validator to prevent SSRF attacks.
 * Blocks requests to internal/private networks, metadata endpoints,
 * and other potentially dangerous destinations.
 */

export interface UrlSafetyOptions {
  /** When true, allow RFC1918 private IPs (192.168.x.x, 10.x.x.x, 172.16-31.x.x).
   *  Cloud metadata endpoints and obfuscated IPs are still blocked. Defaults to false. */
  allowPrivateIPs?: boolean;
}

/** Hostnames that are always blocked regardless of options. */
const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "::1",
  "0.0.0.0",
  "[::]",
  "metadata.google.internal",
]);

/** Cloud metadata IP that must always be blocked, even when private IPs are allowed. */
const METADATA_IP = "169.254.169.254";

function isMetadataIPv4(hostname: string): boolean {
  return hostname === METADATA_IP;
}

function isRFC1918IPv4(hostname: string): boolean {
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

  return false;
}

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

function isIPv4MappedIPv6(hostname: string): { matched: boolean; inner?: string } {
  const match = hostname.match(/^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i);
  if (!match) return { matched: false };
  return { matched: true, inner: match[1] };
}

function isDecimalIP(hostname: string): boolean {
  return /^\d+$/.test(hostname);
}

function isHexIP(hostname: string): boolean {
  return hostname.toLowerCase().startsWith("0x");
}

function checkHost(hostname: string, options: UrlSafetyOptions = {}): boolean {
  const { allowPrivateIPs = false } = options;

  // Always block known dangerous hostnames (loopback, metadata)
  if (BLOCKED_HOSTNAMES.has(hostname)) return false;

  // Block hostnames containing ".." (directory traversal / malformed)
  if (hostname.includes("..")) return false;

  // Always block decimal IPs (obfuscated loopback/metadata trick)
  if (isDecimalIP(hostname)) return false;

  // Always block hex IPs (obfuscated loopback/metadata trick)
  if (isHexIP(hostname)) return false;

  // Always block the cloud metadata endpoint
  if (isMetadataIPv4(hostname)) return false;

  // Check IPv4-mapped IPv6
  const mapped = isIPv4MappedIPv6(hostname);
  if (mapped.matched && mapped.inner) {
    // Always block metadata via IPv6 mapping
    if (isMetadataIPv4(mapped.inner)) return false;
    // Always block loopback via IPv6 mapping
    if (mapped.inner.startsWith("127.")) return false;
    if (allowPrivateIPs) {
      // When private IPs allowed, only block non-RFC1918 private ranges via mapping
      // (loopback and metadata already handled above)
      return true;
    }
    // Block all private IPs via mapping
    if (isPrivateIPv4(mapped.inner)) return false;
  }

  if (allowPrivateIPs) {
    // When private IPs are allowed, skip RFC1918 checks but still block
    // link-local (169.254.x.x) and loopback (127.x.x.x)
    const parts = hostname.split(".");
    if (parts.length === 4) {
      const nums = parts.map(Number);
      if (!nums.some((n) => isNaN(n) || n < 0 || n > 255)) {
        // Block loopback range
        if (nums[0] === 127) return false;
        // Block link-local (covers metadata range too)
        if (nums[0] === 169 && nums[1] === 254) return false;
        // Allow RFC1918 ranges
        if (isRFC1918IPv4(hostname)) return true;
      }
    }
  } else {
    // Block all private/internal IPv4 ranges
    if (isPrivateIPv4(hostname)) return false;
  }

  return true;
}

export function isSafeUrl(urlString: string, options?: UrlSafetyOptions): boolean {
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

  return checkHost(url.hostname, options);
}

/**
 * Validates whether a hostname/IP is safe for TCP connections.
 * Similar to isSafeUrl but works on raw hostnames instead of full URLs.
 */
export function isSafeHost(host: string, options?: UrlSafetyOptions): boolean {
  return checkHost(host, options);
}
