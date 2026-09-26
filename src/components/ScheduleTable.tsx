'use client';

import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ScheduleItem {
  dayNumber: number; // 0 for Sunday, 1 for Monday, etc.
  dayName: string;
  lunch: string;
  dinner: string;
  isOpen: boolean;
}

export const WEEKLY_SCHEDULE: ScheduleItem[] = [
  { dayNumber: 1, dayName: 'Lunes', lunch: '—', dinner: '—', isOpen: false },
  { dayNumber: 2, dayName: 'Martes', lunch: '12:00 – 16:00', dinner: '20:00 – 00:00', isOpen: true },
  { dayNumber: 3, dayName: 'Miércoles', lunch: '12:00 – 16:00', dinner: '20:00 – 00:00', isOpen: true },
  { dayNumber: 4, dayName: 'Jueves', lunch: '12:00 – 16:00', dinner: '20:00 – 00:00', isOpen: true },
  { dayNumber: 5, dayName: 'Viernes', lunch: '12:00 – 16:00', dinner: '20:00 – 00:00', isOpen: true },
  { dayNumber: 6, dayName: 'Sábado', lunch: '12:00 – 16:00', dinner: '20:00 – 00:00', isOpen: true },
  { dayNumber: 0, dayName: 'Domingo', lunch: '12:00 – 16:00', dinner: '20:00 – 00:00', isOpen: true },
];

export default function ScheduleTable({ compact = false }: { compact?: boolean }) {
  // Determine current day of week (0 is Sunday, 1 is Monday...)
  const today = new Date().getDay();

  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#EADBC8] bg-white shadow-xs">
      <div className="bg-[#FAF8F5] px-4 py-3 border-b border-[#EADBC8] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#9E2A2B]" />
          <span className="font-serif font-bold text-sm text-[#2B2523] uppercase tracking-wider">
            Horario Semanal de Apertura
          </span>
        </div>
        <span className="text-[11px] font-semibold text-[#9E2A2B] bg-[#9E2A2B]/10 px-2 py-0.5 rounded-full">
          Barra & Cocina
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#EADBC8]/70 bg-stone-50/70 text-[#6E6259] uppercase font-bold tracking-wider text-[10px]">
              <th className="py-2.5 px-3 sm:px-4">Día</th>
              <th className="py-2.5 px-3 sm:px-4">Mediodía</th>
              <th className="py-2.5 px-3 sm:px-4">Noche</th>
              <th className="py-2.5 px-3 sm:px-4 text-right">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EADBC8]/40">
            {WEEKLY_SCHEDULE.map((item) => {
              const isToday = item.dayNumber === today;

              return (
                <tr
                  key={item.dayName}
                  className={`transition-colors ${
                    isToday
                      ? 'bg-amber-50/80 font-semibold text-[#2B2523]'
                      : 'hover:bg-[#FAF8F5]/80 text-[#2B2523]'
                  }`}
                >
                  <td className="py-2.5 px-3 sm:px-4 flex items-center gap-1.5 whitespace-nowrap">
                    <span>{item.dayName}</span>
                    {isToday && (
                      <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-[#9E2A2B] text-white font-bold uppercase tracking-wider">
                        Hoy
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap text-[#6E6259]">
                    {item.isOpen ? item.lunch : <span className="text-stone-400">—</span>}
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 whitespace-nowrap text-[#6E6259]">
                    {item.isOpen ? item.dinner : <span className="text-stone-400">—</span>}
                  </td>
                  <td className="py-2.5 px-3 sm:px-4 text-right whitespace-nowrap">
                    {item.isOpen ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Abierto
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        <XCircle className="w-3 h-3 text-red-500" />
                        Cerrado
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-[#FAF8F5] p-3 border-t border-[#EADBC8] text-[11px] text-[#6E6259] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1">
        <span>* Lunes cerrado por descanso del personal.</span>
        <span className="font-medium text-[#9E2A2B]">Servicio de barra y mesas sin reserva previa</span>
      </div>
    </div>
  );
}
