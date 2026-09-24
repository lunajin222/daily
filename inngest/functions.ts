// src/inngest/functions.ts
import { inngest, dailyNewsRequested } from "./client";
import { NonRetriableError } from "inngest";
import { Resend } from "resend";
import {
  fetchAllNews,
  formatNewsSummary,
} from '../lib/rss_utils';

// 初始化 Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// 发件人与订阅者列表（segment）
// 生产环境请在 Vercel 里设置 RESEND_FROM，例如 "Daily Briefs <news@yourdomain.com>"。
// 没验证域名前只能用 onboarding@resend.dev，而它只能发给你 Resend 账号本人的邮箱。
const FROM = process.env.RESEND_FROM ?? "Daily Briefs <onboarding@resend.dev>";
const SEGMENT_ID = "cc3c642a-310f-4137-a574-28a2295712a5";

// 简单校验邮箱，避免把明显错误的地址交给 Resend
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const processTask = inngest.createFunction(
  { id: "process-task", triggers: { event: "app/task.created" } },
  async ({ event, step }) => {
    const result = await step.run("handle-task", async () => {
      return { processed: true, id: event.data.id };
    });

    await step.sleep("pause", "1s");

    return { message: `Task ${event.data.id} complete`, result };
  }
);

export const sendDailyNews = inngest.createFunction(
  {
    id: "send-daily-news",
    // 用 eventType 当触发器（不是字符串），这样 data 的结构是有类型的
    triggers: [{ event: dailyNewsRequested }]
  },
  async ({ event, step }) => {
    // 0. 读取事件数据。
    //    data 为空时 event.data 是 undefined，所以这里做防御性读取：
    //    有 email 就单发给这个人，没有就退回群发广播。
    const rawEmail = (event.data as { email?: unknown } | undefined)?.email;
    const email = typeof rawEmail === "string" ? rawEmail.trim() : "";

    if (email && !EMAIL_RE.test(email)) {
      // 数据本身有问题，重试多少次都没用，直接失败
      throw new NonRetriableError(`事件 data.email 不是合法邮箱: ${email}`);
    }

    // 1. 获取新闻
    const newsItems = await step.run("fetch-news", async () => {
      console.log("Fetching news items...");
      const news = await fetchAllNews();
      console.log("News fetched:", news.length);
      return news;
    });

    // 2. 整理新闻为每日摘要
    const summary = await step.run("format-news", async () => {
      console.log("Formatting news summary...");
      const formattedSummary = formatNewsSummary(newsItems);
      console.log("News summary formatted.");
      return formattedSummary;
    });

    // 3. 生成标题（放进 step 里，重放/重试时取到的是同一个值）
    const subject = await step.run("build-subject", async () => {
      const today = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      return `Daily Briefs - ${today}`;
    });

    // 4a. 事件里带了邮箱 -> 只发给这一个收件人
    if (email) {
      const sent = await step.run("send-email-to-recipient", async () => {
        console.log("Sending email to", email);
        const { data, error } = await resend.emails.send({
          from: FROM,
          to: email,
          subject,
          html: summary.html,
        });

        if (error) return { ok: false as const, error: error.message, id: null };
        return { ok: true as const, error: null, id: data.id };
      });

      if (!sent.ok) {
        console.error("Error sending email:", sent.error);
        return { message: sent.error, email };
      }

      return { message: `Email sent successfully to ${email}`, email, messageId: sent.id };
    }

    // 4b. 没带邮箱 -> 原逻辑：创建广播并群发给 segment
    const broadcast = await step.run("create-broadcast", async () => {
      console.log("Creating broadcast...");
      const { data, error } = await resend.broadcasts.create({
        from: FROM,
        segmentId: SEGMENT_ID,
        subject,
        html: summary.html,
      });

      // 注意：返回值是 { data, error }，广播 id 在 data.id 上，不在返回值本身上
      if (error) return { ok: false as const, error: error.message, id: null };
      return { ok: true as const, error: null, id: data.id };
    });

    if (!broadcast.ok) {
      console.error("Error creating broadcast:", broadcast.error);
      return { message: broadcast.error };
    }

    const sent = await step.run("send-broadcast", async () => {
      console.log("Sending broadcast...");
      const { data, error } = await resend.broadcasts.send(broadcast.id);

      if (error) return { ok: false as const, error: error.message, id: null };
      return { ok: true as const, error: null, id: data.id };
    });

    if (!sent.ok) {
      console.error("Error sending broadcast:", sent.error);
      return { message: sent.error };
    }

    return { message: "Email sent successfully to segment", messageId: sent.id };
  }
);
