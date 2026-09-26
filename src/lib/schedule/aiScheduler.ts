import {
  Worker,
  ShiftType,
  AIScheduleResult,
  SHIFT_HOURS,
} from './types';

interface ShiftRequirement {
  dayOfWeek: number; // 2..7 (Tuesday to Sunday)
  shiftPeriod: 'LUNCH' | 'DINNER';
  minCocina: number;
  minCamarero: number;
  label: string;
}

// Operational requirements for Taberna Quimera
const SHIFT_REQUIREMENTS: ShiftRequirement[] = [
  // Martes (2)
  { dayOfWeek: 2, shiftPeriod: 'LUNCH', minCocina: 1, minCamarero: 1, label: 'Martes Mediodía' },
  { dayOfWeek: 2, shiftPeriod: 'DINNER', minCocina: 1, minCamarero: 1, label: 'Martes Noche' },
  // Miércoles (3)
  { dayOfWeek: 3, shiftPeriod: 'LUNCH', minCocina: 1, minCamarero: 1, label: 'Miércoles Mediodía' },
  { dayOfWeek: 3, shiftPeriod: 'DINNER', minCocina: 1, minCamarero: 1, label: 'Miércoles Noche' },
  // Jueves (4)
  { dayOfWeek: 4, shiftPeriod: 'LUNCH', minCocina: 1, minCamarero: 1, label: 'Jueves Mediodía' },
  { dayOfWeek: 4, shiftPeriod: 'DINNER', minCocina: 1, minCamarero: 1, label: 'Jueves Noche' },
  // Viernes (5) - Noche alta afluencia
  { dayOfWeek: 5, shiftPeriod: 'LUNCH', minCocina: 1, minCamarero: 1, label: 'Viernes Mediodía' },
  { dayOfWeek: 5, shiftPeriod: 'DINNER', minCocina: 2, minCamarero: 2, label: 'Viernes Noche (Refuerzo)' },
  // Sábado (6) - Máxima afluencia mediodía y noche
  { dayOfWeek: 6, shiftPeriod: 'LUNCH', minCocina: 2, minCamarero: 2, label: 'Sábado Mediodía (Punta)' },
  { dayOfWeek: 6, shiftPeriod: 'DINNER', minCocina: 2, minCamarero: 2, label: 'Sábado Noche (Punta)' },
  // Domingo (7) - Alta mediodía, noche estándar
  { dayOfWeek: 7, shiftPeriod: 'LUNCH', minCocina: 2, minCamarero: 2, label: 'Domingo Mediodía (Punta)' },
  { dayOfWeek: 7, shiftPeriod: 'DINNER', minCocina: 1, minCamarero: 1, label: 'Domingo Noche' },
];

/**
 * Checks if a worker is allowed to work on a specific day & period based on their preferences
 */
function isWorkerEligibleForShift(
  worker: Worker,
  dayOfWeek: number,
  period: 'LUNCH' | 'DINNER'
): boolean {
  if (dayOfWeek === 1) return false; // Lunes cerrado para todos

  switch (worker.preference) {
    case 'WEEKEND_ONLY':
      // Viernes noche (5), Sábado (6), Domingo (7)
      if (dayOfWeek < 5) return false;
      if (dayOfWeek === 5 && period === 'LUNCH') return false;
      return true;

    case 'WEEKDAY_ONLY':
      // Martes (2) a Viernes (5)
      return dayOfWeek >= 2 && dayOfWeek <= 5;

    case 'MORNING_ONLY':
      return period === 'LUNCH';

    case 'NIGHT_ONLY':
      return period === 'DINNER';

    case 'FULL':
    default:
      return true;
  }
}

/**
 * AI Auto-Scheduler for Taberna Quimera
 * Balances contract hours, employee preferences, and restaurant staffing requirements.
 */
