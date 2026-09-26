'use client';

import React, { useEffect } from 'react';
import { X, Clock } from 'lucide-react';
import ScheduleTable from './ScheduleTable';

interface ScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ScheduleModal({ isOpen, onClose }: ScheduleModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#EADBC8] p-6 space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#6E6259] hover:bg-stone-100 hover:text-[#2B2523] transition-colors"
          aria-label="Cerrar modal de horario"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#EADBC8] pb-3">
          <div className="w-10 h-10 rounded-full bg-[#9E2A2B]/10 flex items-center justify-center text-[#9E2A2B]">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-xl text-[#2B2523]">
              Horarios Taberna Quimera
            </h3>
            <p className="text-xs text-[#6E6259]">
              Servicio de barra, cocina y mesas en Sevilla
            </p>
          </div>
        </div>

        <ScheduleTable />

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#9E2A2B] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#832223] transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
