export async function register() {
  // Validate all env vars at startup — crashes with a clear message if any are missing
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/env')
  }
}
