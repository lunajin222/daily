// app/api/send-daily-news/route.ts
import { NextResponse } from "next/server";
import { inngest, dailyNewsRequested } from "../../../inngest/client";
import { assertAdminSecret } from "../../../lib/api_guard";

/**
 * 触发 app/daily.news 事件，并把用户提交的邮箱放进 data。
 * 这个接口只能由服务端调用，必须带 x-api-key（值来自 ADMIN_API_SECRET）。
 *
 *    curl -X POST http://localhost:3000/api/send-daily-news \
 *     -H "Content-Type: application/json" \
 *     -H "x-api-key: $ADMIN_API_SECRET" \
 *     -d '{"email":"user@example.com"}'
 */
export async function POST(request: Request) {
  // 0.先验密钥，没配 ADMIN_API_SECRET 时接口直接关闭（503）
  const unauthorized = assertAdminSecret(request);
  if (unauthorized) return unauthorized;

  let email: unknown;

  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const to = email.trim();

  // create() 现在要求显式传 data，所以事件一定带着 email 出去
  await inngest.send(dailyNewsRequested.create({ email: to }));

  return NextResponse.json({ message: "Event sent", email: to });
}
