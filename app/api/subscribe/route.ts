import { Resend } from 'resend';
import{ NextResponse } from 'next/server';
import { inngest, dailyNewsRequested } from "../../../inngest/client";
import { assertRateLimit, assertSameOrigin, clientIp } from "../../../lib/api_guard";
export async function POST(request: Request) {
    // 0.公开接口，但要挡住刷量：先按 IP 限流，再校验同源
    const limited = assertRateLimit(clientIp(request));
    if (limited) return limited;

    const wrongOrigin = assertSameOrigin(request);
    if (wrongOrigin) return wrongOrigin;

    const { email } = await request.json();
    console.log(email);

    // 1.校验邮箱：非法邮箱不建联系人，也不发事件
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return NextResponse.json({"error": "A valid email is required"}, { status: 400 });
    }
    const to = email.trim();

    const resend = new Resend(process.env.RESEND_API_KEY);
    //2.create an account
    const {error: createError } = await resend.contacts.create({
        email: to,
    });
    if (createError) {
        console.error('Error creating account:', createError);
        return NextResponse.json({"error": "Error creating account"}, { status: 500 });
    }
    //3.add account to contact list
    const { error: addError } = await resend.contacts.segments.add({
        email: to,
        segmentId:"cc3c642a-310f-4137-a574-28a2295712a5",
    });
    if (addError) {
        console.error('Error adding contact:', addError);
        return NextResponse.json({"error": "Error adding contact"}, { status: 500 });
    }

    //4.触发 app/daily.news 事件，data 里带上用户刚提交的邮箱
    //  -> send-daily-news 会把每日简报只发到这个地址
    await inngest.send(dailyNewsRequested.create({ email: to }));

    return NextResponse.json({"message": "Subscribed successfully"}, { status: 200 });
}