import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID no está configurado en el servidor.' },
      { status: 500 }
    );
  }

  // Dynamically resolve redirect URI according to origin (localhost:3000 or quimera.n0v4.es)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || 'localhost:3000';
  const proto = request.headers.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  const redirectUri = `${proto}://${host}/api/auth/callback/google`;

  const scope = encodeURIComponent('openid email profile');
  const state = Math.random().toString(36).substring(2, 15);

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}&state=${state}&prompt=select_account`;

  return NextResponse.redirect(googleAuthUrl);
}
