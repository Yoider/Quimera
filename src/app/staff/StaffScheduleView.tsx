'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Worker,
  ShiftType,
  DAYS_OF_WEEK,
  SHIFT_HOURS,
  PREFERENCE_LABELS,
  DayIntensity,
  DayDemand,
  WeekDemandConfig,
  INTENSITY_CONFIG,
  DEFAULT_WEEK_DEMAND,
} from '@/lib/schedule/types';
import {
  getWeeklyScheduleAction,
  saveWeeklyScheduleAction,
  generateAIScheduleAction,
  getYearSchedulesSummaryAction,
  WeekScheduleSummary,
} from '@/lib/schedule/actions';
import ScheduleReportModal from './ScheduleReportModal';
import DayDemandModal from './DayDemandModal';
import ScheduleCalendarSidebar from './ScheduleCalendarSidebar';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  FileText,
  RotateCcw,
  Info,
  Sun,
  Moon,
  Flame,
  Shield,
  ChefHat,
  Utensils,
  SlidersHorizontal,
  CalendarDays,
  X,
} from 'lucide-react';

interface StaffScheduleViewProps {
  workers: Worker[];
}

// Shift cycle order on click
const SHIFT_CYCLE: ShiftType[] = ['OFF', 'LUNCH', 'DINNER', 'DOUBLE'];

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function StaffScheduleView({ workers }: StaffScheduleViewProps) {
  const [currentMonday, setCurrentMonday] = useState<Date>(() => getMonday(new Date()));
  const [shifts, setShifts] = useState<{ userId: string; dayOfWeek: number; shiftType: ShiftType; hours: number }[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [demandConfig, setDemandConfig] = useState<WeekDemandConfig>(DEFAULT_WEEK_DEMAND);
  const [activeCellMenu, setActiveCellMenu] = useState<{ workerId: string; dayNumber: number } | null>(null);

  // Day Demand Modal state
  const [selectedDayForModal, setSelectedDayForModal] = useState<{
    dayNumber: number;
    name: string;
    dateStr: string;
  } | null>(null);

  // Year summary for calendar sidebar
  const [yearSummary, setYearSummary] = useState<Record<string, WeekScheduleSummary>>({});
  // Mobile Calendar Drawer
  const [isCalendarDrawerOpen, setIsCalendarDrawerOpen] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string[] | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Load year summary for calendar sidebar
  const loadYearSummary = async (year: number) => {
    try {
      const res = await getYearSchedulesSummaryAction(year);
      if (res.success) {
        setYearSummary(res.summary);
      }
    } catch (err) {
      console.error('Error loading year summary:', err);
    }
  };

  // Load schedule for the current Monday
  const loadScheduleForWeek = (monday: Date) => {
    startTransition(async () => {
      const data = await getWeeklyScheduleAction(formatDateKey(monday));
      setShifts(data.shifts || []);
      setNotes(data.notes || '');
      setDemandConfig(data.demandConfig || DEFAULT_WEEK_DEMAND);
      setHasChanges(false);
      setAiExplanation(null);
    });
  };

  useEffect(() => {
    loadScheduleForWeek(currentMonday);
    loadYearSummary(currentMonday.getFullYear());
  }, [currentMonday]);

  // Navigate weeks
  const handlePrevWeek = () => {
    const prev = new Date(currentMonday);
    prev.setDate(prev.getDate() - 7);
    setCurrentMonday(prev);
  };

  const handleNextWeek = () => {
    const next = new Date(currentMonday);
    next.setDate(next.getDate() + 7);
    setCurrentMonday(next);
  };

  const handleCurrentWeek = () => {
    setCurrentMonday(getMonday(new Date()));
  };

  // Quick cycle shift for cell
  const handleCycleShift = (workerId: string, dayNumber: number) => {
    if (dayNumber === 1) return; // Monday closed

    const existing = shifts.find((s) => s.userId === workerId && s.dayOfWeek === dayNumber);
    const currentType = existing?.shiftType || 'OFF';
    const nextIdx = (SHIFT_CYCLE.indexOf(currentType) + 1) % SHIFT_CYCLE.length;
    const nextType = SHIFT_CYCLE[nextIdx];
    const hours = SHIFT_HOURS[nextType];

    setShifts((prev) => {
      const filtered = prev.filter((s) => !(s.userId === workerId && s.dayOfWeek === dayNumber));
      return [...filtered, { userId: workerId, dayOfWeek: dayNumber, shiftType: nextType, hours }];
    });
    setHasChanges(true);
  };

  // Set explicit shift
  const handleSetExplicitShift = (workerId: string, dayNumber: number, type: ShiftType) => {
    if (dayNumber === 1) return;
    const hours = SHIFT_HOURS[type];

    setShifts((prev) => {
      const filtered = prev.filter((s) => !(s.userId === workerId && s.dayOfWeek === dayNumber));
      return [...filtered, { userId: workerId, dayOfWeek: dayNumber, shiftType: type, hours }];
    });
    setActiveCellMenu(null);
    setHasChanges(true);
  };

  // Helper to get worker shift for a day
  const getWorkerShift = (workerId: string, dayNumber: number): ShiftType => {
    if (dayNumber === 1) return 'OFF';
    const s = shifts.find((sh) => sh.userId === workerId && sh.dayOfWeek === dayNumber);
    return s ? s.shiftType : 'OFF';
  };

  // Helper to compute worker assigned hours
  const getWorkerHours = (workerId: string): number => {
    return shifts
      .filter((s) => s.userId === workerId)
      .reduce((sum, s) => sum + s.hours, 0);
  };

  // Save Day Demand from Modal
  const handleSaveDayDemand = (dayNumber: number, updated: DayDemand) => {
    setDemandConfig((prev) => ({
      ...prev,
      [dayNumber]: updated,
    }));
    setHasChanges(true);
    const dayName = DAYS_OF_WEEK.find((d) => d.dayNumber === dayNumber)?.name || 'Día';
    showToast(`Previsión y dotación de ${dayName} actualizadas.`);
  };

  // Save changes to DB
  const handleSaveSchedule = () => {
    startTransition(async () => {
      const res = await saveWeeklyScheduleAction(
        formatDateKey(currentMonday),
        shifts,
        notes,
        demandConfig
      );
      if (res.success) {
        setHasChanges(false);
        showToast('Cuadrante y previsión de demanda guardados con éxito.');
        // Refresh year summary so right calendar badge updates to green immediately
        loadYearSummary(currentMonday.getFullYear());
      } else {
        alert(res.error || 'Error al guardar el cuadrante.');
      }
    });
  };

  // Run AI Scheduling Engine
  const handleGenerateAI = async () => {
    setIsAiLoading(true);
    try {
      const result = await generateAIScheduleAction(formatDateKey(currentMonday), demandConfig);
      if (result.success) {
        setShifts(result.assignments);
        setAiExplanation(result.explanation);
        setHasChanges(true);
        showToast('¡Cuadrante generado automáticamente con IA según la previsión de buya y contratos!');
      }
    } catch (err) {
      console.error(err);
      alert('Error al generar cuadrante con IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Clear all shifts for week
  const handleClearWeek = () => {
    if (confirm('¿Vaciar todos los turnos asignados de esta semana?')) {
      setShifts([]);
      setAiExplanation(null);
      setHasChanges(true);
      showToast('Cuadrante semanal vaciado.');
    }
  };

  // Dates display: Martes a Domingo
  const tuesday = new Date(currentMonday);
  tuesday.setDate(currentMonday.getDate() + 1);
  const sunday = new Date(currentMonday);
  sunday.setDate(currentMonday.getDate() + 6);

  const formatDateRange = () => {
    const startStr = tuesday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    const endStr = sunday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
    return `${startStr} — ${endStr}`;
  };

  // Role icon helper
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'GERENTE':
      case 'ADMIN':
        return <Shield className="w-3.5 h-3.5 text-amber-700" />;
      case 'COCINA':
        return <ChefHat className="w-3.5 h-3.5 text-emerald-700" />;
      default:
        return <Utensils className="w-3.5 h-3.5 text-blue-700" />;
    }
  };

  return (
    <div className="w-full">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2B2523] text-white border border-[#D4A373] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-[#D4A373]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Two Column Layout: Main Schedule + Right Calendar Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Column */}
        <div className="flex-1 min-w-0 space-y-6 w-full">
          {/* Header & Controls Bar */}
          <div className="bg-white p-5 rounded-3xl border border-[#EADBC8] shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
            {/* Week Navigator */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B] shrink-0">
                <Calendar className="w-5 h-5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevWeek}
                    className="p-1.5 rounded-lg border border-[#EADBC8] hover:bg-stone-100 text-[#2B2523] transition-colors cursor-pointer"
                    title="Semana anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <span className="font-serif font-bold text-base md:text-lg text-[#2B2523]">
                    Semana: {formatDateRange()}
                  </span>

                  <button
                    onClick={handleNextWeek}
                    className="p-1.5 rounded-lg border border-[#EADBC8] hover:bg-stone-100 text-[#2B2523] transition-colors cursor-pointer"
                    title="Semana siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleCurrentWeek}
                    className="ml-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#6E6259] text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Hoy
                  </button>
                </div>
                <p className="text-xs text-[#6E6259] mt-0.5">
                  Horario comercial: Martes a Domingo (Lunes cerrado para descanso)
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Mobile Calendar Drawer Button */}
              <button
                onClick={() => setIsCalendarDrawerOpen(true)}
                className="lg:hidden px-3.5 py-2.5 rounded-2xl border border-[#EADBC8] bg-[#FAF8F5] hover:bg-stone-100 text-[#2B2523] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                title="Ver calendario de meses y semanas"
              >
                <CalendarDays className="w-4 h-4 text-[#9E2A2B]" />
                <span>Semanas & Meses</span>
              </button>

              {/* AI Scheduler Trigger */}
              <button
                onClick={handleGenerateAI}
                disabled={isAiLoading || workers.length === 0}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#9E2A2B] via-[#b8383a] to-[#D4A373] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 text-amber-200 ${isAiLoading ? 'animate-spin' : ''}`} />
                <span>{isAiLoading ? 'Optimizando...' : 'Generar con IA'}</span>
              </button>

              {/* Export / Report / PDF */}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-3.5 py-2.5 rounded-2xl border border-[#EADBC8] bg-white hover:bg-stone-50 text-[#2B2523] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#9E2A2B]" />
                <span>Exportar / PDF</span>
              </button>

              {/* Save Button */}
              <button
                onClick={handleSaveSchedule}
                disabled={isPending || !hasChanges}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                  hasChanges
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse'
                    : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>{isPending ? 'Guardando...' : hasChanges ? 'Guardar Cambios' : 'Al día'}</span>
              </button>

              {/* Clear Week */}
              <button
                onClick={handleClearWeek}
                className="p-2.5 rounded-2xl border border-stone-200 hover:bg-rose-50 hover:border-rose-200 text-stone-400 hover:text-rose-600 transition-colors cursor-pointer"
                title="Vaciar cuadrante"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* AI Reasoning Box (When generated) */}
          {aiExplanation && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-5 shadow-xs animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#9E2A2B]" />
                  <span>Optimización Algorítmica Inteligente Aplicada</span>
                </div>
                <button
                  onClick={() => setAiExplanation(null)}
                  className="text-stone-400 hover:text-stone-600 text-xs font-semibold cursor-pointer"
                >
                  Ocultar
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-amber-900/90">
                {aiExplanation.map((exp, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-[#9E2A2B] font-bold">✓</span>
                    <span>{exp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Matrix Grid with Integrated Day Demand Header */}
          <div className="bg-white rounded-3xl border border-[#EADBC8] shadow-xs overflow-hidden">
            {/* Table Instructions / Legend */}
            <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#EADBC8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E6259]">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-[#D4A373]" />
                <span>
                  <strong>Tip:</strong> Haz clic en el <strong>encabezado del día</strong> para configurar la afluencia y demanda, o en las <strong>casillas</strong> para rotar turnos.
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 font-medium text-amber-900">
                  <Sun className="w-3.5 h-3.5 text-amber-500" /> Mediodía (4h)
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-indigo-900">
                  <Moon className="w-3.5 h-3.5 text-indigo-500" /> Noche (4h)
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-purple-900">
                  <Flame className="w-3.5 h-3.5 text-purple-500" /> Doble (8h)
                </span>
                <span className="inline-flex items-center gap-1 font-medium text-stone-500">
                  <span className="w-2 h-2 rounded-full bg-stone-300" /> Libre (0h)
                </span>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-[#EADBC8] text-[#2B2523] text-xs font-serif font-bold">
                    <th className="py-3.5 px-4 w-60">Trabajador & Preferencia</th>
                    {DAYS_OF_WEEK.map((d, idx) => {
                      const dayDate = new Date(currentMonday);
                      dayDate.setDate(currentMonday.getDate() + idx);
                      const dayCfg = demandConfig[d.dayNumber];
                      const isClosed = d.isClosed;
                      const dayDateStr = `${dayDate.getDate()} de ${dayDate.toLocaleDateString('es-ES', { month: 'long' })}`;

                      return (
                        <th
                          key={d.dayNumber}
                          className={`py-3 px-2 text-center border-l border-stone-100 transition-colors select-none ${
                            isClosed
                              ? 'bg-stone-100/70 text-stone-400 font-normal'
                              : 'cursor-pointer hover:bg-amber-50/60 group'
                          }`}
                          onClick={() => {
                            if (!isClosed) {
                              setSelectedDayForModal({
                                dayNumber: d.dayNumber,
                                name: d.name,
                                dateStr: dayDateStr,
                              });
                            }
                          }}
                          title={
                            isClosed
                              ? 'Lunes cerrado al público'
                              : `Haz clic para configurar afluencia y demanda de ${d.name}`
                          }
                        >
                          <div className="flex items-center justify-center gap-1">
                            <span className="font-bold text-xs group-hover:text-[#9E2A2B] transition-colors">
                              {d.name}
                            </span>
                            {!isClosed && (
                              <SlidersHorizontal className="w-3 h-3 text-[#9E2A2B] opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <div className="text-[10px] font-sans font-normal text-[#6E6259]">
                            {dayDate.getDate()}{' '}
                            {dayDate.toLocaleDateString('es-ES', { month: 'short' })}
                          </div>

                          {/* Day Demand Intensity Pill & Staff Required */}
                          {!isClosed && dayCfg ? (
                            <div className="mt-1.5 flex flex-col items-center gap-0.5">
                              <span
                                className={`inline-flex items-center gap-1 text-[9px] px-2 py-0.5 rounded-full font-bold border transition-all shadow-2xs group-hover:scale-105 ${
                                  INTENSITY_CONFIG[dayCfg.intensity].badgeColor
                                }`}
                              >
                                {dayCfg.intensity === 'DIFICIL' && <Flame className="w-2.5 h-2.5" />}
                                {dayCfg.intensity === 'FACIL' && <Sun className="w-2.5 h-2.5" />}
                                <span>{INTENSITY_CONFIG[dayCfg.intensity].label}</span>
                              </span>
                              <span className="text-[9px] text-stone-500 font-sans font-medium">
                                ☀️{dayCfg.minCocinaLunch + dayCfg.minCamareroLunch} / 🌙{dayCfg.minCocinaDinner + dayCfg.minCamareroDinner}
                              </span>
                            </div>
                          ) : isClosed ? (
                            <div className="mt-1.5">
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-stone-200 text-stone-500 font-sans font-medium">
                                Cerrado
                              </span>
                            </div>
                          ) : null}
                        </th>
                      );
                    })}
                    <th className="py-3.5 px-4 text-center border-l border-stone-100 w-36">
                      Cómputo Horas
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#EADBC8]/50 text-xs">
                  {workers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-stone-400">
                        No hay trabajadores registrados en la plantilla. Añádelos en la pestaña &quot;Gestión de Plantilla&quot;.
                      </td>
                    </tr>
                  ) : (
                    workers.map((w) => {
                      const totalAssigned = getWorkerHours(w.id);
                      const isUnder = totalAssigned < w.contractHours;
                      const isOver = totalAssigned > w.contractHours;
                      const isExact = totalAssigned === w.contractHours;

                      return (
                        <tr key={w.id} className="hover:bg-amber-50/20 transition-colors">
                          {/* Worker info column */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: w.colorTag || '#9E2A2B' }}
                              />
                              <div className="font-bold text-[#2B2523] truncate max-w-[150px]">
                                {w.name}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#6E6259]">
                              <span className="flex items-center gap-1">
                                {getRoleIcon(w.role)}
                                {w.role}
                              </span>
                              <span>•</span>
                              <span
                                className="truncate max-w-[120px] text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-700"
                                title={PREFERENCE_LABELS[w.preference]?.desc}
                              >
                                {PREFERENCE_LABELS[w.preference]?.label || w.preference}
                              </span>
                            </div>
                          </td>

                          {/* Day Cells */}
                          {DAYS_OF_WEEK.map((d) => {
                            const isClosed = d.isClosed;
                            const currentShift = getWorkerShift(w.id, d.dayNumber);

                            if (isClosed) {
                              return (
                                <td
                                  key={d.dayNumber}
                                  className="py-3 px-2 text-center bg-stone-100/50 border-l border-stone-100 text-stone-400 font-sans"
                                >
                                  <span className="text-[10px] text-stone-400 block">—</span>
                                </td>
                              );
                            }

                            // Render clickable shift cell
                            const isLunch = currentShift === 'LUNCH';
                            const isDinner = currentShift === 'DINNER';
                            const isDouble = currentShift === 'DOUBLE';
                            const isOff = currentShift === 'OFF';

                            let cellStyle = 'bg-stone-50/60 hover:bg-stone-100 text-stone-400 border border-transparent';
                            let icon = null;
                            let shiftLabel = 'Libre';
                            let hoursStr = '0h';

                            if (isLunch) {
                              cellStyle = 'bg-amber-50 text-amber-950 border-amber-200 hover:bg-amber-100/80 shadow-2xs';
                              icon = <Sun className="w-3.5 h-3.5 text-amber-600" />;
                              shiftLabel = '12-16';
                              hoursStr = '4h';
                            } else if (isDinner) {
                              cellStyle = 'bg-indigo-50 text-indigo-950 border-indigo-200 hover:bg-indigo-100/80 shadow-2xs';
                              icon = <Moon className="w-3.5 h-3.5 text-indigo-600" />;
                              shiftLabel = '20-00';
                              hoursStr = '4h';
                            } else if (isDouble) {
                              cellStyle = 'bg-purple-50 text-purple-950 border-purple-200 hover:bg-purple-100/80 shadow-2xs';
                              icon = <Flame className="w-3.5 h-3.5 text-purple-600" />;
                              shiftLabel = '12-16 / 20-00';
                              hoursStr = '8h';
                            }

                            const isMenuOpen =
                              activeCellMenu?.workerId === w.id &&
                              activeCellMenu?.dayNumber === d.dayNumber;

                            return (
                              <td
                                key={d.dayNumber}
                                className="py-2 px-1.5 text-center border-l border-stone-100 relative"
                              >
                                <button
                                  type="button"
                                  onClick={() => handleCycleShift(w.id, d.dayNumber)}
                                  onContextMenu={(e) => {
                                    e.preventDefault();
                                    setActiveCellMenu(isMenuOpen ? null : { workerId: w.id, dayNumber: d.dayNumber });
                                  }}
                                  className={`w-full py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer ${cellStyle} active:scale-95`}
                                  title="Clic izquierdo: alternar turno. Clic derecho: menú explícito."
                                >
                                  <div className="flex items-center gap-1 font-semibold text-[11px] leading-tight">
                                    {icon}
                                    <span className={isDouble ? 'text-[9.5px]' : ''}>{shiftLabel}</span>
                                  </div>
                                  <span className={`text-[9px] mt-0.5 ${isOff ? 'text-stone-300' : 'opacity-70'}`}>
                                    {hoursStr}
                                  </span>
                                </button>

                                {/* Context Menu for Direct Choice */}
                                {isMenuOpen && (
                                  <div
                                    className="absolute z-30 top-12 left-1/2 -translate-x-1/2 bg-white rounded-2xl shadow-xl border border-[#EADBC8] p-1.5 w-32 space-y-1 animate-in zoom-in-95"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="text-[10px] font-bold text-stone-400 px-2 py-0.5">
                                      Asignar Turno
                                    </div>
                                    <button
                                      onClick={() => handleSetExplicitShift(w.id, d.dayNumber, 'OFF')}
                                      className="w-full text-left px-2 py-1 rounded-lg text-[11px] hover:bg-stone-100 text-stone-700 font-medium flex items-center justify-between"
                                    >
                                      <span>Libre</span>
                                      <span className="text-[10px] text-stone-400">0h</span>
                                    </button>
                                    <button
                                      onClick={() => handleSetExplicitShift(w.id, d.dayNumber, 'LUNCH')}
                                      className="w-full text-left px-2 py-1 rounded-lg text-[11px] hover:bg-amber-50 text-amber-900 font-semibold flex items-center justify-between"
                                    >
                                      <span>Mediodía</span>
                                      <span className="text-[10px] text-amber-600">4h</span>
                                    </button>
                                    <button
                                      onClick={() => handleSetExplicitShift(w.id, d.dayNumber, 'DINNER')}
                                      className="w-full text-left px-2 py-1 rounded-lg text-[11px] hover:bg-indigo-50 text-indigo-900 font-semibold flex items-center justify-between"
                                    >
                                      <span>Noche</span>
                                      <span className="text-[10px] text-indigo-600">4h</span>
                                    </button>
                                    <button
                                      onClick={() => handleSetExplicitShift(w.id, d.dayNumber, 'DOUBLE')}
                                      className="w-full text-left px-2 py-1 rounded-lg text-[11px] hover:bg-purple-50 text-purple-900 font-semibold flex items-center justify-between"
                                    >
                                      <span>Doble</span>
                                      <span className="text-[10px] text-purple-600">8h</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            );
                          })}

                          {/* Total Hours Column */}
                          <td className="py-3 px-4 text-center border-l border-stone-100">
                            <div
                              className={`inline-flex flex-col items-center px-3 py-1.5 rounded-xl font-bold border ${
                                isExact
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                  : isUnder
                                  ? 'bg-amber-50 text-amber-900 border-amber-200'
                                  : 'bg-rose-50 text-rose-900 border-rose-200'
                              }`}
                            >
                              <span className="text-xs">
                                {totalAssigned}h / {w.contractHours}h
                              </span>
                              <span className="text-[10px] font-normal opacity-80">
                                {isExact
                                  ? '✓ Cumple contrato'
                                  : isUnder
                                  ? `Faltan ${w.contractHours - totalAssigned}h`
                                  : `Exceso ${totalAssigned - w.contractHours}h`}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Schedule Notes Bar */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#EADBC8] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-xs font-bold text-[#2B2523] shrink-0">
                  Observaciones del Cuadrante:
                </span>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="Ej: Semana de Feria / Refuerzo especial viernes y sábado noche..."
                  className="flex-1 px-3 py-1.5 rounded-xl border border-[#EADBC8] bg-white text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                />
              </div>

              <div className="text-[11px] text-[#6E6259]">
                Total asignado en plantilla:{' '}
                <strong className="text-[#9E2A2B]">
                  {shifts.reduce((sum, s) => sum + s.hours, 0)} horas
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sticky Sidebar on PC (Permanent) */}
        <aside className="hidden lg:flex flex-col w-72 2xl:w-80 shrink-0 bg-white border border-[#EADBC8] rounded-3xl overflow-hidden sticky top-20 max-h-[calc(100vh-6rem)] shadow-xs">
          <ScheduleCalendarSidebar
            currentMonday={currentMonday}
            onSelectWeek={(mondayDate) => {
              setCurrentMonday(mondayDate);
              loadScheduleForWeek(mondayDate);
            }}
            summary={yearSummary}
          />
        </aside>
      </div>

      {/* Mobile Drawer Backdrop */}
      {isCalendarDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200"
          onClick={() => setIsCalendarDrawerOpen(false)}
        >
          <div
            className="w-80 sm:w-88 h-full bg-white shadow-2xl animate-in slide-in-from-right duration-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <ScheduleCalendarSidebar
              currentMonday={currentMonday}
              onSelectWeek={(mondayDate) => {
                setCurrentMonday(mondayDate);
                loadScheduleForWeek(mondayDate);
                setIsCalendarDrawerOpen(false);
              }}
              summary={yearSummary}
              isMobileDrawer={true}
              onCloseMobileDrawer={() => setIsCalendarDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Day Demand Modal (Triggered by clicking on day header) */}
      {selectedDayForModal && (
        <DayDemandModal
          isOpen={true}
          onClose={() => setSelectedDayForModal(null)}
          dayNumber={selectedDayForModal.dayNumber}
          dayName={selectedDayForModal.name}
          dayDateStr={selectedDayForModal.dateStr}
          demand={
            demandConfig[selectedDayForModal.dayNumber] ||
            DEFAULT_WEEK_DEMAND[selectedDayForModal.dayNumber]
          }
          onSaveDemand={handleSaveDayDemand}
        />
      )}

      {/* Printable Report Modal */}
      <ScheduleReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        workers={workers}
        weekStartDate={currentMonday}
        shifts={shifts}
        notes={notes}
        demandConfig={demandConfig}
      />
    </div>
  );
}
