import { NextRequest } from 'next/server';

/**
 * Resolves the true public base URL of the application, taking into account
 * reverse proxies (x-forwarded-host, x-forwarded-proto) and Docker internal hosts (0.0.0.0).
 */
export function getBaseUrl(request: NextRequest): string {
  // 1. If an explicit public URL is configured in environment and it's not internal (0.0.0.0)
  const envUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envUrl && !envUrl.includes('0.0.0.0') && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }

  // 2. Read headers from reverse proxy (Nginx, Traefik, Cloudflare, etc.)
  const forwardedHost = request.headers.get('x-forwarded-host');
  const hostHeader = request.headers.get('host');
  const host = forwardedHost || (hostHeader && !hostHeader.includes('0.0.0.0') ? hostHeader : null);

  if (host) {
    const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    return `${proto}://${host}`;
  }

  // 3. Fallback to envUrl if local or production domain
  if (envUrl && !envUrl.includes('0.0.0.0')) {
    return envUrl.replace(/\/$/, '');
  }

  return 'https://quimera.n0v4.es';
}
