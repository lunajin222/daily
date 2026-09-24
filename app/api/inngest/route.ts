// src/app/api/inngest/route.ts
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { processTask, sendDailyNews } from "../../../inngest/functions";

// Vercel：每次 step 执行都会打到这个路由，抓 10 个 RSS 源比较慢，
// 留足时间（Hobby 计划上限 60s，Pro 更高）
export const maxDuration = 60;

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    processTask,
    sendDailyNews
    ],
});

