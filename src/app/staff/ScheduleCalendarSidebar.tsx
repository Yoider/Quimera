'use client';

import React, { useState, useMemo } from 'react';
import { WeekScheduleSummary } from '@/lib/schedule/actions';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  CalendarDays,
  X,
  Sparkles,
} from 'lucide-react';

interface ScheduleCalendarSidebarProps {
  currentMonday: Date;
  onSelectWeek: (mondayDate: Date) => void;
  summary: Record<string, WeekScheduleSummary>;
  isMobileDrawer?: boolean;
  onCloseMobileDrawer?: () => void;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface WeekInfo {
  monday: Date;
  tuesday: Date;
  sunday: Date;
  key: string;
  rangeLabel: string; // e.g. "13 oct – 18 oct"
  weekNumber: number;
}

/**
 * Returns all weeks that have days in a given month (0-indexed).
 * Each week is defined by its Monday, with opening range Tuesday to Sunday.
 */
function getWeeksForMonth(year: number, monthIndex: number): WeekInfo[] {
  const weeks: WeekInfo[] = [];
  const seenKeys = new Set<string>();

  // Start checking from day 1 of the month to last day of the month
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();

  for (let day = 1; day <= lastDay; day += 3) {
    const d = new Date(year, monthIndex, day);
    // Find Monday of this week
    const dayOfWeek = d.getDay(); // 0 is Sun, 1 is Mon...
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(year, monthIndex, diff);
    monday.setHours(0, 0, 0, 0);

    const key = formatDateKey(monday);
    if (!seenKeys.has(key)) {
      seenKeys.add(key);

      const tuesday = new Date(monday);
      tuesday.setDate(monday.getDate() + 1);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      // Range format: Martes a Domingo (ej. "13 oct – 18 oct")
      const tueDay = tuesday.getDate();
      const tueMonth = tuesday.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');
      const sunDay = sunday.getDate();
      const sunMonth = sunday.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '');

      const rangeLabel =
        tueMonth === sunMonth
          ? `${tueDay} al ${sunDay} ${tueMonth}`
          : `${tueDay} ${tueMonth} – ${sunDay} ${sunMonth}`;

      weeks.push({
        monday,
        tuesday,
        sunday,
        key,
        rangeLabel,
        weekNumber: weeks.length + 1,
      });
    }
  }

  return weeks;
}

export default function ScheduleCalendarSidebar({
  currentMonday,
  onSelectWeek,
  summary,
  isMobileDrawer = false,
  onCloseMobileDrawer,
}: ScheduleCalendarSidebarProps) {
  const [selectedYear, setSelectedYear] = useState<number>(() => currentMonday.getFullYear());

  const currentMondayKey = useMemo(() => formatDateKey(currentMonday), [currentMonday]);

  // Compute weeks for all 12 months in selectedYear
  const monthsData = useMemo(() => {
    return MONTH_NAMES.map((name, index) => {
      const weeks = getWeeksForMonth(selectedYear, index);
      return {
        monthIndex: index,
        monthName: name,
        weeks,
      };
    });
  }, [selectedYear]);

  return (
    <div className="flex flex-col h-full bg-white text-[#2B2523]">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#EADBC8] bg-[#FAF8F5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B] shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-sm text-[#2B2523] uppercase tracking-wider">
              Calendario de Semanas
            </h3>
            <span className="text-[10px] text-[#6E6259]">
              Martes a Domingo · Apertura
            </span>
          </div>
        </div>

        {isMobileDrawer && (
          <button
            onClick={onCloseMobileDrawer}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#2B2523] hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Cerrar calendario"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Year Selector */}
      <div className="p-3 border-b border-[#EADBC8] bg-white flex items-center justify-between shrink-0">
        <button
          onClick={() => setSelectedYear((y) => y - 1)}
          className="p-1.5 rounded-lg border border-[#EADBC8] hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
          title="Año anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 font-serif font-bold text-base text-[#2B2523]">
          <CalendarIcon className="w-4 h-4 text-[#9E2A2B]" />
          <span>Año {selectedYear}</span>
        </div>

        <button
          onClick={() => setSelectedYear((y) => y + 1)}
          className="p-1.5 rounded-lg border border-[#EADBC8] hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
          title="Año siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Months & Weeks List (Scrollable vertical feed) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
        {monthsData.map((m) => {
          // Check if current active week falls in this month
          const hasActiveWeek = m.weeks.some((w) => w.key === currentMondayKey);

          return (
            <div
              key={m.monthIndex}
              className={`rounded-2xl border transition-all ${
                hasActiveWeek
                  ? 'border-[#9E2A2B]/40 bg-[#FAF8F5]/80 shadow-2xs'
                  : 'border-[#EADBC8]/70 bg-white'
              }`}
            >
              {/* Month Card Title */}
              <div className="px-3.5 py-2.5 border-b border-[#EADBC8]/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-serif font-bold text-xs uppercase tracking-wide text-[#2B2523]">
                    {m.monthName}
                  </span>
                  {hasActiveWeek && (
                    <span className="w-2 h-2 rounded-full bg-[#9E2A2B] animate-pulse" />
                  )}
                </div>
                <span className="text-[10px] text-stone-400 font-medium">
                  {m.weeks.length} semanas
                </span>
              </div>

              {/* Weeks in this month */}
              <div className="p-2 space-y-1.5">
                {m.weeks.map((week) => {
                  const isSelected = week.key === currentMondayKey;
                  const weekSummary = summary[week.key];
                  const hasSavedShifts =
                    weekSummary && weekSummary.shiftsCount > 0;

                  return (
                    <button
                      key={week.key}
                      onClick={() => {
                        onSelectWeek(week.monday);
                        if (isMobileDrawer && onCloseMobileDrawer) {
                          onCloseMobileDrawer();
                        }
                      }}
                      className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between group ${
                        isSelected
                          ? 'bg-[#9E2A2B] text-white shadow-md border border-[#9E2A2B]'
                          : 'hover:bg-amber-50/50 text-[#2B2523] border border-stone-100 hover:border-[#EADBC8]'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <Clock
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isSelected ? 'text-amber-200' : 'text-[#D4A373]'
                            }`}
                          />
                          <span
                            className={`text-xs font-semibold truncate ${
                              isSelected ? 'text-white' : 'text-[#2B2523]'
                            }`}
                          >
                            {week.rangeLabel}
                          </span>
                        </div>
                        <div
                          className={`text-[10px] mt-0.5 ml-5 ${
                            isSelected ? 'text-white/80' : 'text-stone-400'
                          }`}
                        >
                          Semana {week.weekNumber} de {m.monthName}
                        </div>
                      </div>

                      {/* Week Status Badge */}
                      <div className="shrink-0">
                        {hasSavedShifts ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}
                          >
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            <span>{weekSummary.shiftsCount} turnos</span>
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              isSelected
                                ? 'bg-white/15 text-white/90'
                                : 'bg-stone-100 text-stone-400 border border-stone-200/60'
                            }`}
                          >
                            Borrador
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[#EADBC8] bg-[#FAF8F5] text-center shrink-0">
        <p className="text-[11px] text-[#6E6259]">
          Selecciona una semana para cargar y cuadrar los horarios.
        </p>
      </div>
    </div>
  );
}
