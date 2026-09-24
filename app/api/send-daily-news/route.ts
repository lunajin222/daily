// app/api/send-daily-news/route.ts
import { NextResponse } from "next/server";
import { inngest, dailyNewsRequested } from "../../../inngest/client";

/**
 * 触发 app/daily.news 事件，并把用户提交的邮箱放进 data。
 *
 *    curl -X POST http://localhost:3000/api/send-daily-news \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"user@example.com"}'
 */
export async function POST(request: Request) {
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
