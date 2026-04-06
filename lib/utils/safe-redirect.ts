export function getSafeRedirect(redirectTo: unknown): string {
  if (typeof redirectTo !== 'string') return '/';
  try {
    const url = new URL(redirectTo, 'http://localhost');
    if (url.origin !== 'http://localhost') return '/';
    return url.pathname + url.search + url.hash;
  } catch {
    return '/';
  }
}
