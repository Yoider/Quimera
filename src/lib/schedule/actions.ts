'use server';

import { prisma } from '@/lib/prisma';
import { Worker, ShiftType, StaffRole, ShiftPreference, AIScheduleResult } from './types';
import { generateAISchedule } from './aiScheduler';
import { hashPassword } from '@/lib/auth/password';
import { revalidatePath } from 'next/cache';

/**
 * Normalizes a date to Monday of that week at 00:00:00 UTC
 */
function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay(); // 0 is Sunday, 1 is Monday...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Fetch all staff workers from PostgreSQL
 */
export async function getWorkersAction(): Promise<Worker[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['GERENTE', 'CAMARERO', 'COCINA', 'ADMIN'],
        },
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name || u.username || 'Trabajador',
      username: u.username || '',
      email: u.email || undefined,
      role: (u.role as StaffRole) || 'CAMARERO',
      contractHours: u.contractHours || 40,
      preference: (u.preference as ShiftPreference) || 'FULL',
      colorTag: u.colorTag || undefined,
      isActive: u.isActive,
    }));
  } catch (err) {
    console.error('Error fetching workers:', err);
    return [];
  }
}

/**
 * Update worker contract hours, preferences, role or active state
 */
export async function updateWorkerAction(
  userId: string,
  data: {
    name?: string;
    role?: StaffRole;
    contractHours?: number;
    preference?: ShiftPreference;
    colorTag?: string;
    isActive?: boolean;
  }
): Promise<{ success: boolean; worker?: Worker; error?: string }> {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.role ? { role: data.role } : {}),
        ...(data.contractHours !== undefined ? { contractHours: data.contractHours } : {}),
        ...(data.preference ? { preference: data.preference } : {}),
        ...(data.colorTag !== undefined ? { colorTag: data.colorTag } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });

    revalidatePath('/staff');

    return {
      success: true,
      worker: {
        id: updated.id,
        name: updated.name || updated.username || 'Trabajador',
        username: updated.username || '',
        email: updated.email || undefined,
        role: updated.role as StaffRole,
        contractHours: updated.contractHours,
        preference: updated.preference as ShiftPreference,
        colorTag: updated.colorTag || undefined,
        isActive: updated.isActive,
      },
    };
  } catch (err) {
    console.error('Error updating worker:', err);
    return { success: false, error: 'Error al actualizar el trabajador.' };
  }
}

/**
 * Create a new worker in PostgreSQL
 */
export async function createWorkerAction(data: {
  name: string;
  username: string;
  email?: string;
  role: StaffRole;
  contractHours: number;
  preference: ShiftPreference;
  colorTag?: string;
  password?: string;
}): Promise<{ success: boolean; worker?: Worker; error?: string }> {
  try {
    const username = data.username.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { username },
    });

    if (existing) {
      return { success: false, error: 'El nombre de usuario ya existe.' };
    }

    const passwordHash = await hashPassword(data.password || 'quimera2026');

    const newUser = await prisma.user.create({
      data: {
        name: data.name.trim(),
        username,
        email: data.email?.trim() || null,
        role: data.role,
        contractHours: data.contractHours,
        preference: data.preference,
        colorTag: data.colorTag || '#9E2A2B',
        passwordHash,
        isActive: true,
      },
    });

    revalidatePath('/staff');

    return {
      success: true,
      worker: {
        id: newUser.id,
        name: newUser.name || newUser.username || 'Trabajador',
        username: newUser.username || '',
        email: newUser.email || undefined,
        role: newUser.role as StaffRole,
        contractHours: newUser.contractHours,
        preference: newUser.preference as ShiftPreference,
        colorTag: newUser.colorTag || undefined,
        isActive: newUser.isActive,
      },
    };
  } catch (err) {
    console.error('Error creating worker:', err);
    return { success: false, error: 'Error al dar de alta el trabajador.' };
  }
}

/**
 * Fetch or initialize the weekly schedule for a specific Monday date
 */
export async function getWeeklyScheduleAction(weekDateStr: string): Promise<{
  scheduleId?: string;
  weekStartDate: string;
  shifts: { userId: string; dayOfWeek: number; shiftType: ShiftType; hours: number }[];
  notes?: string;
}> {
  try {
    const monday = getMondayOfWeek(new Date(weekDateStr));

    const schedule = await prisma.weeklySchedule.findUnique({
      where: { weekStartDate: monday },
      include: {
        shifts: true,
      },
    });

    if (!schedule) {
      return {
        weekStartDate: monday.toISOString(),
        shifts: [],
      };
    }

    return {
      scheduleId: schedule.id,
      weekStartDate: schedule.weekStartDate.toISOString(),
      notes: schedule.notes || undefined,
      shifts: schedule.shifts.map((s) => ({
        userId: s.userId,
        dayOfWeek: s.dayOfWeek,
        shiftType: s.shiftType as ShiftType,
        hours: s.hours,
      })),
    };
  } catch (err) {
    console.error('Error fetching weekly schedule:', err);
    return {
      weekStartDate: new Date().toISOString(),
      shifts: [],
    };
  }
}

/**
 * Save manual or AI-generated shift assignments to PostgreSQL
 */
export async function saveWeeklyScheduleAction(
  weekDateStr: string,
  shifts: { userId: string; dayOfWeek: number; shiftType: ShiftType; hours: number }[],
  notes?: string
): Promise<{ success: boolean; scheduleId?: string; error?: string }> {
  try {
    const monday = getMondayOfWeek(new Date(weekDateStr));

    const schedule = await prisma.weeklySchedule.upsert({
      where: { weekStartDate: monday },
      update: {
        notes: notes || null,
        isPublished: true,
      },
      create: {
        weekStartDate: monday,
        notes: notes || null,
        isPublished: true,
      },
    });

    // Replace shift assignments for this schedule
    await prisma.shiftAssignment.deleteMany({
      where: { scheduleId: schedule.id },
    });

    if (shifts.length > 0) {
      await prisma.shiftAssignment.createMany({
        data: shifts.map((s) => ({
          scheduleId: schedule.id,
          userId: s.userId,
          dayOfWeek: s.dayOfWeek,
          shiftType: s.shiftType,
          hours: s.hours,
        })),
      });
    }

    revalidatePath('/staff');
    return { success: true, scheduleId: schedule.id };
  } catch (err) {
    console.error('Error saving weekly schedule:', err);
    return { success: false, error: 'Error al guardar el cuadrante en PostgreSQL.' };
  }
}

/**
 * Run AI Scheduler for a given week
 */
export async function generateAIScheduleAction(
  weekDateStr: string
): Promise<AIScheduleResult> {
  const workers = await getWorkersAction();
  return generateAISchedule(workers);
}