export function generateAISchedule(workers: Worker[]): AIScheduleResult {
  const activeWorkers = workers.filter((w) => w.isActive);

  // Map of worker assignments: userId -> (dayOfWeek -> { lunch: boolean, dinner: boolean })
  const workerDailySlots = new Map<
    string,
    Map<number, { lunch: boolean; dinner: boolean }>
  >();

  // Track assigned hours per worker
  const assignedHours = new Map<string, number>();

  for (const w of activeWorkers) {
    const daysMap = new Map<number, { lunch: boolean; dinner: boolean }>();
    for (let day = 1; day <= 7; day++) {
      daysMap.set(day, { lunch: false, dinner: false });
    }
    workerDailySlots.set(w.id, daysMap);
    assignedHours.set(w.id, 0);
  }

  const explanation: string[] = [
    '🤖 Motor de IA de Taberna Quimera iniciado.',
    '✓ Lunes bloqueado como CERRADO para descanso de toda la plantilla.',
  ];

  // Separate workers by role
  const cocinaWorkers = activeWorkers.filter((w) => w.role === 'COCINA');
  const salaWorkers = activeWorkers.filter(
    (w) => w.role === 'CAMARERO' || w.role === 'GERENTE' || w.role === 'ADMIN'
  );

  // 1. Prioritize workers with strict preferences (WEEKEND_ONLY and WEEKDAY_ONLY) first
  // so they get their desired shifts without being blocked by full-time staff.
  const prioritizedCocina = [...cocinaWorkers].sort((a, b) => {
    if (a.preference !== 'FULL' && b.preference === 'FULL') return -1;
    if (a.preference === 'FULL' && b.preference !== 'FULL') return 1;
    return a.contractHours - b.contractHours;
  });

  const prioritizedSala = [...salaWorkers].sort((a, b) => {
    if (a.preference !== 'FULL' && b.preference === 'FULL') return -1;
    if (a.preference === 'FULL' && b.preference !== 'FULL') return 1;
    return a.contractHours - b.contractHours;
  });

  let totalCoveredShifts = 0;

  // Process each operational requirement slot
  for (const req of SHIFT_REQUIREMENTS) {
    const { dayOfWeek, shiftPeriod, minCocina, minCamarero } = req;

    // --- A. Assign Cocina ---
    let assignedCocinaCount = 0;
    // Sort by hours left under contract
    prioritizedCocina.sort(
      (a, b) =>
        (b.contractHours - (assignedHours.get(b.id) || 0)) -
        (a.contractHours - (assignedHours.get(a.id) || 0))
    );

    for (const worker of prioritizedCocina) {
      if (assignedCocinaCount >= minCocina) break;

      const currentHours = assignedHours.get(worker.id) || 0;
      if (currentHours + 4 > worker.contractHours + 4) continue; // Do not exceed contract

      if (!isWorkerEligibleForShift(worker, dayOfWeek, shiftPeriod)) continue;

      const workerDays = workerDailySlots.get(worker.id)!;
      const daySlots = workerDays.get(dayOfWeek)!;

      if (shiftPeriod === 'LUNCH' && !daySlots.lunch) {
        daySlots.lunch = true;
        assignedHours.set(worker.id, currentHours + 4);
        assignedCocinaCount++;
      } else if (shiftPeriod === 'DINNER' && !daySlots.dinner) {
        daySlots.dinner = true;
        assignedHours.set(worker.id, currentHours + 4);
        assignedCocinaCount++;
      }
    }

    // --- B. Assign Sala / Camareros ---
    let assignedSalaCount = 0;
    prioritizedSala.sort(
      (a, b) =>
        (b.contractHours - (assignedHours.get(b.id) || 0)) -
        (a.contractHours - (assignedHours.get(a.id) || 0))
    );

    for (const worker of prioritizedSala) {
      if (assignedSalaCount >= minCamarero) break;

      const currentHours = assignedHours.get(worker.id) || 0;
      if (currentHours + 4 > worker.contractHours + 4) continue;

      if (!isWorkerEligibleForShift(worker, dayOfWeek, shiftPeriod)) continue;

      const workerDays = workerDailySlots.get(worker.id)!;
      const daySlots = workerDays.get(dayOfWeek)!;

      if (shiftPeriod === 'LUNCH' && !daySlots.lunch) {
        daySlots.lunch = true;
        assignedHours.set(worker.id, currentHours + 4);
        assignedSalaCount++;
      } else if (shiftPeriod === 'DINNER' && !daySlots.dinner) {
        daySlots.dinner = true;
        assignedHours.set(worker.id, currentHours + 4);
        assignedSalaCount++;
      }
    }

    totalCoveredShifts += (assignedCocinaCount + assignedSalaCount);
  }

  // 2. Build final assignments matrix
  const assignments: {
    userId: string;
    dayOfWeek: number;
    shiftType: ShiftType;
    hours: number;
  }[] = [];

  const workerHoursReport: { workerName: string; assigned: number; contract: number }[] = [];

  for (const worker of activeWorkers) {
    const workerDays = workerDailySlots.get(worker.id)!;
    let workerTotal = 0;

    for (let day = 1; day <= 7; day++) {
      if (day === 1) {
        // Monday always OFF
        assignments.push({
          userId: worker.id,
          dayOfWeek: 1,
          shiftType: 'OFF',
          hours: 0,
        });
        continue;
      }

      const slot = workerDays.get(day)!;
      let shiftType: ShiftType = 'OFF';

      if (slot.lunch && slot.dinner) {
        shiftType = 'DOUBLE';
      } else if (slot.lunch) {
        shiftType = 'LUNCH';
      } else if (slot.dinner) {
        shiftType = 'DINNER';
      }

      const hours = SHIFT_HOURS[shiftType];
      workerTotal += hours;

      assignments.push({
        userId: worker.id,
        dayOfWeek: day,
        shiftType,
        hours,
      });
    }

    workerHoursReport.push({
      workerName: worker.name,
      assigned: workerTotal,
      contract: worker.contractHours,
    });
  }

  // 3. Generate explanatory notes
  const weekendWorkers = activeWorkers.filter((w) => w.preference === 'WEEKEND_ONLY');
  if (weekendWorkers.length > 0) {
    explanation.push(
      `✓ Empleados de fin de semana (${weekendWorkers.map((w) => w.name).join(', ')}) concentrados en viernes noche, sábados y domingos.`
    );
  }

  const weekdayWorkers = activeWorkers.filter((w) => w.preference === 'WEEKDAY_ONLY');
  if (weekdayWorkers.length > 0) {
    explanation.push(
      `✓ Empleados de entre semana (${weekdayWorkers.map((w) => w.name).join(', ')}) liberados de turnos de fin de semana.`
    );
  }

  const totalHours = Array.from(assignedHours.values()).reduce((sum, h) => sum + h, 0);
  explanation.push(
    `✓ Reparto equilibrado: ${totalHours}h de servicio cubiertas entre ${activeWorkers.length} trabajadores.`
  );

  return {
    success: true,
    assignments,
    explanation,
    stats: {
      totalCoveredShifts,
      totalHours,
      workerHours: workerHoursReport,
    },
  };
}
