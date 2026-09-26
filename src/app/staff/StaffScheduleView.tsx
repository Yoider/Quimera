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
} from '@/lib/schedule/actions';
import ScheduleReportModal from './ScheduleReportModal';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Save,
  FileText,
  Clock,
  RotateCcw,
  Info,
  Sun,
  Moon,
  Flame,
  Shield,
  ChefHat,
  Utensils,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  Users,
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
  const [isDemandDrawerOpen, setIsDemandDrawerOpen] = useState(true);
  const [activeCellMenu, setActiveCellMenu] = useState<{ workerId: string; dayNumber: number } | null>(null);

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

  // Change Day Intensity (Fácil, Intermedio, Difícil/Buya)
  const handleIntensityChange = (dayNumber: number, intensity: DayIntensity) => {
    const config = INTENSITY_CONFIG[intensity];
    setDemandConfig((prev) => ({
      ...prev,
      [dayNumber]: {
        dayOfWeek: dayNumber,
        intensity,
        minCocinaLunch: config.defaultLunchCocina,
        minCamareroLunch: config.defaultLunchCamarero,
        minCocinaDinner: config.defaultDinnerCocina,
        minCamareroDinner: config.defaultDinnerCamarero,
      },
    }));
    setHasChanges(true);
  };

  // Adjust staffing counters
  const handleAdjustStaff = (
    dayNumber: number,
    field: 'minCocinaLunch' | 'minCamareroLunch' | 'minCocinaDinner' | 'minCamareroDinner',
    delta: number
  ) => {
    setDemandConfig((prev) => {
      const current = prev[dayNumber] || DEFAULT_WEEK_DEMAND[dayNumber];
      const newVal = Math.max(0, Math.min(5, current[field] + delta));
      return {
        ...prev,
        [dayNumber]: {
          ...current,
          [field]: newVal,
        },
      };
    });
    setHasChanges(true);
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

  // Dates display
  const sunday = new Date(currentMonday);
  sunday.setDate(currentMonday.getDate() + 6);
  const formatDateRange = () => {
    const startStr = currentMonday.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
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
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2B2523] text-white border border-[#D4A373] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-[#D4A373]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header & Controls Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#EADBC8] shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Week Navigator */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B] shrink-0">
            <Calendar className="w-5 h-5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrevWeek}
                className="p-1.5 rounded-lg border border-[#EADBC8] hover:bg-stone-100 text-[#2B2523] transition-colors"
                title="Semana anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-serif font-bold text-base md:text-lg text-[#2B2523]">
                Semana: {formatDateRange()}
              </span>

              <button
                onClick={handleNextWeek}
                className="p-1.5 rounded-lg border border-[#EADBC8] hover:bg-stone-100 text-[#2B2523] transition-colors"
                title="Semana siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                onClick={handleCurrentWeek}
                className="ml-1 px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-[#6E6259] text-xs font-semibold transition-colors"
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
          {/* AI Scheduler Trigger */}
          <button
            onClick={handleGenerateAI}
            disabled={isAiLoading || workers.length === 0}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#9E2A2B] via-[#b8383a] to-[#D4A373] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 text-amber-200 ${isAiLoading ? 'animate-spin' : ''}`} />
            <span>{isAiLoading ? 'Optimizando con IA...' : 'Generar Cuadrante con IA'}</span>
          </button>

          {/* Export / Report */}
          <button
            onClick={() => setIsReportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-2xl border border-[#EADBC8] bg-white hover:bg-stone-50 text-[#2B2523] text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <FileText className="w-4 h-4 text-[#9E2A2B]" />
            <span>Exportar / Imprimir</span>
          </button>

          {/* Save Button */}
          <button
            onClick={handleSaveSchedule}
            disabled={isPending || !hasChanges}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
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
            className="p-2.5 rounded-2xl border border-stone-200 hover:bg-rose-50 hover:border-rose-200 text-stone-400 hover:text-rose-600 transition-colors"
            title="Vaciar cuadrante"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Seville Tavern Demand Selector Panel (Flojo vs Buya) */}
      <div className="bg-white rounded-3xl border border-[#EADBC8] shadow-xs overflow-hidden transition-all">
        {/* Drawer Toggle Header */}
        <div
          onClick={() => setIsDemandDrawerOpen(!isDemandDrawerOpen)}
          className="px-6 py-4 bg-[#FAF8F5] border-b border-[#EADBC8] flex items-center justify-between cursor-pointer hover:bg-stone-50 transition-colors select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#D4A373]/20 flex items-center justify-center text-[#9E2A2B]">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm md:text-base text-[#2B2523] flex items-center gap-2">
                Previsión de Afluencia & Demanda (Días Flojos vs Buya)
                <span className="text-[11px] font-sans font-normal px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  Adaptativo para IA
                </span>
              </h4>
              <p className="text-xs text-[#6E6259]">
                Configura si cada día es <strong>Fácil (Flojo)</strong>, <strong>Intermedio</strong> o de <strong>Buya (Difícil)</strong> y cuántas personas se necesitan en cocina y sala.
              </p>
            </div>
          </div>

          <button className="text-stone-400 hover:text-[#2B2523] p-1">
            {isDemandDrawerOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Demand Cards Grid */}
        {isDemandDrawerOpen && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
              {DAYS_OF_WEEK.filter((d) => !d.isClosed).map((d) => {
                const dayConfig = demandConfig[d.dayNumber] || DEFAULT_WEEK_DEMAND[d.dayNumber];
                const intensity = dayConfig.intensity;
                const totalMediodia = dayConfig.minCocinaLunch + dayConfig.minCamareroLunch;
                const totalNoche = dayConfig.minCocinaDinner + dayConfig.minCamareroDinner;

                return (
                  <div
                    key={d.dayNumber}
                    className={`rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition-all ${
                      intensity === 'DIFICIL'
                        ? 'border-rose-200 bg-rose-50/20'
                        : intensity === 'FACIL'
                        ? 'border-emerald-200 bg-emerald-50/20'
                        : 'border-amber-200 bg-amber-50/20'
                    }`}
                  >
                    {/* Day Name & Intensity Badge */}
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-sm text-[#2B2523]">
                          {d.name}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            INTENSITY_CONFIG[intensity].badgeColor
                          }`}
                        >
                          {INTENSITY_CONFIG[intensity].sublabel}
                        </span>
                      </div>

                      {/* 3-Way Intensity Switch */}
                      <div className="grid grid-cols-3 gap-1 mt-2 p-1 bg-white rounded-xl border border-stone-200 shadow-2xs">
                        {(['FACIL', 'INTERMEDIO', 'DIFICIL'] as DayIntensity[]).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => handleIntensityChange(d.dayNumber, lvl)}
                            className={`py-1 rounded-lg text-[10px] font-bold transition-all text-center ${
                              intensity === lvl
                                ? lvl === 'DIFICIL'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : lvl === 'FACIL'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-amber-500 text-white shadow-xs'
                                : 'text-stone-500 hover:bg-stone-100'
                            }`}
                          >
                            {lvl === 'FACIL' ? 'Fácil' : lvl === 'INTERMEDIO' ? 'Interm.' : 'Buya'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Staff Requirement Counters */}
                    <div className="space-y-2 pt-2 border-t border-stone-200/70 text-xs">
                      {/* Mediodía */}
                      <div className="bg-white/80 p-2 rounded-xl border border-stone-200/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-amber-950">
                          <span className="flex items-center gap-1">
                            <Sun className="w-3 h-3 text-amber-500" /> Mediodía
                          </span>
                          <span className="font-bold text-[#9E2A2B]">
                            {totalMediodia} pers.
                          </span>
                        </div>

                        {/* Cocina Stepper */}
                        <div className="flex items-center justify-between text-[10px] text-stone-600">
                          <span>Cocina:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAdjustStaff(d.dayNumber, 'minCocinaLunch', -1)}
                              className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold text-[#2B2523]">
                              {dayConfig.minCocinaLunch}
                            </span>
                            <button
                              onClick={() => handleAdjustStaff(d.dayNumber, 'minCocinaLunch', 1)}
                              className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Sala Stepper */}
                        <div className="flex items-center justify-between text-[10px] text-stone-600">
                          <span>Camareros:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAdjustStaff(d.dayNumber, 'minCamareroLunch', -1)}
                              className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold text-[#2B2523]">
                              {dayConfig.minCamareroLunch}
                            </span>
                            <button
                              onClick={() => handleAdjustStaff(d.dayNumber, 'minCamareroLunch', 1)}
                              className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Noche */}
                      <div className="bg-white/80 p-2 rounded-xl border border-stone-200/60 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-indigo-950">
                          <span className="flex items-center gap-1">
                            <Moon className="w-3 h-3 text-indigo-500" /> Noche
                          </span>
                          <span className="font-bold text-[#9E2A2B]">
                            {totalNoche} pers.
                          </span>
                        </div>

                        {/* Cocina Stepper */}
                        <div className="flex items-center justify-between text-[10px] text-stone-600">
                          <span>Cocina:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAdjustStaff(d.dayNumber, 'minCocinaDinner', -1)}
                              className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold text-[#2B2523]">
                              {dayConfig.minCocinaDinner}
                            </span>
                            <button
                              onClick={() => handleAdjustStaff(d.dayNumber, 'minCocinaDinner', 1)}
                              className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Sala Stepper */}
                        <div className="flex items-center justify-between text-[10px] text-stone-600">
                          <span>Camareros:</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAdjustStaff(d.dayNumber, 'minCamareroDinner', -1)}
                              className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold text-[#2B2523]">
                              {dayConfig.minCamareroDinner}
                            </span>
                            <button
                              onClick={() => handleAdjustStaff(d.dayNumber, 'minCamareroDinner', 1)}
                              className="w-4 h-4 rounded bg-stone-100 hover:bg-stone-200 flex items-center justify-center font-bold text-stone-700"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
              className="text-stone-400 hover:text-stone-600 text-xs font-semibold"
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

      {/* Interactive Matrix Grid */}
      <div className="bg-white rounded-3xl border border-[#EADBC8] shadow-xs overflow-hidden">
        {/* Table Instructions / Legend */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-b border-[#EADBC8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#6E6259]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#D4A373]" />
            <span>
              <strong>Tip:</strong> Haz clic sobre cualquier casilla para alternar turno (Mediodía → Noche → Doble → Libre).
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

                  return (
                    <th
                      key={d.dayNumber}
                      className={`py-3 px-2 text-center border-l border-stone-100 ${
                        d.isClosed ? 'bg-stone-100/70 text-stone-400 font-normal' : ''
                      }`}
                    >
                      <div className="font-bold text-xs">{d.name}</div>
                      <div className="text-[10px] font-sans font-normal text-[#6E6259]">
                        {dayDate.getDate()} {dayDate.toLocaleDateString('es-ES', { month: 'short' })}
                      </div>

                      {/* Day Demand Intensity Pill */}
                      {!d.isClosed && dayCfg && (
                        <div className="mt-1">
                          <span
                            className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold border ${
                              INTENSITY_CONFIG[dayCfg.intensity].badgeColor
                            }`}
                          >
                            {INTENSITY_CONFIG[dayCfg.intensity].label}
                          </span>
                        </div>
                      )}
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
                        const shift = getWorkerShift(w.id, d.dayNumber);

                        if (d.isClosed) {
                          return (
                            <td
                              key={d.dayNumber}
                              className="py-3 px-2 text-center bg-stone-100/50 text-stone-400 border-l border-stone-100 select-none"
                            >
                              <div className="text-[11px] font-semibold text-stone-400">
                                Cerrado
                              </div>
                            </td>
                          );
                        }

                        // Shift visuals
                        let cellBg = 'bg-stone-50/60 hover:bg-stone-100 text-stone-400 border-stone-200';
                        let label = 'Libre';
                        let icon = null;

                        if (shift === 'LUNCH') {
                          cellBg = 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border-amber-300 font-bold';
                          label = 'Mediodía';
                          icon = <Sun className="w-3 h-3 text-amber-600 shrink-0" />;
                        } else if (shift === 'DINNER') {
                          cellBg = 'bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-900 border-indigo-300 font-bold';
                          label = 'Noche';
                          icon = <Moon className="w-3 h-3 text-indigo-600 shrink-0" />;
                        } else if (shift === 'DOUBLE') {
                          cellBg = 'bg-purple-500/15 hover:bg-purple-500/25 text-purple-900 border-purple-300 font-bold';
                          label = 'Doble Turno';
                          icon = <Flame className="w-3 h-3 text-purple-600 shrink-0" />;
                        }

                        const isMenuOpen =
                          activeCellMenu?.workerId === w.id && activeCellMenu?.dayNumber === d.dayNumber;

                        return (
                          <td
                            key={d.dayNumber}
                            className="py-2 px-1.5 text-center border-l border-stone-100 relative"
                          >
                            <button
                              onClick={() => handleCycleShift(w.id, d.dayNumber)}
                              onContextMenu={(e) => {
                                e.preventDefault();
                                setActiveCellMenu(isMenuOpen ? null : { workerId: w.id, dayNumber: d.dayNumber });
                              }}
                              className={`w-full py-2 px-1.5 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 active:scale-95 shadow-2xs ${cellBg}`}
                              title="Clic para cambiar de turno. Clic derecho para selector completo."
                            >
                              <div className="flex items-center gap-1">
                                {icon}
                                <span className="text-[11px] leading-tight">{label}</span>
                              </div>
                              <span className="text-[9px] opacity-75 font-sans">
                                {shift === 'OFF' ? '0h' : shift === 'DOUBLE' ? '8h' : '4h'}
                              </span>
                            </button>

                            {/* Dropdown Menu when right-clicked */}
                            {isMenuOpen && (
                              <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-xl border border-stone-200 p-1.5 w-36 text-left flex flex-col gap-1">
                                <button
                                  onClick={() => handleSetExplicitShift(w.id, d.dayNumber, 'OFF')}
                                  className="w-full text-left px-2 py-1 rounded-lg text-[11px] hover:bg-stone-100 text-stone-600 flex items-center justify-between"
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
