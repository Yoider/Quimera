'use client';

import React, { useState } from 'react';
import {
  RestaurantZoneData,
  RestaurantTableData,
} from './orderActions';
import {
  Maximize2,
  Trash2,
  Plus,
  Minus,
  Palette,
  X,
  Users,
  UtensilsCrossed,
  Square,
  Circle,
  RectangleHorizontal,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface StaffCanvasItemToolbarProps {
  selectedItem:
    | { type: 'zone'; zone: RestaurantZoneData }
    | { type: 'table'; table: RestaurantTableData }
    | null;
  allZones: RestaurantZoneData[];
  onUpdateZone: (zoneId: string, updates: Partial<RestaurantZoneData>) => Promise<void>;
  onDeleteZone: (zoneId: string) => Promise<void>;
  onAddTableInZone: (zone: RestaurantZoneData) => void;
  onBringForwardZone?: (zoneId: string) => void;
  onSendBackwardZone?: (zoneId: string) => void;
  onUpdateTable: (tableId: string, updates: Partial<RestaurantTableData>) => Promise<void>;
  onDeleteTable: (table: RestaurantTableData) => Promise<void>;
  onOpenTableOrder?: (table: RestaurantTableData) => void;
  onDeselect: () => void;
}

const PRESET_COLORS = [
  { name: 'Burdeos Quimera', hex: '#9E2A2B' },
  { name: 'Albero Camas', hex: '#D4A373' },
  { name: 'Esmeralda Oliva', hex: '#2A9D8F' },
  { name: 'Azul Guadalquivir', hex: '#457B9D' },
  { name: 'Coral Flamenco', hex: '#E76F51' },
  { name: 'Púrpura Sevillano', hex: '#8338EC' },
];

export default function StaffCanvasItemToolbar({
  selectedItem,
  allZones,
  onUpdateZone,
  onDeleteZone,
  onAddTableInZone,
  onBringForwardZone,
  onSendBackwardZone,
  onUpdateTable,
  onDeleteTable,
  onOpenTableOrder,
  onDeselect,
}: StaffCanvasItemToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  if (!selectedItem) return null;

  // Render ZONE toolbar
  if (selectedItem.type === 'zone') {
    const { zone } = selectedItem;

    const handleStepWidth = (delta: number) => {
      const nextWidth = Math.max(15, Math.min(100, Math.round((zone.width + delta) * 10) / 10));
      onUpdateZone(zone.id, { width: nextWidth });
    };

    const handleStepHeight = (delta: number) => {
      const nextHeight = Math.max(15, Math.min(100, Math.round((zone.height + delta) * 10) / 10));
      onUpdateZone(zone.id, { height: nextHeight });
    };

    const handleSaveName = async () => {
      if (editedName.trim() && editedName !== zone.name) {
        await onUpdateZone(zone.id, { name: editedName.trim() });
      }
      setIsEditingName(false);
    };

    return (
      <div
        className="absolute z-50 animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: `${Math.min(85, Math.max(15, zone.posX + zone.width / 2))}%`,
          top: `${Math.max(4, zone.posY - 6)}%`,
          transform: 'translate(-50%, -100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-1.5 bg-[#1F1B1A]/95 text-stone-100 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-2xl border border-stone-700/70 text-xs">
          {/* Zone Badge & Name */}
          <div className="flex items-center gap-1.5 pr-1.5 border-r border-stone-700">
            <span
              className="w-3 h-3 rounded-full ring-2 ring-white/20 shrink-0"
              style={{ backgroundColor: zone.color }}
            />
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                autoFocus
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className="bg-stone-800 text-white font-bold px-1.5 py-0.5 rounded text-xs outline-none border border-[#D4A373] w-28"
              />
            ) : (
              <span
                onClick={() => {
                  setEditedName(zone.name);
                  setIsEditingName(true);
                }}
                className="font-bold tracking-wide cursor-pointer hover:text-[#D4A373] transition-colors truncate max-w-[120px]"
                title="Haz clic para editar nombre"
              >
                {zone.name}
              </span>
            )}
          </div>

          {/* Quick Width Buttons */}
          <div className="flex items-center gap-1 bg-stone-800/80 px-1.5 py-0.5 rounded-lg border border-stone-700/50">
            <span className="text-[10px] text-stone-400 font-semibold uppercase">Ancho:</span>
            <button
              type="button"
              onClick={() => handleStepWidth(-2.5)}
              className="w-5 h-5 rounded hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Reducir Ancho -2.5%"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-[11px] text-[#D4A373] px-0.5">
              {Math.round(zone.width)}%
            </span>
            <button
              type="button"
              onClick={() => handleStepWidth(2.5)}
              className="w-5 h-5 rounded hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Aumentar Ancho +2.5%"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Quick Height Buttons */}
          <div className="flex items-center gap-1 bg-stone-800/80 px-1.5 py-0.5 rounded-lg border border-stone-700/50">
            <span className="text-[10px] text-stone-400 font-semibold uppercase">Alto:</span>
            <button
              type="button"
              onClick={() => handleStepHeight(-2.5)}
              className="w-5 h-5 rounded hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Reducir Alto -2.5%"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-[11px] text-[#D4A373] px-0.5">
              {Math.round(zone.height)}%
            </span>
            <button
              type="button"
              onClick={() => handleStepHeight(2.5)}
              className="w-5 h-5 rounded hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Aumentar Alto +2.5%"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Color Selector Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1 border border-stone-700 cursor-pointer transition-colors"
              title="Cambiar color de zona"
            >
              <Palette className="w-3.5 h-3.5 text-[#D4A373]" />
              <span className="hidden sm:inline text-[11px]">Color</span>
            </button>

            {showColorPicker && (
              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 bg-[#2B2523] border border-stone-700 p-2 rounded-xl shadow-2xl flex items-center gap-1.5 z-50">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col.hex}
                    type="button"
                    onClick={() => {
                      onUpdateZone(zone.id, { color: col.hex });
                      setShowColorPicker(false);
                    }}
                    className={`w-6 h-6 rounded-full transition-transform hover:scale-115 cursor-pointer ring-2 ${
                      zone.color === col.hex ? 'ring-white scale-110' : 'ring-transparent'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Add Table inside zone */}
          <button
            type="button"
            onClick={() => onAddTableInZone(zone)}
            className="px-2 py-1 rounded-lg bg-[#9E2A2B] hover:bg-[#852223] text-white font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            title="Añadir mesa dentro de esta zona"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline text-[11px]">Añadir Mesa</span>
          </button>

          {/* Layer Ordering (Bring Forward / Send Back) */}
          {onBringForwardZone && (
            <button
              type="button"
              onClick={() => onBringForwardZone(zone.id)}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Traer capa de zona al frente"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          )}

          {onSendBackwardZone && (
            <button
              type="button"
              onClick={() => onSendBackwardZone(zone.id)}
              className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
              title="Enviar capa de zona al fondo"
            >
              <ArrowDown className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Delete Zone */}
          <button
            type="button"
            onClick={() => {
              if (confirm(`¿Eliminar la zona "${zone.name}" del plano?`)) {
                onDeleteZone(zone.id);
              }
            }}
            className="p-1 rounded-lg hover:bg-red-950/60 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Eliminar Zona"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close / Deselect */}
          <button
            type="button"
            onClick={onDeselect}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer ml-0.5"
            title="Deseleccionar (Escape)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // Render TABLE toolbar
  if (selectedItem.type === 'table') {
    const { table } = selectedItem;

    const handleStepSeats = (delta: number) => {
      const nextSeats = Math.max(1, Math.min(20, table.seats + delta));
      onUpdateTable(table.id, { seats: nextSeats });
    };

    const handleToggleShape = () => {
      const shapes: Array<'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR_STOOL'> = [
        'ROUND',
        'SQUARE',
        'RECTANGLE',
        'BAR_STOOL',
      ];
      const nextIdx = (shapes.indexOf(table.shape) + 1) % shapes.length;
      onUpdateTable(table.id, { shape: shapes[nextIdx] });
    };

    return (
      <div
        className="absolute z-50 animate-in fade-in zoom-in-95 duration-150"
        style={{
          left: `${Math.min(90, Math.max(10, table.posX))}%`,
          top: `${Math.max(4, table.posY - 8)}%`,
          transform: 'translate(-50%, -100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center gap-1.5 bg-[#1F1B1A]/95 text-stone-100 backdrop-blur-md px-3 py-1.5 rounded-2xl shadow-2xl border border-stone-700/70 text-xs">
          {/* Table Name */}
          <div className="flex items-center gap-1.5 pr-1.5 border-r border-stone-700 font-bold text-[#D4A373]">
            <span>{table.name}</span>
          </div>

          {/* Shape Toggle */}
          <button
            type="button"
            onClick={handleToggleShape}
            className="px-2 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 flex items-center gap-1.5 border border-stone-700 cursor-pointer transition-colors"
            title="Cambiar forma geométrica"
          >
            {table.shape === 'SQUARE' && <Square className="w-3 h-3 text-[#D4A373]" />}
            {table.shape === 'ROUND' && <Circle className="w-3 h-3 text-[#D4A373]" />}
            {table.shape === 'RECTANGLE' && <RectangleHorizontal className="w-3 h-3 text-[#D4A373]" />}
            {table.shape === 'BAR_STOOL' && <UtensilsCrossed className="w-3 h-3 text-[#D4A373]" />}
            <span className="text-[11px] font-semibold">{table.shape}</span>
          </button>

          {/* Seats Pax Counter */}
          <div className="flex items-center gap-1 bg-stone-800/80 px-1.5 py-0.5 rounded-lg border border-stone-700/50">
            <Users className="w-3 h-3 text-stone-400" />
            <button
              type="button"
              onClick={() => handleStepSeats(-1)}
              className="w-5 h-5 rounded hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Reducir capacidad"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="font-mono font-bold text-[11px] text-white px-0.5">
              {table.seats}p
            </span>
            <button
              type="button"
              onClick={() => handleStepSeats(1)}
              className="w-5 h-5 rounded hover:bg-stone-700 flex items-center justify-center text-stone-300 hover:text-white transition-colors cursor-pointer"
              title="Aumentar capacidad"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>

          {/* Open Order / Comanda */}
          {onOpenTableOrder && (
            <button
              type="button"
              onClick={() => onOpenTableOrder(table)}
              className="px-2.5 py-1 rounded-lg bg-[#9E2A2B] hover:bg-[#852223] text-white font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Abrir TPV Comanda de la mesa"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="text-[11px]">Comanda</span>
            </button>
          )}

          {/* Delete Table */}
          <button
            type="button"
            onClick={() => {
              if (confirm(`¿Eliminar la mesa "${table.name}" del plano?`)) {
                onDeleteTable(table);
              }
            }}
            className="p-1 rounded-lg hover:bg-red-950/60 text-stone-400 hover:text-red-400 transition-colors cursor-pointer"
            title="Eliminar Mesa"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close / Deselect */}
          <button
            type="button"
            onClick={onDeselect}
            className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white transition-colors cursor-pointer"
            title="Deseleccionar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
