import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'taberna-quimera-secret-key-2026-sevilla-super-secure'
);

export const SESSION_COOKIE_NAME = 'quimera_session';

export interface SessionUser {
  id: string;
  username: string;
  name: string;
  email?: string;
  role: string;
}

/**
 * Creates a signed JWT session and sets the HttpOnly cookie
 */
export async function createSession(user: SessionUser): Promise<string> {
  const token = await new SignJWT({
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return token;
}

import { prisma } from '@/lib/prisma';

/**
 * Reads and verifies the current session from HttpOnly cookies
 */
export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) return null;

    const { payload } = await jwtVerify(token, SECRET_KEY, {
      algorithms: ['HS256'],
    });

    let role = (payload.role as string) || 'CLIENTE';
    let name = (payload.name as string) || '';

    try {
      if (payload.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: payload.id as string },
          select: { role: true, name: true },
        });
        if (dbUser?.role) role = dbUser.role;
        if (dbUser?.name) name = dbUser.name;
      }
    } catch {
      // fallback to token payload
    }

    return {
      id: payload.id as string,
      username: payload.username as string,
      name,
      email: payload.email as string | undefined,
      role,
    };
  } catch {
    return null;
  }
}

/**
 * Destroys the current session cookie
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
