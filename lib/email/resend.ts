import { Resend } from 'resend';
import { env } from '@/lib/env';

// Only initialize if we have a key
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Base sender address
const SENDER = env.RESEND_FROM_EMAIL || 'API Lens <noreply@apilens.tech>';
const REPLY_TO = 'support@apilens.tech';

export const EMAIL_FOOTER = `
<hr style="border: none; border-top: 1px solid #eaeaea; margin: 36px 0 24px 0;" />
<p style="color: #666666; font-size: 14px; line-height: 24px; margin: 0;">
  Need help or have questions?<br/>
  Contact our support team at <a href="mailto:support@apilens.tech" style="color: #000000; text-decoration: underline; font-weight: 500;">support@apilens.tech</a>
</p>
<p style="color: #999999; font-size: 12px; margin-top: 16px;">
  &copy; ${new Date().getFullYear()} API Lens. All rights reserved.
</p>
`;

// Helper for the top logo (using alt text as fallback if image doesn't load)
const LOGO_HEADER = `
<div style="margin-bottom: 32px;">
  <img src="https://apilens.tech/logo.jpg" alt="API Lens" height="48" style="display: block; width: auto; max-width: 100%;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
  <h2 style="display: none; margin: 0; color: #111; font-size: 22px;">API Lens</h2>
</div>
`;

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn(`[Email Skipped] Missing RESEND_API_KEY. Would have sent: "${subject}" to ${to}`);
    return { success: true };
  }

  try {
    const data = await resend.emails.send({
      from: SENDER,
      to,
      subject,
      replyTo: REPLY_TO,
      html: html + EMAIL_FOOTER,
    });
    
    if (data.error) {
      console.error('[Email Send Error]', data.error);
      return { success: false, error: data.error };
    }
    
    return { success: true, data };
  } catch (err) {
    console.error('[Email Send Error]', err);
    return { success: false, error: err };
  }
}

// Basic Welcome Email Template
export function getWelcomeEmailHtml() {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${LOGO_HEADER}
      <h1 style="color: #111; margin-top: 0; font-size: 24px;">Welcome to API Lens! 🚀</h1>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        We're incredibly thrilled to have you onboard. Your 7-day free trial has officially started &mdash; no credit card required.
      </p>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        With API Lens, you can instantly monitor, manage, and optimize all your AI API keys (OpenAI, Anthropic, Gemini, etc.) in one unified, beautiful dashboard.
      </p>
      <div style="margin: 36px 0;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Go to Dashboard
        </a>
      </div>
      <p style="font-size: 16px; color: #444;">Happy building!</p>
    </div>
  `;
}

// Transaction HTML Generator (Success, Failures, Downgrades)
export function getTransactionEmailHtml({ title, message, plan }: { title: string; message: string; plan?: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${LOGO_HEADER}
      <h2 style="color: #111; margin-top: 0; font-size: 22px;">${title}</h2>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">${message}</p>
      ${plan ? `<div style="background: #fafafa; border: 1px solid #eaeaea; padding: 16px; border-radius: 8px; margin-top: 24px;"><p style="font-size: 15px; color: #111; margin: 0;"><strong>Active Plan:</strong> <span style="text-transform: capitalize;">${plan}</span></p></div>` : ''}
    </div>
  `;
}

// Alert/Budget HTML Generator
export function getAlertEmailHtml({ title, message, severity }: { title: string; message: string; severity: 'info' | 'warning' | 'critical' }) {
  const color = severity === 'critical' ? '#dc2626' : severity === 'warning' ? '#d97706' : '#2563eb';
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-top: 4px solid ${color}; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${LOGO_HEADER}
      <h2 style="color: ${color}; margin-top: 0; font-size: 22px;">${title}</h2>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">${message}</p>
      <div style="margin: 32px 0;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          View details in Dashboard
        </a>
      </div>
    </div>
  `;
}

// Trial Expiration HTML Generator
export function getTrialWarningEmailHtml({ daysLeft }: { daysLeft: number }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${LOGO_HEADER}
      <h2 style="color: #111; margin-top: 0; font-size: 22px;">Your Free Trial Ends Soon ⏱️</h2>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        Your API Lens free trial will expire in <strong>${daysLeft === 1 ? '24 hours' : daysLeft + ' days'}</strong>. 
      </p>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        To ensure uninterrupted access to your API keys and analytics, please select a plan and securely add a payment method before your trial concludes.
      </p>
      <div style="margin: 36px 0;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard/subscription" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Select a Plan
        </a>
      </div>
    </div>
  `;
}

// Budget Specific Alert HTML Generator
export function getBudgetAlertEmailHtml({ budgetName, thresholdPercent, spent, limit }: { budgetName: string; thresholdPercent: number; spent: string; limit: string }) {
  const isCritical = thresholdPercent >= 100;
  const color = isCritical ? '#dc2626' : '#d97706';
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border-top: 4px solid ${color}; background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
      ${LOGO_HEADER}
      <h2 style="color: ${color}; margin-top: 0; font-size: 22px;">Budget Alert: ${thresholdPercent}% Reached</h2>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        Your budget <strong>"${budgetName}"</strong> has reached ${thresholdPercent}% of its defined limit.
      </p>
      <div style="background: #fafafa; border: 1px solid #eaeaea; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="font-size: 15px; color: #111; margin: 0 0 8px 0;"><strong>Current Spend:</strong> ${spent}</p>
        <p style="font-size: 15px; color: #111; margin: 0;"><strong>Budget Limit:</strong> ${limit}</p>
      </div>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        ${isCritical ? 'You have officially exceeded your limit! Consider pausing intensive API keys or adjusting the budget via your dashboard.' : 'Keep an eye on this project/key to ensure you do not exceed your limit before the billing cycle resets.'}
      </p>
      <div style="margin: 32px 0;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard/budgets" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          Manage Budgets
        </a>
      </div>
    </div>
  `;
}

// Weekly Digest HTML Generator
export function getWeeklyDigestEmailHtml({ totalRequests, costStr }: { totalRequests: string; costStr: string }) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${LOGO_HEADER}
      <h2 style="color: #111; margin-top: 0; font-size: 22px;">Your Weekly API Digest 📊</h2>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        Here is a quick snapshot of your team's AI API usage over the past 7 days across all active keys.
      </p>
      <div style="background: #fafafa; border: 1px solid #eaeaea; padding: 20px; border-radius: 8px; margin: 24px 0;">
        <p style="font-size: 16px; color: #111; margin: 0 0 12px 0;"><strong>Total API Requests:</strong> ${totalRequests}</p>
        <p style="font-size: 16px; color: #111; margin: 0;"><strong>Estimated Cost:</strong> ${costStr}</p>
      </div>
      <p style="font-size: 16px; color: #444; line-height: 1.6;">
        Log in to your API Lens dashboard to view deep-dive analytics, break down spending by provider, and tweak rate limits.
      </p>
      <div style="margin: 36px 0;">
        <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard" style="background-color: #000; color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
          View Full Analytics
        </a>
      </div>
    </div>
  `;
}
