import { execFile } from "child_process";
import * as net from "net";

export interface CheckResult {
  status: "UP" | "DOWN" | "DEGRADED";
  responseTime: number;
  statusCode?: number;
  error?: string;
}

export async function checkHTTP(
  url: string,
  method: string = "GET",
  expectedStatus: number = 200,
  timeout: number = 10,
  headers?: Record<string, string>,
  body?: string
): Promise<CheckResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);
  const start = Date.now();

  try {
    const fetchOptions: RequestInit = {
      method,
      signal: controller.signal,
      headers: {
        "User-Agent": "MangoRack/1.0 UptimeChecker",
        ...(headers || {}),
      },
      redirect: "follow",
    };

    if (body && method !== "GET" && method !== "HEAD") {
      fetchOptions.body = body;
    }

    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - start;

    clearTimeout(timeoutId);

    const status = response.status === expectedStatus ? "UP" : "DEGRADED";
    return {
      status,
      responseTime,
      statusCode: response.status,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - start;
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";
    const isTimeout =
      errorMessage.includes("abort") || errorMessage.includes("timeout");

    return {
      status: "DOWN",
      responseTime,
      error: isTimeout ? `Timeout after ${timeout}s` : errorMessage,
    };
  }
}

export async function checkTCP(
  host: string,
  port: number,
  timeout: number = 10
): Promise<CheckResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(timeout * 1000);

    socket.on("connect", () => {
      const responseTime = Date.now() - start;
      socket.destroy();
      resolve({ status: "UP", responseTime });
    });

    socket.on("timeout", () => {
      socket.destroy();
      const responseTime = Date.now() - start;
      resolve({
        status: "DOWN",
        responseTime,
        error: `TCP timeout after ${timeout}s`,
      });
    });

    socket.on("error", (err: Error) => {
      const responseTime = Date.now() - start;
      resolve({
        status: "DOWN",
        responseTime,
        error: err.message,
      });
    });

    socket.connect(port, host);
  });
}

// Strict hostname/IP validation to prevent command injection
const VALID_HOST = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

export async function checkPing(
  host: string,
  timeout: number = 10
): Promise<CheckResult> {
  if (!VALID_HOST.test(host) || host.length > 253) {
    return {
      status: "DOWN",
      responseTime: 0,
      error: "Invalid hostname",
    };
  }

  return new Promise((resolve) => {
    const start = Date.now();
    const isWindows = process.platform === "win32";
    const args = isWindows
      ? ["-n", "1", "-w", String(timeout * 1000), host]
      : ["-c", "1", "-W", String(timeout), host];

    execFile("ping", args, { timeout: (timeout + 5) * 1000 }, (error, stdout) => {
      const responseTime = Date.now() - start;

      if (error) {
        resolve({
          status: "DOWN",
          responseTime,
          error: `Ping failed: ${error.message}`,
        });
        return;
      }

      // Parse response time from ping output
      let parsedTime = responseTime;
      const timeMatch = stdout.match(
        isWindows ? /time[=<](\d+)ms/i : /time[=](\d+\.?\d*)\s*ms/i
      );
      if (timeMatch) {
        parsedTime = Math.round(parseFloat(timeMatch[1]));
      }

      resolve({
        status: "UP",
        responseTime: parsedTime,
      });
    });
  });
}
