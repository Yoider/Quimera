'use client';

import React, { useState } from 'react';
import { Worker, ShiftType, DAYS_OF_WEEK, SHIFT_LABELS } from '@/lib/schedule/types';
import { X, Copy, Check, Printer, FileText, Share2 } from 'lucide-react';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  weekStartDate: Date;
  shifts: { userId: string; dayOfWeek: number; shiftType: ShiftType; hours: number }[];
  notes?: string;
}

export default function ScheduleReportModal({
  isOpen,
  onClose,
  workers,
  weekStartDate,
  shifts,
  notes,
}: ScheduleReportModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Format dates for display
  const monday = new Date(weekStartDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatDate = (d: Date) =>
    d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

  const formatShortDay = (d: Date, dayOffset: number) => {
    const day = new Date(d);
    day.setDate(d.getDate() + dayOffset);
    return day.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  };

  // Build matrix lookup
  const shiftMap = new Map<string, ShiftType>();
  shifts.forEach((s) => {
    shiftMap.set(`${s.userId}-${s.dayOfWeek}`, s.shiftType);
  });

  // Calculate worker total hours
  const getWorkerHours = (workerId: string) => {
    return shifts
      .filter((s) => s.userId === workerId)
      .reduce((sum, s) => sum + s.hours, 0);
  };

  // Generate WhatsApp-friendly text
  const generateWhatsAppText = () => {
    let text = `🍷 *TABERNA QUIMERA — HORARIO SEMANAL*\n`;
    text += `📅 *Semana:* ${formatDate(monday)} al ${formatDate(sunday)}\n`;
    text += `🚪 *Lunes:* CERRADO (Descanso del personal)\n`;
    if (notes) {
      text += `📝 *Aviso:* ${notes}\n`;
    }
    text += `------------------------------------\n\n`;

    workers.forEach((w) => {
      const hours = getWorkerHours(w.id);
      text += `👤 *${w.name}* (${w.role} | ${hours}h de ${w.contractHours}h)\n`;

      DAYS_OF_WEEK.forEach((d) => {
        const type = shiftMap.get(`${w.id}-${d.dayNumber}`) || (d.dayNumber === 1 ? 'OFF' : 'OFF');
        let icon = '⚪';
        let label = 'Libre';

        if (d.dayNumber === 1) {
          icon = '🔒';
          label = 'Cerrado';
        } else if (type === 'LUNCH') {
          icon = '☀️';
          label = 'Mediodía (12:00-16:00)';
        } else if (type === 'DINNER') {
          icon = '🌙';
          label = 'Noche (20:00-00:00)';
        } else if (type === 'DOUBLE') {
          icon = '🔥';
          label = 'Doble (12-16h / 20-00h)';
        }

        text += `  • ${d.name}: ${icon} ${label}\n`;
      });
      text += `\n`;
    });

    text += `✨ *Taberna Quimera* — ¡Buena semana a todo el equipo!`;
    return text;
  };

  const handleCopyWhatsApp = async () => {
    try {
      const text = generateWhatsAppText();
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert('No se pudo copiar automáticamente al portapapeles.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-[#D4A373]/50 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#2B2523] text-white flex items-center justify-between border-b border-stone-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#9E2A2B] flex items-center justify-center text-amber-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">
                Reporte de Horarios Semanales
              </h3>
              <p className="text-xs text-[#D4A373]">
                Semana del {formatDate(monday)} al {formatDate(sunday)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? '¡Copiado para WhatsApp!' : 'Copiar para WhatsApp'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-colors"
            >
              <Printer className="w-4 h-4 text-amber-200" />
              <span>Imprimir</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Body */}
        <div className="p-6 md:p-8 overflow-y-auto print:p-0">
          <div className="text-center mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#9E2A2B]">
              Taberna Quimera · Sevilla
            </span>
            <h2 className="font-serif font-bold text-2xl md:text-3xl text-[#2B2523] mt-1">
              Cuadrante Oficial de Turnos
            </h2>
            <p className="text-sm text-[#6E6259] mt-1">
              Válido del <strong>{formatDate(monday)}</strong> al <strong>{formatDate(sunday)}</strong>
            </p>
            {notes && (
              <div className="mt-3 inline-block px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium">
                📌 <strong>Aviso del Gerente:</strong> {notes}
              </div>
            )}
          </div>

          {/* Matrix Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-2xl shadow-xs">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-stone-200 text-[#2B2523] font-serif font-bold">
                  <th className="py-3 px-4">Trabajador / Rol</th>
                  {DAYS_OF_WEEK.map((d, idx) => (
                    <th
                      key={d.dayNumber}
                      className={`py-3 px-3 text-center ${
                        d.isClosed ? 'bg-stone-100 text-stone-400 font-normal' : ''
                      }`}
                    >
                      <div>{d.name}</div>
                      <div className="text-[10px] font-sans font-normal text-[#6E6259]">
                        {formatShortDay(monday, idx)}
                      </div>
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center">Horas Totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {workers.map((w) => {
                  const total = getWorkerHours(w.id);
                  const isUnder = total < w.contractHours;
                  const isOver = total > w.contractHours;

                  return (
                    <tr key={w.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#2B2523]">{w.name}</div>
                        <div className="text-[11px] text-[#6E6259]">
                          {w.role} · Contrato {w.contractHours}h
                        </div>
                      </td>

                      {DAYS_OF_WEEK.map((d) => {
                        const shift =
                          shiftMap.get(`${w.id}-${d.dayNumber}`) || (d.dayNumber === 1 ? 'OFF' : 'OFF');

                        if (d.isClosed) {
                          return (
                            <td
                              key={d.dayNumber}
                              className="py-3 px-2 text-center bg-stone-50/70 text-stone-400 text-[11px]"
                            >
                              Cerrado
                            </td>
                          );
                        }

                        let badgeBg = 'bg-stone-50 text-stone-400 border-stone-200';
                        let label = 'Libre';

                        if (shift === 'LUNCH') {
                          badgeBg = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                          label = '12:00 - 16:00';
                        } else if (shift === 'DINNER') {
                          badgeBg = 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
                          label = '20:00 - 00:00';
                        } else if (shift === 'DOUBLE') {
                          badgeBg = 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
                          label = '12-16 / 20-00';
                        }

                        return (
                          <td key={d.dayNumber} className="py-3 px-2 text-center">
                            <span
                              className={`inline-block px-2 py-1 rounded-md text-[11px] border ${badgeBg}`}
                            >
                              {label}
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-center font-bold">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs ${
                            isOver
                              ? 'bg-rose-100 text-rose-800'
                              : isUnder
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {total}h / {w.contractHours}h
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend and Info */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#6E6259] pt-4 border-t border-stone-100">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#2B2523]">Leyenda:</span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Mediodía (12:00 a 16:00)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Noche (20:00 a 00:00)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Doble Turno (8 horas)
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-300" /> Libre
              </span>
            </div>

            <div className="text-[11px] italic">
              Generado por el Sistema de Gestión Taberna Quimera
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-stone-200 flex items-center justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-[#6E6259] hover:bg-stone-100 transition-colors"
          >
            Cerrar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
