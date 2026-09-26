'use client';

import React, { useState } from 'react';
import {
  Worker,
  ShiftType,
  DAYS_OF_WEEK,
  SHIFT_LABELS,
  WeekDemandConfig,
  INTENSITY_CONFIG,
} from '@/lib/schedule/types';
import { X, Copy, Check, Printer, FileText, Share2, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ScheduleReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  weekStartDate: Date;
  shifts: { userId: string; dayOfWeek: number; shiftType: ShiftType; hours: number }[];
  notes?: string;
  demandConfig?: WeekDemandConfig;
}

export default function ScheduleReportModal({
  isOpen,
  onClose,
  workers,
  weekStartDate,
  shifts,
  notes,
  demandConfig,
}: ScheduleReportModalProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const reportRef = React.useRef<HTMLDivElement>(null);

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
    if (demandConfig) {
      const buyaDays = DAYS_OF_WEEK.filter(
        (d) => !d.isClosed && demandConfig[d.dayNumber]?.intensity === 'DIFICIL'
      ).map((d) => d.name);
      const flojoDays = DAYS_OF_WEEK.filter(
        (d) => !d.isClosed && demandConfig[d.dayNumber]?.intensity === 'FACIL'
      ).map((d) => d.name);

      if (buyaDays.length > 0) {
        text += `🔥 *Días de Buya (Refuerzo):* ${buyaDays.join(', ')}\n`;
      }
      if (flojoDays.length > 0) {
        text += `🌿 *Días Flojos (Servicio ágil):* ${flojoDays.join(', ')}\n`;
      }
    }
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

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      // Create pristine A4 Landscape PDF (297 x 210 mm)
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Brand Title Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(158, 42, 43); // #9E2A2B Quimera Wine
      doc.text('TABERNA QUIMERA · SEVILLA', 14, 14);

      doc.setFontSize(18);
      doc.setTextColor(43, 37, 35); // #2B2523 Dark Charcoal
      doc.text('Cuadrante Oficial de Turnos', 14, 22);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(110, 98, 89);
      doc.text(`Válido del ${formatDate(monday)} al ${formatDate(sunday)}`, 14, 28);

      // Optional Manager Notes Box
      if (notes) {
        doc.setFillColor(254, 243, 199); // #FEF3C7 Amber
        doc.roundedRect(14, 31, 269, 7, 1.5, 1.5, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(146, 64, 14); // #92400E
        doc.text(`Aviso de Gerencia: ${notes}`, 17, 35.5);
      }

      // Build Table Headers
      const headers = [
        'Trabajador / Rol',
        ...DAYS_OF_WEEK.map((d, idx) => {
          const shortDay = formatShortDay(monday, idx);
          if (d.isClosed) return `${d.name} ${shortDay}\n(Cerrado)`;
          const intensity = demandConfig?.[d.dayNumber]?.intensity;
          const intensityLabel = intensity ? INTENSITY_CONFIG[intensity].label : '';
          return `${d.name} ${shortDay}${intensityLabel ? `\n(${intensityLabel})` : ''}`;
        }),
        'Total Horas',
      ];

      // Build Table Body Rows
      const rows = workers.map((w) => {
        const total = getWorkerHours(w.id);
        const workerCol = `${w.name}\n${w.role} (${w.contractHours}h)`;
        const dayCols = DAYS_OF_WEEK.map((d) => {
          if (d.isClosed) return 'Cerrado';
          const shift = shiftMap.get(`${w.id}-${d.dayNumber}`) || 'OFF';
          if (shift === 'LUNCH') return '12:00 - 16:00';
          if (shift === 'DINNER') return '20:00 - 00:00';
          if (shift === 'DOUBLE') return '12-16 / 20-00';
          return 'Libre';
        });
        const hoursCol = `${total}h / ${w.contractHours}h`;
        return [workerCol, ...dayCols, hoursCol];
      });

      // Render Table with autoTable
      autoTable(doc, {
        startY: notes ? 41 : 33,
        head: [headers],
        body: rows,
        theme: 'grid',
        headStyles: {
          fillColor: [158, 42, 43], // #9E2A2B
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8.5,
          cellPadding: 3,
        },
        columnStyles: {
          0: { cellWidth: 46, halign: 'left', fontStyle: 'bold' },
          8: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
        },
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [229, 231, 235],
          lineWidth: 0.2,
          valign: 'middle',
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const colIdx = data.column.index;
            if (colIdx >= 1 && colIdx <= 7) {
              data.cell.styles.halign = 'center';
              const val = String(data.cell.raw);
              if (val === 'Cerrado') {
                data.cell.styles.fillColor = [243, 244, 246];
                data.cell.styles.textColor = [156, 163, 175];
              } else if (val.includes('12:00')) {
                data.cell.styles.fillColor = [254, 243, 199];
                data.cell.styles.textColor = [146, 64, 14];
                data.cell.styles.fontStyle = 'bold';
              } else if (val.includes('20:00')) {
                data.cell.styles.fillColor = [224, 231, 255];
                data.cell.styles.textColor = [49, 46, 129];
                data.cell.styles.fontStyle = 'bold';
              } else if (val.includes('12-16')) {
                data.cell.styles.fillColor = [237, 233, 254];
                data.cell.styles.textColor = [91, 33, 182];
                data.cell.styles.fontStyle = 'bold';
              } else if (val === 'Libre') {
                data.cell.styles.fillColor = [250, 250, 250];
                data.cell.styles.textColor = [156, 163, 175];
              }
            } else if (colIdx === 8) {
              data.cell.styles.halign = 'center';
              const val = String(data.cell.raw);
              const parts = val.replace(/h/g, '').split('/');
              const curH = Number(parts[0]?.trim());
              const maxH = Number(parts[1]?.trim());
              if (!isNaN(curH) && !isNaN(maxH)) {
                if (curH > maxH) {
                  data.cell.styles.fillColor = [255, 228, 230];
                  data.cell.styles.textColor = [159, 18, 57];
                } else if (curH < maxH) {
                  data.cell.styles.fillColor = [254, 243, 199];
                  data.cell.styles.textColor = [146, 64, 14];
                } else {
                  data.cell.styles.fillColor = [209, 250, 229];
                  data.cell.styles.textColor = [6, 95, 70];
                }
              }
            }
          }
        },
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 140;

      // Legend Section
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(43, 37, 35);
      doc.text('Leyenda de Turnos:', 14, finalY + 9);

      doc.setFont('helvetica', 'normal');
      // Mediodía (Amber dot)
      doc.setFillColor(251, 191, 36);
      doc.circle(52, finalY + 8, 2, 'F');
      doc.text('Mediodía (12:00 a 16:00)', 56, finalY + 9);

      // Noche (Indigo dot)
      doc.setFillColor(99, 102, 241);
      doc.circle(108, finalY + 8, 2, 'F');
      doc.text('Noche (20:00 a 00:00)', 112, finalY + 9);

      // Doble (Purple dot)
      doc.setFillColor(168, 85, 247);
      doc.circle(160, finalY + 8, 2, 'F');
      doc.text('Doble Turno (8 horas)', 164, finalY + 9);

      // Libre (Stone dot)
      doc.setFillColor(209, 213, 219);
      doc.circle(210, finalY + 8, 2, 'F');
      doc.text('Libre', 214, finalY + 9);

      // Footer note
      doc.setFontSize(7.5);
      doc.setTextColor(156, 163, 175);
      doc.text('Documento oficial generado por Taberna Quimera · Sevilla', 14, finalY + 16);

      const startStr = monday.toISOString().split('T')[0];
      doc.save(`cuadrante-quimera-${startStr}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el documento PDF del cuadrante.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-5xl w-full border border-[#D4A373]/50 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#2B2523] text-white flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 print:hidden">
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Download as PDF Button */}
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#9E2A2B] to-[#D4A373] hover:brightness-110 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              title="Descargar cuadrante oficial en documento PDF para imprimir o enviar"
            >
              <FileDown className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
              <span>{isDownloading ? 'Generando PDF...' : 'Descargar PDF'}</span>
            </button>

            {/* Copy for WhatsApp */}
            <button
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-200" /> : <Share2 className="w-4 h-4" />}
              <span>{copied ? '¡Copiado!' : 'WhatsApp'}</span>
            </button>

            {/* Print */}
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

        {/* Printable & Exportable Content Body */}
        <div ref={reportRef} className="p-6 md:p-8 overflow-y-auto bg-[#FAF8F5] print:p-0">
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
                  <th className="py-3 px-4 min-w-[190px] whitespace-nowrap">Trabajador / Rol</th>
                  {DAYS_OF_WEEK.map((d, idx) => (
                    <th
                      key={d.dayNumber}
                      className={`py-3 px-2 text-center whitespace-nowrap ${
                        d.isClosed ? 'bg-stone-100 text-stone-400 font-normal' : ''
                      }`}
                    >
                      <div className="font-bold text-xs">{d.name}</div>
                      <div className="text-[10px] font-sans font-normal text-[#6E6259]">
                        {formatShortDay(monday, idx)}
                      </div>
                      {!d.isClosed && demandConfig && demandConfig[d.dayNumber] && (
                        <div className="mt-1">
                          <span
                            className={`inline-block text-[9px] px-2 py-0.5 rounded-full font-bold whitespace-nowrap border ${
                              INTENSITY_CONFIG[demandConfig[d.dayNumber].intensity].badgeColor
                            }`}
                          >
                            {INTENSITY_CONFIG[demandConfig[d.dayNumber].intensity].label}
                          </span>
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-center whitespace-nowrap">Horas Totales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {workers.map((w) => {
                  const total = getWorkerHours(w.id);
                  const isUnder = total < w.contractHours;
                  const isOver = total > w.contractHours;

                  return (
                    <tr key={w.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 min-w-[190px]">
                        <div className="font-bold text-[#2B2523] whitespace-nowrap">{w.name}</div>
                        <div className="text-[11px] text-[#6E6259] whitespace-nowrap">
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
                              className="py-3 px-2 text-center bg-stone-50/70 text-stone-400 text-[11px] whitespace-nowrap"
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
                          <td key={d.dayNumber} className="py-3 px-2 text-center whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap border ${badgeBg}`}
                            >
                              {label}
                            </span>
                          </td>
                        );
                      })}

                      <td className="py-3 px-4 text-center font-bold whitespace-nowrap">
                        <span
                          className={`inline-block px-3 py-1 rounded-lg text-xs whitespace-nowrap font-bold ${
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
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs text-[#6E6259] pt-4 border-t border-stone-200">
            <div className="flex flex-wrap items-center gap-4">
              <span className="font-semibold text-[#2B2523] whitespace-nowrap">Leyenda:</span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Mediodía (12:00 a 16:00)
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Noche (20:00 a 00:00)
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Doble Turno (8 horas)
              </span>
              <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-stone-300" /> Libre
              </span>
            </div>

            <div className="text-[11px] italic whitespace-nowrap">
              Generado por el Sistema de Gestión Taberna Quimera
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#FAF8F5] border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="text-xs text-[#6E6259]">
            💡 Puedes descargar el documento PDF oficial listo para imprimir o compartirlo por WhatsApp.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#852324] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>{isDownloading ? 'Generando PDF...' : 'Descargar como PDF'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-stone-300 text-xs font-semibold text-[#6E6259] hover:bg-stone-100 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
