import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { Webhook } from 'standardwebhooks';

export const runtime = 'nodejs';

type SendEmailHookPayload = {
  user: {
    email?: string | null;
    new_email?: string | null;
  };
  email_data: {
    token?: string | null;
    token_new?: string | null;
    email_action_type?: string | null;
  };
};

type EmailToSend = {
  to: string;
  token: string;
};

const getHookSecret = (): string | null => {
  const rawSecret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!rawSecret) return null;

  return rawSecret.replace(/^v\d+,whsec_/, '').replace(/^whsec_/, '');
};

const getActionLabel = (actionType?: string | null): string => {
  switch (actionType) {
    case 'signup':
      return 'Finish signing in to Enso';
    case 'magiclink':
      return 'Sign in to Enso';
    case 'recovery':
      return 'Recover your Enso account';
    case 'email_change':
      return 'Confirm your Enso email change';
    case 'reauthentication':
      return 'Confirm your Enso session';
    default:
      return 'Your Enso sign-in code';
  }
};

const buildPlainTextEmail = (token: string): string =>
  [
    `Your Enso sign-in code is: ${token}`,
    '',
    'Enter this code in Enso to finish signing in.',
    'If you did not request this code, you can ignore this email.',
  ].join('\n');

const buildHtmlEmail = (token: string): string => `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #18181b;">
    <p>Your Enso sign-in code is:</p>
    <p style="font-size: 28px; font-weight: 700; letter-spacing: 0.18em; margin: 16px 0;">${token}</p>
    <p>Enter this code in Enso to finish signing in.</p>
    <p style="color: #71717a; font-size: 14px;">If you did not request this code, you can ignore this email.</p>
  </div>
`;

const getEmailsToSend = ({ user, email_data: emailData }: SendEmailHookPayload): EmailToSend[] => {
  const emails: EmailToSend[] = [];

  if (user.email && emailData.token) {
    emails.push({ to: user.email, token: emailData.token });
  }

  if (user.new_email && emailData.token_new) {
    emails.push({ to: user.new_email, token: emailData.token_new });
  }

  return emails;
};

export async function POST(request: Request) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const hookSecret = getHookSecret();
  const from = process.env.RESEND_FROM_EMAIL ?? 'Enso <onboarding@resend.dev>';

  if (!resendApiKey || !hookSecret) {
    return NextResponse.json(
      { message: 'Resend email hook is not configured' },
      { status: 500 },
    );
  }

  const body = await request.text();
  const headers = Object.fromEntries(request.headers.entries());
  const webhook = new Webhook(hookSecret);

  let payload: SendEmailHookPayload;
  try {
    payload = webhook.verify(body, headers) as SendEmailHookPayload;
  } catch {
    return NextResponse.json({ message: 'Invalid email hook signature' }, { status: 401 });
  }

  const emailsToSend = getEmailsToSend(payload);
  if (emailsToSend.length === 0) {
    return NextResponse.json({ message: 'No email recipient or token provided' }, { status: 400 });
  }

  const resend = new Resend(resendApiKey);
  const subject = getActionLabel(payload.email_data.email_action_type);

  for (const email of emailsToSend) {
    const { error } = await resend.emails.send({
      from,
      to: [email.to],
      subject,
      text: buildPlainTextEmail(email.token),
      html: buildHtmlEmail(email.token),
    });

    if (error) {
      return NextResponse.json(
        { message: error.message || 'Failed to send OTP email' },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({});
}
