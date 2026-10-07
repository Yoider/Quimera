'use client';

import React from 'react';
import {
  RestaurantTableData,
  ActiveOrderData,
} from './orderActions';
import {
  X,
  ShoppingBag,
  ArrowRightLeft,
  Edit3,
  CreditCard,
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

interface StaffTableActionPopoverProps {
  table: RestaurantTableData;
  order?: ActiveOrderData;
  onClose: () => void;
  onOpenService: (table: RestaurantTableData) => void;
  onTakeOrder: (table: RestaurantTableData) => void;
  onTransferTable: (table: RestaurantTableData) => void;
  onEditTable: (table: RestaurantTableData) => void;
  onPayOrder?: (orderId: string) => void;
}

export default function StaffTableActionPopover({
  table,
  order,
  onClose,
  onOpenService,
  onTakeOrder,
  onTransferTable,
  onEditTable,
  onPayOrder,
}: StaffTableActionPopoverProps) {
  const isOccupied = !!order;
  const isPending = order?.status === 'PENDING';
  const isPreparing = order?.status === 'PREPARING';
  const isServed = order?.status === 'SERVED';

  // Compute position clamped so it stays inside canvas bounds
  const leftPercent = Math.min(84, Math.max(16, table.posX));
  const isNearTop = table.posY < 25;
  const topPercent = isNearTop ? table.posY + 8 : table.posY - 6;
  const transform = isNearTop ? 'translate(-50%, 0%)' : 'translate(-50%, -100%)';

  return (
    <div
      className="absolute z-50 animate-in fade-in zoom-in-95 duration-150 select-none"
      style={{
        left: `${leftPercent}%`,
        top: `${topPercent}%`,
        transform,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-68 bg-[#1F1B1A]/95 text-stone-100 backdrop-blur-md rounded-2xl shadow-2xl border border-stone-700/80 p-3 flex flex-col gap-2.5">
        {/* Header: Table Info & Status */}
        <div className="flex items-start justify-between border-b border-stone-700/60 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-serif font-bold text-sm text-white tracking-wide">
                {table.name}
              </h4>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-stone-800 text-stone-300 font-semibold border border-stone-700">
                {table.zone}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-400">
              <span className="flex items-center gap-0.5">
                <Users className="w-3 h-3 text-[#D4A373]" />
                <span>{order?.pax || table.seats} pax</span>
              </span>
              <span>·</span>
              {isOccupied ? (
                <span className="text-[#D4A373] font-bold">
                  {order.totalAmount.toFixed(2)}€
                </span>
              ) : (
                <span className="text-emerald-400 font-semibold">Libre</span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Cerrar (Esc)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Status Indicator Pill if Occupied */}
        {isOccupied && (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-stone-800/80 border border-stone-700/60 text-xs">
            <div className="flex items-center gap-1.5">
              {isPending && <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
              {isPreparing && <Clock className="w-3.5 h-3.5 text-blue-400" />}
              {isServed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="font-semibold text-stone-200">
                {isPending ? 'Pidiendo comanda' : isPreparing ? 'En preparación' : 'Servido en mesa'}
              </span>
            </div>
            <span className="font-mono text-[11px] text-stone-400">{order.items.length} platos</span>
          </div>
        )}

        {/* Action Buttons List */}
        <div className="flex flex-col gap-1.5">
          {/* 1. Comandar (Main Action) */}
          <button
            type="button"
            onClick={() => onTakeOrder(table)}
            className="w-full px-3 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#852223] text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-md"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#D4A373]" />
              <span>{isOccupied ? 'Añadir a Comanda' : 'Comandar'}</span>
            </div>
            <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-black/25 text-stone-200">
              Menú derecho →
            </span>
          </button>

          {/* 2. Abrir Mesa (si está libre para sentar clientes) */}
          {!isOccupied && (
            <button
              type="button"
              onClick={() => onOpenService(table)}
              className="w-full px-3 py-2 rounded-xl bg-emerald-800/80 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-2 transition-all cursor-pointer border border-emerald-600/40"
            >
              <Users className="w-3.5 h-3.5 text-emerald-300" />
              <span>Abrir Mesa (Sentar {table.seats}p)</span>
            </button>
          )}

          {/* 3. Mover a otra mesa (Traspaso de clientes y comanda) */}
          {isOccupied && (
            <button
              type="button"
              onClick={() => onTransferTable(table)}
              className="w-full px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white font-semibold text-xs flex items-center justify-between transition-all cursor-pointer border border-stone-700"
              title="Cambiar a los clientes y su cuenta a otra mesa libre"
            >
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>Mover a otra mesa</span>
              </div>
              <span className="text-[10px] text-stone-400">Traspasar</span>
            </button>
          )}

          {/* 4. Cobrar Cuenta (si está ocupada) */}
          {isOccupied && onPayOrder && (
            <button
              type="button"
              onClick={() => onPayOrder(order.id)}
              className="w-full px-3 py-2 rounded-xl bg-amber-900/40 hover:bg-amber-800/60 text-amber-200 hover:text-amber-100 font-semibold text-xs flex items-center justify-between transition-all cursor-pointer border border-amber-700/50"
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Cobrar Cuenta</span>
              </div>
              <span className="font-bold">{order.totalAmount.toFixed(2)}€</span>
            </button>
          )}

          {/* 5. Editar Mesa (Abre inspector de propiedades) */}
          <button
            type="button"
            onClick={() => onEditTable(table)}
            className="w-full px-3 py-1.5 rounded-xl bg-stone-900/60 hover:bg-stone-800 text-stone-300 hover:text-white font-medium text-xs flex items-center gap-2 transition-all cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5 text-stone-400" />
            <span>Editar datos de mesa</span>
          </button>
        </div>
      </div>
    </div>
  );
}
