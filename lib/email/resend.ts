import { Resend } from 'resend';
import { env } from '@/lib/env';

// Only initialize if we have a key
export const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

// Base sender address
const SENDER = env.RESEND_FROM_EMAIL || 'API Lens <noreply@apilens.tech>';
const REPLY_TO = 'support@apilens.tech';

export const EMAIL_FOOTER = `
<div style="text-align: center; margin-top: 48px; padding-top: 32px; border-top: 1px solid #f0f0f0;">
  <p style="color: #6b7280; font-size: 14px; line-height: 24px; margin: 0;">
    Need help? Contact our support team at <a href="mailto:support@apilens.tech" style="color: #3b82f6; text-decoration: none; font-weight: 600;">support@apilens.tech</a>
  </p>
  <div style="margin-top: 16px;">
    <a href="https://apilens.tech" style="color: #9ca3af; text-decoration: none; font-size: 12px; margin: 0 8px;">Website</a>
    <a href="https://apilens.tech/dashboard" style="color: #9ca3af; text-decoration: none; font-size: 12px; margin: 0 8px;">Dashboard</a>
    <a href="https://apilens.tech/privacy" style="color: #9ca3af; text-decoration: none; font-size: 12px; margin: 0 8px;">Privacy</a>
  </div>
  <p style="color: #9ca3af; font-size: 12px; margin-top: 16px; font-weight: 500;">
    &copy; ${new Date().getFullYear()} API Lens. All rights reserved.
  </p>
</div>
`;

