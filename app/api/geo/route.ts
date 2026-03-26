import { NextRequest } from 'next/server';

// Returns the visitor's country code (ISO 3166-1 alpha-2) using
// Vercel's free geo header — no external service needed.
// Falls back to 'US' in local dev where the header is absent.
export async function GET(req: NextRequest) {
  const country = req.headers.get('x-vercel-ip-country') ?? 'US';
  return Response.json({ country });
}
