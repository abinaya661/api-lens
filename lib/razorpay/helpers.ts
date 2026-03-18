// ============================================
// Razorpay Helper Utilities
// ============================================

import crypto from 'crypto';

/**
 * Verify Razorpay webhook signature using HMAC-SHA256 with timing-safe comparison.
 */
export function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    return false;
  }
}

/**
 * Verify Razorpay payment signature (used for checkout verification).
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string,
): boolean {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );
  } catch {
    return false;
  }
}

/**
 * Calculate trial end date (7 days from now).
 */
export function getTrialEndDate(): Date {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date;
}

/**
 * Check if a subscription is in its trial period.
 */
export function isInTrial(trialEndsAt: string | null): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) > new Date();
}

/**
 * Check if a subscription is active (paid or in trial).
 */
export function isSubscriptionActive(
  plan: string,
  trialEndsAt: string | null,
  periodEnd: string | null,
): boolean {
  // Trial is still active
  if (plan === 'trial' && isInTrial(trialEndsAt)) return true;
  // Paid subscription hasn't expired
  if (periodEnd && new Date(periodEnd) > new Date()) return true;
  return false;
}
