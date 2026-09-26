'use server';

import { prisma } from '@/lib/prisma';
import { hashPassword, verifyPassword } from './password';
import { createSession, destroySession, getSession, SessionUser } from './session';
import { revalidatePath } from 'next/cache';

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: SessionUser;
}

/**
 * Register a new user with username and encrypted password
 */
export async function registerUserAction(formData: {
  name: string;
  username: string;
  email?: string;
  password: string;
  confirmPassword?: string;
}): Promise<AuthResponse> {
  try {
    const name = formData.name.trim();
    const username = formData.username.trim().toLowerCase();
    const email = formData.email?.trim().toLowerCase() || null;
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    // 1. Validation
    if (!name || name.length < 2) {
      return { success: false, error: 'Por favor, introduce tu nombre completo.' };
    }

    if (!username || username.length < 3) {
      return { success: false, error: 'El nombre de usuario debe tener al menos 3 caracteres.' };
    }

    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return { success: false, error: 'El nombre de usuario solo puede contener letras, números, puntos y guiones.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
    }

    if (confirmPassword !== undefined && password !== confirmPassword) {
      return { success: false, error: 'Las contraseñas no coinciden.' };
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { success: false, error: 'El formato del correo electrónico no es válido.' };
    }

    // 2. Uniqueness check
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          ...(email ? [{ email }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.username === username) {
        return { success: false, error: 'Este nombre de usuario ya está registrado. Elige otro.' };
      }
      if (email && existingUser.email === email) {
        return { success: false, error: 'Este correo electrónico ya está en uso. Prueba a iniciar sesión.' };
      }
    }

    // 3. Encrypt password with bcrypt
    const passwordHash = await hashPassword(password);

    // 4. Create user in PostgreSQL
    const newUser = await prisma.user.create({
      data: {
        name,
        username,
        email,
        passwordHash,
        role: 'CLIENTE',
      },
    });

    // 5. Establish session
    const sessionUser: SessionUser = {
      id: newUser.id,
      username: newUser.username || username,
      name: newUser.name || name,
      email: newUser.email || undefined,
      role: newUser.role,
    };

    await createSession(sessionUser);

    revalidatePath('/');
    return { success: true, user: sessionUser };
  } catch (err) {
    console.error('❌ Error en registerUserAction:', err);
    return { success: false, error: 'Ocurrió un error inesperado al registrar el usuario. Inténtalo de nuevo.' };
  }
}

/**
 * Login user using username or email + password
 */
export async function loginUserAction(formData: {
  identifier: string; // username or email
  password: string;
}): Promise<AuthResponse> {
  try {
    const identifier = formData.identifier.trim().toLowerCase();
    const password = formData.password;

    if (!identifier || !password) {
      return { success: false, error: 'Por favor, rellena todos los campos.' };
    }

    // 1. Search for user by username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      return { success: false, error: 'Usuario, correo o contraseña incorrectos.' };
    }

    // 2. Verify encrypted password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return { success: false, error: 'Usuario, correo o contraseña incorrectos.' };
    }

    // 3. Establish session
    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username || identifier,
      name: user.name || user.username || 'Usuario Quimera',
      email: user.email || undefined,
      role: user.role,
    };

    await createSession(sessionUser);

    revalidatePath('/');
    return { success: true, user: sessionUser };
  } catch (err) {
    console.error('❌ Error en loginUserAction:', err);
    return { success: false, error: 'Error al iniciar sesión. Inténtalo de nuevo.' };
  }
}

/**
 * Logout user by destroying session cookie
 */
export async function logoutUserAction(): Promise<{ success: boolean }> {
  await destroySession();
  revalidatePath('/');
  return { success: true };
}

/**
 * Get current session user
 */
export async function getCurrentUserAction(): Promise<SessionUser | null> {
  return await getSession();
}
