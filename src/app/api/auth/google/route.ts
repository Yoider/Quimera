import { NextRequest, NextResponse } from 'next/server';
import { getBaseUrl } from '@/lib/auth/urlHelper';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID no está configurado en el servidor.' },
      { status: 500 }
    );
  }

  // Safely resolve public base URL avoiding internal Docker hosts (0.0.0.0)
  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  const scope = encodeURIComponent('openid email profile');
  const state = Math.random().toString(36).substring(2, 15);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}
