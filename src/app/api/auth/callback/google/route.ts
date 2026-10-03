import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createSession, SessionUser } from '@/lib/auth/session';
import { getBaseUrl } from '@/lib/auth/urlHelper';

export async function GET(request: NextRequest) {
  const baseUrl = getBaseUrl(request);
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error || !code) {
    console.error('Google OAuth callback error or code missing:', error);
    return NextResponse.redirect(`${baseUrl}/login?error=google_cancelled`);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Missing Google OAuth environment variables');
    return NextResponse.redirect(`${baseUrl}/login?error=server_configuration`);
  }

  const redirectUri = `${baseUrl}/api/auth/callback/google`;

  try {
    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error('Failed to exchange code with Google:', errText);
      return NextResponse.redirect(`${baseUrl}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch user profile from Google UserInfo endpoint
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userInfoResponse.ok) {
      console.error('Failed to fetch user info from Google');
      return NextResponse.redirect(`${baseUrl}/login?error=user_info_failed`);
    }

    const profile = await userInfoResponse.json();
    const email = profile.email?.toLowerCase();
    const name = profile.name || profile.given_name || 'Usuario Quimera';
    const picture = profile.picture || null;

    if (!email) {
      return NextResponse.redirect(`${baseUrl}/login?error=email_not_provided`);
    }

    // 3. Find or create user in PostgreSQL via Prisma
    let user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Generate clean unique username
      let baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
      if (baseUsername.length < 3) baseUsername = `user_${baseUsername}`;

      let username = baseUsername;
      let counter = 1;
      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      user = await prisma.user.create({
        data: {
          email,
          name,
          username,
          image: picture,
          emailVerified: new Date(),
          role: 'CLIENTE',
        },
      });
    } else {
      // Update image if missing
      if (!user.image && picture) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            image: picture,
            emailVerified: user.emailVerified || new Date(),
          },
        });
      }
    }

    // 4. Create signed session cookie
    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username || email.split('@')[0],
      name: user.name || name,
      email: user.email || email,
      role: user.role,
    };

    await createSession(sessionUser);

    // 5. Redirect to Home (logged in)
    return NextResponse.redirect(`${baseUrl}/`);
  } catch (err) {
    console.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${baseUrl}/login?error=unknown_error`);
  }
}
