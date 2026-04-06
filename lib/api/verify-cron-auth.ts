import { timingSafeEqual } from 'crypto';

export function verifyCronAuth(authHeader: string | null, secret: string): boolean {
  if (!authHeader || !secret) return false;
  const provided = Buffer.from(authHeader);
  const expected = Buffer.from(`Bearer ${secret}`);
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(provided, expected);
  } catch {
    return false;
  }
}
