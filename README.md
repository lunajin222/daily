This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## 部署到 Vercel（公网）

本项目依赖三个外部服务：Resend（发信）、Inngest（工作流）、多个 RSS 源。
部署到公网时，**Inngest 的本地 Dev Server（`:8288`）用不了**，必须换成 Inngest Cloud。

### 1. 在 Vercel 里配置环境变量

Vercel 项目 → Settings → Environment Variables：

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `RESEND_API_KEY` | ✅ | Resend 的 API Key（本地 `.env` 里那个） |
| `INNGEST_EVENT_KEY` | ✅ | Inngest Cloud 应用的 Event Key，`inngest.send()` 需要 |
| `INNGEST_SIGNING_KEY` | ✅ | Inngest Cloud 应用的 Signing Key；线上缺了会报 `In cloud mode but no signing key found` |
| `RESEND_FROM` | 可选 | 例如 `Daily Briefs <news@yourdomain.com>`；不设置则退回 `onboarding@resend.dev`，而它**只能发给你 Resend 账号本人的邮箱** |

> ⚠️ 不要把本地 `.env.local` 里的 `INNGEST_DEV=1` 配到 Vercel —— 那是本地开发开关，会让线上实例去找本地 Dev Server。

### 2. 部署

1. 打开 <https://vercel.com/new>
2. Import 仓库 `lunajin222/daily`，Framework 会自动识别为 Next.js，其余保持默认
3. 填上第 1 步的环境变量
4. Deploy

### 3. 让 Inngest Cloud 接管工作流

部署完成后，在 [Inngest Cloud](https://app.inngest.com) 里 Sync 一个 App，URL 填：

```
https://<你的项目名>.vercel.app/api/inngest
```

Sync 成功后，Runs / Events 面板都在云端看；本地 `:8288` 只用于本地开发。

### 4. 让每日简报真的「每日」发送

`send-daily-news` 目前只有事件触发器，线上不会自动发送。要每天定时发送，给它加一个 cron 触发器：

```ts
import { cron } from "inngest";

triggers: [
  { event: dailyNewsRequested },
  cron("TZ=Asia/Shanghai 0 8 * * *"),
]
```

定时触发时事件里没有 `email`，会走 broadcast 分支，群发给 segment 里的所有订阅者。
cron 支持 `TZ=` 前缀指定时区，详见 [Inngest 定时函数文档](https://www.inngest.com/docs/guides/scheduled-functions)。

### 5. 上线前检查清单

- [ ] `npm run build` 能通过
- [ ] 三个环境变量都已配置（`RESEND_API_KEY`、`INNGEST_EVENT_KEY`、`INNGEST_SIGNING_KEY`）
- [ ] Resend 里验证自己的发件域名，并把 `RESEND_FROM` 指向该域名，否则只能给自己发信

