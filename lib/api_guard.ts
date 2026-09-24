// lib/api_guard.ts
import { NextResponse } from "next/server";

function forbidden() {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

/**
 * 同源校验：只接受来自本站页面的请求（用于订阅表单这种「本来就得公开」的接口）。
 *
 * 浏览器对 POST 请求一定会带上 Origin，所以缺少 Origin 基本就说明不是页面发来的
 * （curl / 脚本），直接拒绝。这能挡住「别人做个页面诱导访客提交」以及大部分直接刷接口。
 *
 * 注意：Origin 是可以伪造的，这只是提高门槛。要真正抗刷量，需要 Vercel WAF 限流，
 * 或给表单加人机验证（Turnstile / reCAPTCHA）。
 */
export function assertSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin || !host) return forbidden();

  try {
    if (new URL(origin).host !== host) return forbidden();
  } catch {
    return forbidden();
  }

  return null;
}

/**
 * 密钥校验：用于服务端到服务端的接口（手动触发发送简报）。
 *
 * 没有配置 ADMIN_API_SECRET 时视为「接口已关闭」并返回 503 —— 宁可不可用，
 * 也不要默认对所有人开放。
 */
export function assertAdminSecret(request: Request): NextResponse | null {
  const expected = process.env.ADMIN_API_SECRET;

  if (!expected) {
    return NextResponse.json(
      { error: "Endpoint disabled: ADMIN_API_SECRET is not configured" },
      { status: 503 }
    );
  }

  if (request.headers.get("x-api-key") !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

// 按 IP 的简单限流。
// 注意：只存在于当前实例的内存里，冷启动会清空、多实例之间不共享，
// 所以只挡得住最朴素的循环刷接口。严格限流请用 Upstash Redis 或 Vercel WAF。
const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 5;
const counters = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}

export function assertRateLimit(key: string): NextResponse | null {
  const now = Date.now();

  // 顺手清理过期条目，避免这个 Map 无限增长
  if (counters.size > 1000) {
    for (const [k, v] of counters) {
      if (v.resetAt <= now) counters.delete(k);
    }
  }

  const entry = counters.get(key);

  if (!entry || entry.resetAt <= now) {
    counters.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return null;
  }

  entry.count += 1;

  if (entry.count > MAX_REQUESTS_PER_WINDOW) {
    return NextResponse.json(
      { error: "Too many requests, please try again later" },
      { status: 429 }
    );
  }

  return null;
}
