'use client';

import React, { useState, useEffect } from 'react';
import {
  DayIntensity,
  DayDemand,
  INTENSITY_CONFIG,
} from '@/lib/schedule/types';
import {
  X,
  Sun,
  Moon,
  ChefHat,
  Utensils,
  Sparkles,
  Flame,
  Check,
  Calendar,
} from 'lucide-react';

interface DayDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  dayNumber: number;
  dayName: string;
  dayDateStr: string;
  demand: DayDemand;
  onSaveDemand: (dayNumber: number, updatedDemand: DayDemand) => void;
}

export default function DayDemandModal({
  isOpen,
  onClose,
  dayNumber,
  dayName,
  dayDateStr,
  demand,
  onSaveDemand,
}: DayDemandModalProps) {
  const [intensity, setIntensity] = useState<DayIntensity>(demand.intensity);
  const [minCocinaLunch, setMinCocinaLunch] = useState<number>(demand.minCocinaLunch);
  const [minCamareroLunch, setMinCamareroLunch] = useState<number>(demand.minCamareroLunch);
  const [minCocinaDinner, setMinCocinaDinner] = useState<number>(demand.minCocinaDinner);
  const [minCamareroDinner, setMinCamareroDinner] = useState<number>(demand.minCamareroDinner);

  // Sync internal state when opened or demand prop changes
  useEffect(() => {
    if (isOpen) {
      setIntensity(demand.intensity);
      setMinCocinaLunch(demand.minCocinaLunch);
      setMinCamareroLunch(demand.minCamareroLunch);
      setMinCocinaDinner(demand.minCocinaDinner);
      setMinCamareroDinner(demand.minCamareroDinner);
    }
  }, [isOpen, demand]);

  if (!isOpen) return null;

  const totalLunch = minCocinaLunch + minCamareroLunch;
  const totalDinner = minCocinaDinner + minCamareroDinner;
  const totalDay = totalLunch + totalDinner;

  const handleApply = () => {
    onSaveDemand(dayNumber, {
      dayOfWeek: dayNumber,
      intensity,
      minCocinaLunch,
      minCamareroLunch,
      minCocinaDinner,
      minCamareroDinner,
    });
    onClose();
  };

  // Adjust steppers with min bound of 0 and max 10
  const adjust = (
    setter: React.Dispatch<React.SetStateAction<number>>,
    delta: number
  ) => {
    setter((prev) => Math.max(0, Math.min(10, prev + delta)));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl border border-[#EADBC8] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 bg-[#FAF8F5] border-b border-[#EADBC8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B] shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-lg text-[#2B2523]">
                  {dayName}
                </h3>
                <span className="text-xs text-[#9E2A2B] font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                  {dayDateStr}
                </span>
              </div>
              <p className="text-xs text-[#6E6259] mt-0.5">
                Previsión de Afluencia & Dotación de Personal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-[#2B2523] hover:bg-stone-100 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto custom-scrollbar">
          {/* Intensity Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-2">
              Nivel de Afluencia del Día
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-[#FAF8F5] rounded-2xl border border-[#EADBC8]">
              {(['FACIL', 'INTERMEDIO', 'DIFICIL'] as DayIntensity[]).map((lvl) => {
                const config = INTENSITY_CONFIG[lvl];
                const isSelected = intensity === lvl;
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setIntensity(lvl)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                      isSelected
                        ? lvl === 'DIFICIL'
                          ? 'bg-[#9E2A2B] text-white shadow-md'
                          : lvl === 'FACIL'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : 'bg-amber-500 text-white shadow-md'
                        : 'text-stone-600 hover:bg-white hover:text-[#2B2523]'
                    }`}
                  >
                    <span>{config.label}</span>
                    <span
                      className={`text-[10px] font-normal ${
                        isSelected ? 'text-white/90' : 'text-stone-400'
                      }`}
                    >
                      {config.sublabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shifts Staffing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Mediodía Box */}
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-amber-950">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>Turno Mediodía</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {totalLunch} pers.
                </span>
              </div>

              {/* Cocina */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-stone-700">
                  <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cocina:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjust(setMinCocinaLunch, -1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-[#2B2523]">
                    {minCocinaLunch}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjust(setMinCocinaLunch, 1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Camareros */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-stone-700">
                  <Utensils className="w-3.5 h-3.5 text-blue-700" />
                  <span>Camareros:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjust(setMinCamareroLunch, -1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-[#2B2523]">
                    {minCamareroLunch}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjust(setMinCamareroLunch, 1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Noche Box */}
            <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/30 space-y-3">
              <div className="flex items-center justify-between border-b border-indigo-200/60 pb-2">
                <div className="flex items-center gap-1.5 font-bold text-xs text-indigo-950">
                  <Moon className="w-4 h-4 text-indigo-500" />
                  <span>Turno Noche</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300">
                  {totalDinner} pers.
                </span>
              </div>

              {/* Cocina */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-stone-700">
                  <ChefHat className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Cocina:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjust(setMinCocinaDinner, -1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-[#2B2523]">
                    {minCocinaDinner}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjust(setMinCocinaDinner, 1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Camareros */}
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-stone-700">
                  <Utensils className="w-3.5 h-3.5 text-blue-700" />
                  <span>Camareros:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjust(setMinCamareroDinner, -1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <span className="w-5 text-center font-bold text-[#2B2523]">
                    {minCamareroDinner}
                  </span>
                  <button
                    type="button"
                    onClick={() => adjust(setMinCamareroDinner, 1)}
                    className="w-6 h-6 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 active:scale-95 transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI Helper Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <Sparkles className="w-4 h-4 text-[#9E2A2B] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Efecto en la Asignación Inteligente:</span>
              <p className="text-[11px] text-amber-900/80 mt-0.5">
                Al pulsar &quot;Generar Cuadrante con IA&quot;, el algoritmo garantizará como mínimo{' '}
                <strong>{totalLunch} personas al mediodía</strong> y{' '}
                <strong>{totalDinner} personas por la noche</strong> respetando las horas de contrato y descanso de los trabajadores.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#EADBC8] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-[#EADBC8] bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#852324] text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Aplicar al Día</span>
          </button>
        </div>
      </div>
    </div>
  );
}