const LOGO_HEADER = `
<div style="text-align: center; margin-bottom: 40px; padding-bottom: 32px; border-bottom: 1px solid #f0f0f0;">
  <a href="https://apilens.tech" style="text-decoration: none;">
    <img src="https://apilens.tech/logo.jpg" alt="API Lens" height="56" style="display: block; margin: 0 auto; outline: none; border: none; text-decoration: none;" />
  </a>
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

export function getWelcomeEmailHtml() {
  return `
    <div style="background-color: #f9f9fb; padding: 40px 20px; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
        ${LOGO_HEADER}
        <h1 style="color: #111827; margin: 0 0 20px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.3;">Welcome to API Lens! 🚀</h1>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0 0 16px 0;">
          We're incredibly thrilled to have you onboard. Your 7-day free trial has officially started &mdash; no credit card required.
        </p>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0 0 40px 0;">
          With API Lens, you can instantly monitor, manage, and optimize all your AI API keys (OpenAI, Anthropic, Gemini, and more) in one unified dashboard.
        </p>
        <div style="text-align: center; margin-bottom: 24px;">
          <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard" style="background-color: #111827; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block;">
            Go to Dashboard
          </a>
        </div>
        <p style="font-size: 15px; color: #6b7280; text-align: center; margin: 0;">Happy building!</p>
      </div>
    </div>
  `;
}

export function getTransactionEmailHtml({ title, message, plan }: { title: string; message: string; plan?: string }) {
  return `
    <div style="background-color: #f9f9fb; padding: 40px 20px; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
        ${LOGO_HEADER}
        <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 24px; font-weight: 800; letter-spacing: -0.01em;">${title}</h2>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.6; margin-bottom: 24px;">${message}</p>
        ${plan ? `
          <div style="background-color: #f3f4f6; border: 1px solid #e5e7eb; padding: 24px; border-radius: 16px; margin: 32px 0;">
            <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; font-weight: 700; margin: 0 0 8px 0;">Current Plan</p>
            <p style="font-size: 20px; color: #111827; font-weight: 800; margin: 0; text-transform: capitalize;">${plan}</p>
          </div>
        ` : ''}
        <div style="text-align: center; margin-top: 32px;">
          <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard/subscription" style="color: #3b82f6; text-decoration: none; font-weight: 700; font-size: 14px;">View Billing Details &rarr;</a>
        </div>
      </div>
    </div>
  `;
}

export function getAlertEmailHtml({ title, message, severity }: { title: string; message: string; severity: 'info' | 'warning' | 'critical' }) {
  const color = severity === 'critical' ? '#ef4444' : severity === 'warning' ? '#f59e0b' : '#3b82f6';
  const bgColor = severity === 'critical' ? '#fef2f2' : severity === 'warning' ? '#fffbeb' : '#eff6ff';
  
  return `
    <div style="background-color: #f9f9fb; padding: 40px 20px; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border-top: 6px solid ${color};">
        ${LOGO_HEADER}
        <div style="background-color: ${bgColor}; color: ${color}; padding: 8px 16px; border-radius: 99px; display: inline-block; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">
          ${severity} Alert
        </div>
        <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;">${title}</h2>
        <p style="font-size: 18px; color: #4b5563; line-height: 1.6; margin-bottom: 40px;">${message}</p>
        <div style="text-align: center;">
          <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard" style="background-color: ${color}; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
            Take Action
          </a>
        </div>
      </div>
    </div>
  `;
}

export function getTrialWarningEmailHtml({ daysLeft }: { daysLeft: number }) {
  const isLastDay = daysLeft <= 1;
  return `
    <div style="background-color: #f9f9fb; padding: 40px 20px; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
        ${LOGO_HEADER}
        <div style="text-align: center;">
          <div style="background-color: #fff7ed; color: #c2410c; padding: 8px 16px; border-radius: 99px; display: inline-block; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 24px;">
            Trial Update
          </div>
          <h2 style="color: #111827; margin: 0 0 16px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;">Your free trial expires ${isLastDay ? 'tomorrow' : 'in ' + daysLeft + ' days'}</h2>
          <p style="font-size: 18px; color: #4b5563; line-height: 1.6; margin-bottom: 40px;">
            Don't lose track of your spend. Select a plan now to ensure your API keys keep syncing without interruption.
          </p>
          <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard/subscription" style="background-color: #3b82f6; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block;">
            Unlock Pro Access
          </a>
        </div>
      </div>
    </div>
  `;
}

export function getBudgetAlertEmailHtml({ budgetName, thresholdPercent, spent, limit }: { budgetName: string; thresholdPercent: number; spent: string; limit: string }) {
  const isCritical = thresholdPercent >= 100;
  const color = isCritical ? '#ef4444' : '#f59e0b';
  return `
    <div style="background-color: #f9f9fb; padding: 40px 20px; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03); border-top: 6px solid ${color};">
        ${LOGO_HEADER}
        <h2 style="color: #111827; margin: 0 0 24px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.2;">Budget Alert: ${thresholdPercent}% Reached</h2>
        <p style="font-size: 18px; color: #4b5563; line-height: 1.6; margin-bottom: 32px;">
          Your budget <strong>"${budgetName}"</strong> has crossed a major threshold.
        </p>
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 32px; border-radius: 20px; margin-bottom: 32px;">
          <div style="margin-bottom: 24px;">
            <p style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #6b7280; font-weight: 700; margin: 0 0 4px 0;">Spent So Far</p>
            <p style="font-size: 32px; color: #111827; font-weight: 800; margin: 0;">${spent}</p>
          </div>
          <div style="width: 100%; height: 8px; background-color: #e5e7eb; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
            <div style="width: ${Math.min(thresholdPercent, 100)}%; height: 100%; background-color: ${color};"></div>
          </div>
          <p style="font-size: 14px; color: #6b7280; font-weight: 500; margin: 0;">Limit: ${limit}</p>
        </div>
        <div style="text-align: center;">
          <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard/budgets" style="background-color: #111827; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block;">
            Manage Budgets
          </a>
        </div>
      </div>
    </div>
  `;
}

export function getWaitlistConfirmationEmailHtml() {
  return `
    <div style="background-color: #f9f9fb; padding: 40px 20px; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
        ${LOGO_HEADER}
        <h1 style="color: #111827; margin: 0 0 20px 0; font-size: 28px; font-weight: 800; letter-spacing: -0.025em; line-height: 1.3;">You're on the list! 🎉</h1>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0 0 16px 0;">
          Thank you for joining the API Lens Pro waitlist. We're excited to have you interested in what we're building.
        </p>
        <p style="font-size: 16px; color: #4b5563; line-height: 1.7; margin: 0 0 40px 0;">
          We'll reach out to you as soon as Pro access is available. You'll be among the first to know.
        </p>
        <p style="font-size: 15px; color: #6b7280; margin: 0;">— The API Lens Team</p>
      </div>
    </div>
  `;
}

export function getWeeklyDigestEmailHtml({ totalRequests, costStr }: { totalRequests: string; costStr: string }) {
  return `
    <div style="background-color: #f9f9fb; padding: 40px 20px; font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 48px; border-radius: 24px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);">
        ${LOGO_HEADER}
        <h2 style="color: #111827; margin: 0 0 12px 0; font-size: 28px; font-weight: 800; text-align: center; letter-spacing: -0.02em;">Weekly Digest 📊</h2>
        <p style="font-size: 18px; color: #4b5563; line-height: 1.6; text-align: center; margin-bottom: 40px;">
          Your AI spending summary for the past 7 days.
        </p>
        <div style="background-color: #f3f4f6; border-radius: 20px; padding: 32px; margin-bottom: 40px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 24px;">
            <div style="width: 48%;">
              <p style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin: 0 0 4px 0;">Requests</p>
              <p style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">${totalRequests}</p>
            </div>
            <div style="width: 48%; text-align: right;">
              <p style="font-size: 12px; font-weight: 800; text-transform: uppercase; color: #6b7280; margin: 0 0 4px 0;">Est. Cost</p>
              <p style="font-size: 24px; font-weight: 800; color: #111827; margin: 0;">${costStr}</p>
            </div>
          </div>
          <div style="height: 1px; background-color: #e5e7eb; margin-bottom: 20px;"></div>
          <p style="font-size: 14px; color: #6b7280; margin: 0; text-align: center;">Visit the dashboard for provider-level breakdown.</p>
        </div>
        <div style="text-align: center;">
          <a href="${env.NEXT_PUBLIC_APP_URL || 'https://apilens.tech'}/dashboard" style="background-color: #3b82f6; color: #ffffff; padding: 18px 36px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; display: inline-block;">
            Full Analytics
          </a>
        </div>
      </div>
    </div>
  `;
}
