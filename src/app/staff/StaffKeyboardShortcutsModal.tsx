'use client';

import React from 'react';
import {
  X,
  Keyboard,
  Move,
  Navigation,
  Sliders,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';

interface StaffKeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  badge?: string;
}

interface ShortcutSection {
  title: string;
  icon: React.ReactNode;
  color: string;
  items: ShortcutItem[];
}

export default function StaffKeyboardShortcutsModal({
  isOpen,
  onClose,
}: StaffKeyboardShortcutsModalProps) {
  if (!isOpen) return null;

  const sections: ShortcutSection[] = [
    {
      title: 'Navegación & Selección',
      icon: <Navigation className="w-4 h-4 text-[#D4A373]" />,
      color: 'border-[#D4A373]/30',
      items: [
        { keys: ['Tab'], description: 'Seleccionar siguiente mesa del plano' },
        { keys: ['Shift', 'Tab'], description: 'Seleccionar mesa anterior' },
        { keys: ['Clic'], description: 'Abrir comanda de mesa / Seleccionar zona' },
        { keys: ['Esc'], description: 'Deseleccionar ítem o cerrar menús' },
      ],
    },
    {
      title: 'Movimiento & Reubicación',
      icon: <Move className="w-4 h-4 text-[#9E2A2B]" />,
      color: 'border-[#9E2A2B]/30',
      items: [
        { keys: ['↑', '↓', '←', '→'], description: 'Mover mesa o zona seleccionada (2.5%)' },
        { keys: ['Shift', 'Flechas'], description: 'Movimiento rápido amplio (5.0%)' },
        { keys: ['Alt', 'Flechas'], description: 'Movimiento fino de precisión (1.0%)' },
        { keys: ['Sostener'], description: 'Press & Hold (220ms) para arrastre fluido con ratón' },
      ],
    },
    {
      title: 'Herramientas & Modos',
      icon: <Sliders className="w-4 h-4 text-emerald-600" />,
      color: 'border-emerald-500/30',
      items: [
        { keys: ['D'], description: 'Alternar Modo Diseño / Modo Servicio' },
        { keys: ['G'], description: 'Activar / Desactivar Rejilla Snap (2.5%)' },
        { keys: ['S'], description: 'Mostrar / Ocultar Barra Lateral 2D' },
        { keys: ['?'], description: 'Abrir / Cerrar esta guía de atajos' },
      ],
    },
    {
      title: 'Gestión de Sala & Comandas',
      icon: <ShoppingBag className="w-4 h-4 text-blue-600" />,
      color: 'border-blue-500/30',
      items: [
        { keys: ['Enter', 'o', 'Espacio'], description: 'Abrir comanda TPV táctil de la mesa' },
        { keys: ['T', 'o', 'M'], description: 'Añadir nueva Mesa rápida al plano' },
        { keys: ['Z'], description: 'Delimitar nueva Zona en el plano' },
        { keys: ['Supr'], description: 'Eliminar mesa o zona seleccionada' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-[#FAF8F5] rounded-3xl border border-[#EADBC8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2B2523] px-5 py-4 text-white flex items-center justify-between border-b border-[#3D3532]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9E2A2B] text-white flex items-center justify-center shadow-md">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base tracking-wide">
                  Atajos de Teclado del Tablero 2D
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#D4A373]/20 text-[#D4A373] text-[10px] font-bold border border-[#D4A373]/40">
                  Productividad Sala
                </span>
              </div>
              <p className="text-xs text-stone-300">
                Controla mesas, zonas y comandas a máxima velocidad sin usar el ratón
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Grid */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {sections.map((sec, idx) => (
              <div
                key={idx}
                className={`bg-white rounded-2xl p-3.5 border ${sec.color} shadow-xs flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center gap-2 mb-2.5 font-bold text-xs text-[#2B2523]">
                    {sec.icon}
                    <span>{sec.title}</span>
                  </div>

                  <div className="space-y-2">
                    {sec.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between gap-2 text-xs py-1 border-b border-stone-100 last:border-0"
                      >
                        <span className="text-stone-600 text-[11.5px] leading-tight">
                          {item.description}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              {k === 'o' ? (
                                <span className="text-[10px] text-stone-400 font-semibold">o</span>
                              ) : (
                                <kbd className="px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-300 shadow-2xs font-mono font-bold text-[10.5px] text-[#2B2523]">
                                  {k}
                                </kbd>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Tip Footer */}
          <div className="bg-[#9E2A2B]/10 rounded-2xl p-3 border border-[#9E2A2B]/20 flex items-center gap-2.5 text-xs text-stone-700">
            <Sparkles className="w-4 h-4 text-[#9E2A2B] shrink-0" />
            <span>
              <strong>Protección de escritura inteligente:</strong> Cuando estés escribiendo en notas de cocina, buscadores o campos de texto, los atajos de teclado se suspenden automáticamente para que puedas escribir con libertad.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-stone-50 border-t border-[#EADBC8] flex items-center justify-between text-xs text-stone-500">
          <span>Pulsa <kbd className="px-1.5 py-0.5 rounded bg-white border font-mono font-bold text-stone-700">?</kbd> en cualquier momento para ver esta guía</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2B2523] hover:bg-[#1F1B1A] text-white font-semibold transition-colors cursor-pointer shadow-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
