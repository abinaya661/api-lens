export function getSafeRedirect(next: string | null): string {
  if (!next) return '/dashboard';
  if (!next.startsWith('/') || next.startsWith('//')) return '/dashboard';
  try {
    const url = new URL(next, 'http://dummy');
    if (url.hostname !== 'dummy') return '/dashboard';
  } catch {
    return '/dashboard';
  }
  return next;
}
