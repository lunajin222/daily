// src/inngest/client.ts
import { Inngest, eventType, staticSchema } from "inngest";

export const inngest = new Inngest({ id: "my-app" });

/**
 * app/daily.news 事件的数据结构。
 *
 * email 是可选的，但语义很明确：
 * - 带了 email：只为这一个邮箱发送每日简报（例如用户刚在页面提交的邮箱）
 * - 没带 email：走原来的“群发广播”逻辑，发给 segment 里的所有订阅者
 *
 * 用 eventType 声明后：
 * - dailyNewsRequested.create({ email }) 必须显式传 data，不会再发出空 data 的事件
 * - 函数里的 event.data 也会按这个结构推导类型
 */
export const dailyNewsRequested = eventType("app/daily.news", {
  schema: staticSchema<{ email?: string }>(),
});
