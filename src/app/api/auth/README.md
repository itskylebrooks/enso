# Auth route handlers

## Send Email Hook

`/api/auth/send-email` is configured as a Supabase Send Email Auth Hook. Supabase generates the OTP
and calls this route; the route verifies the Supabase hook signature and sends the code through
Resend.

Required environment variables:

```bash
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=Enso <onboarding@resend.dev>
SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxxxxxx
```

Replace `re_xxxxxxxxx` with the real Resend API key. For production, use a sender address on a
verified Resend domain instead of `onboarding@resend.dev`.
