export type ShiftType = 'LUNCH' | 'DINNER' | 'DOUBLE' | 'OFF';

export type ShiftPreference =
  | 'FULL'           // Disponibilidad total
  | 'WEEKEND_ONLY'   // Solo viernes noche, sábado y domingo
  | 'WEEKDAY_ONLY'   // Solo martes a viernes mediodía
  | 'MORNING_ONLY'   // Solo turnos de mediodía (12:00 a 16:00)
  | 'NIGHT_ONLY';    // Solo turnos de noche (20:00 a 00:00)

export type StaffRole = 'GERENTE' | 'CAMARERO' | 'COCINA' | 'ADMIN';

export interface Worker {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: StaffRole;
  contractHours: number; // e.g. 40, 30, 20, 15
  preference: ShiftPreference;
  colorTag?: string;
  isActive: boolean;
}

export interface ShiftCell {
  dayOfWeek: number; // 1 = Lunes, ..., 7 = Domingo
  shiftType: ShiftType;
  hours: number;
}

export interface ScheduleMatrixRow {
  worker: Worker;
  shifts: Record<number, ShiftCell>; // 1 to 7
  totalAssignedHours: number;
}

export interface AIScheduleResult {
  success: boolean;
  assignments: {
    userId: string;
    dayOfWeek: number;
    shiftType: ShiftType;
    hours: number;
  }[];
  explanation: string[];
  stats: {
    totalCoveredShifts: number;
    totalHours: number;
    workerHours: { workerName: string; assigned: number; contract: number }[];
  };
}

export const DAYS_OF_WEEK = [
  { dayNumber: 1, name: 'Lunes', short: 'Lun', isClosed: true },
  { dayNumber: 2, name: 'Martes', short: 'Mar', isClosed: false },
  { dayNumber: 3, name: 'Miércoles', short: 'Mié', isClosed: false },
  { dayNumber: 4, name: 'Jueves', short: 'Jue', isClosed: false },
  { dayNumber: 5, name: 'Viernes', short: 'Vie', isClosed: false },
  { dayNumber: 6, name: 'Sábado', short: 'Sáb', isClosed: false },
  { dayNumber: 7, name: 'Domingo', short: 'Dom', isClosed: false },
];

export const SHIFT_HOURS: Record<ShiftType, number> = {
  LUNCH: 4.0,   // 12:00 a 16:00
  DINNER: 4.0,  // 20:00 a 00:00
  DOUBLE: 8.0,  // Mediodía y Noche
  OFF: 0.0,     // Descanso
};

export const SHIFT_LABELS: Record<ShiftType, { label: string; time: string; badgeColor: string }> = {
  LUNCH: { label: 'Mediodía', time: '12:00 – 16:00 (4h)', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
  DINNER: { label: 'Noche', time: '20:00 – 00:00 (4h)', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  DOUBLE: { label: 'Doble', time: '12-16h y 20-00h (8h)', badgeColor: 'bg-purple-100 text-purple-900 border-purple-300' },
  OFF: { label: 'Libre', time: 'Descanso (0h)', badgeColor: 'bg-stone-100 text-stone-500 border-stone-200' },
};

export const PREFERENCE_LABELS: Record<ShiftPreference, { label: string; desc: string }> = {
  FULL: { label: 'Disponibilidad Completa', desc: 'Puede trabajar cualquier día y turno' },
  WEEKEND_ONLY: { label: 'Solo Fin de Semana', desc: 'Viernes noche, sábados y domingos' },
  WEEKDAY_ONLY: { label: 'Solo Entre Semana', desc: 'Martes a viernes mediodía' },
  MORNING_ONLY: { label: 'Solo Mediodías', desc: 'Turnos de 12:00 a 16:00' },
  NIGHT_ONLY: { label: 'Solo Noches', desc: 'Turnos de 20:00 a 00:00' },
};
