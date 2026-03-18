// ============================================
// Razorpay Plan IDs
// ============================================

export function getMonthlyPlanId(): string {
  const planId = process.env.RAZORPAY_PLAN_MONTHLY;
  if (!planId) throw new Error('RAZORPAY_PLAN_MONTHLY not configured');
  return planId;
}

export function getAnnualPlanId(): string {
  const planId = process.env.RAZORPAY_PLAN_ANNUAL;
  if (!planId) throw new Error('RAZORPAY_PLAN_ANNUAL not configured');
  return planId;
}

export const PLAN_PRICES = {
  monthly: 499, // INR 499 ≈ USD 5.99
  annual: 4999, // INR 4999 ≈ USD 59.99/year
} as const;
