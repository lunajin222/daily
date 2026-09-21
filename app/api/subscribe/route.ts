import { Resend } from 'resend';
import{ NextResponse } from 'next/server';
export async function POST(request: Request) {
    const { email } = await request.json();
    console.log(email);
    const resend = new Resend(process.env.RESEND_API_KEY);
    //1.create an account
    const {error: createError } = await resend.contacts.create({
        email: email,
    });
    if (createError) {
        console.error('Error creating account:', createError);
        return NextResponse.json({"error": "Error creating account"}, { status: 500 });
    }
    //2.add account to contact list
    const { error: addError } = await resend.contacts.segments.add({
        email: email,
        segmentId:"cc3c642a-310f-4137-a574-28a2295712a5",
    });
    if (addError) {
        console.error('Error adding contact:', addError);
        return NextResponse.json({"error": "Error adding contact"}, { status: 500 });
    }
    return NextResponse.json({"message": "Subscribed successfully"}, { status: 200 });
}