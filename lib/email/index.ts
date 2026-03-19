interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'API Lens <noreply@apilens.dev>';

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<{ success: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { success: false, error: `Resend API error ${res.status}: ${body}` };
    }

    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
