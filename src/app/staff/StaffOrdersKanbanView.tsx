'use client';

import React from 'react';
import {
  ActiveOrderData,
  RestaurantTableData,
  advanceOrderStatusAction,
  closeAndPayTableOrderAction,
} from './orderActions';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  CreditCard,
  Users,
  UtensilsCrossed,
  ArrowRight,
  PlusCircle,
  FileText,
} from 'lucide-react';

interface StaffOrdersKanbanViewProps {
  orders: ActiveOrderData[];
  tables: RestaurantTableData[];
  onOpenPda: (table: RestaurantTableData) => void;
  onRefreshData: () => void;
}

export default function StaffOrdersKanbanView({
  orders,
  tables,
  onOpenPda,
  onRefreshData,
}: StaffOrdersKanbanViewProps) {
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const servedOrders = orders.filter((o) => o.status === 'SERVED');

  const handleAdvance = async (orderId: string, nextStatus: 'PREPARING' | 'SERVED' | 'PAID') => {
    if (nextStatus === 'PAID') {
      await closeAndPayTableOrderAction(orderId);
    } else {
      await advanceOrderStatusAction(orderId, nextStatus);
    }
    onRefreshData();
  };

  const getTableForOrder = (tableNumber: string): RestaurantTableData => {
    const found = tables.find((t) => t.tableNumber === tableNumber);
    if (found) return found;
    return {
      id: `virtual-${tableNumber}`,
      tableNumber,
      name: tableNumber,
      zone: 'SALON',
      seats: 4,
      posX: 50,
      posY: 50,
      shape: 'ROUND',
      color: null,
      isActive: true,
    };
  };

  const renderOrderCard = (order: ActiveOrderData) => {
    const table = getTableForOrder(order.tableNumber);

    return (
      <div
        key={order.id}
        className="p-4 rounded-2xl bg-white border border-[#EADBC8] shadow-xs space-y-3 hover:shadow-md transition-all flex flex-col justify-between"
      >
        <div className="space-y-2.5">
          {/* Card Top: Table & Time */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-[#2B2523]">
                {order.tableNumber}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-semibold">
                {order.orderNumber}
              </span>
            </div>
            <span className="text-[11px] text-[#6E6259] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{order.createdAt}</span>
            </span>
          </div>

          {/* Pax & Zone */}
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>{order.pax} comensales</span>
            </span>
            <span>•</span>
            <span className="capitalize">{table.zone.toLowerCase()}</span>
          </div>

          {/* Items Preview */}
          <div className="border-t border-b border-stone-100 py-2.5 space-y-1.5 text-xs">
            {order.items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <span className="font-medium text-[#2B2523] leading-snug">
                  <strong className="text-[#9E2A2B] mr-1">{it.quantity}x</strong>
                  {it.productName}
                  {it.notes && (
                    <span className="block text-[10.5px] text-amber-800 italic ml-4">
                      ↳ Nota: {it.notes}
                    </span>
                  )}
                </span>
                <span className="text-stone-500 font-medium shrink-0 ml-2">
                  {(it.unitPrice * it.quantity).toFixed(2)}€
                </span>
              </div>
            ))}
          </div>

          {/* General Notes */}
          {order.notes && (
            <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/60 text-[11px] text-amber-900">
              <strong className="block text-[10px] uppercase font-bold text-amber-700">
                Observación General:
              </strong>
              {order.notes}
            </div>
          )}

          {/* Card Total */}
          <div className="flex items-center justify-between text-xs font-bold pt-1">
            <span className="text-stone-600">Total Comanda:</span>
            <span className="text-base text-[#9E2A2B]">
              {order.totalAmount.toFixed(2)}€
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-stone-100 flex items-center gap-2">
          {order.status === 'PENDING' && (
            <button
              onClick={() => handleAdvance(order.id, 'PREPARING')}
              className="flex-1 py-2 px-3 rounded-xl bg-[#2B2523] hover:bg-[#9E2A2B] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <span>A Cocina</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {order.status === 'PREPARING' && (
            <button
              onClick={() => handleAdvance(order.id, 'SERVED')}
              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Marcar Servido</span>
            </button>
          )}

          {order.status === 'SERVED' && (
            <button
              onClick={() => handleAdvance(order.id, 'PAID')}
              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Cobrar y Liberar</span>
            </button>
          )}

          {/* PDA trigger */}
          <button
            onClick={() => onOpenPda(table)}
            className="p-2 rounded-xl border border-[#EADBC8] hover:bg-stone-50 text-stone-600 transition-colors cursor-pointer"
            title="Abrir comanda en PDA"
          >
            <PlusCircle className="w-4 h-4 text-[#9E2A2B]" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      {/* Column 1: PENDING */}
      <div className="bg-[#FAF8F5] rounded-3xl p-4 border border-amber-200/80 flex flex-col space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500 animate-pulse" />
            <h4 className="font-serif font-bold text-sm text-amber-950">
              1. Nuevas Comandas (Cocina)
            </h4>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 text-amber-900">
            {pendingOrders.length}
          </span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] custom-scrollbar pr-1">
          {pendingOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No hay comandas pendientes de marchar.
            </div>
          ) : (
            pendingOrders.map(renderOrderCard)
          )}
        </div>
      </div>

      {/* Column 2: PREPARING */}
      <div className="bg-[#FAF8F5] rounded-3xl p-4 border border-blue-200/80 flex flex-col space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-blue-200">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-blue-600" />
            <h4 className="font-serif font-bold text-sm text-blue-950">
              2. En Preparación
            </h4>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-200 text-blue-900">
            {preparingOrders.length}
          </span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] custom-scrollbar pr-1">
          {preparingOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No hay platos en los fogones actualmente.
            </div>
          ) : (
            preparingOrders.map(renderOrderCard)
          )}
        </div>
      </div>

      {/* Column 3: SERVED */}
      <div className="bg-[#FAF8F5] rounded-3xl p-4 border border-emerald-200/80 flex flex-col space-y-3 shadow-2xs">
        <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h4 className="font-serif font-bold text-sm text-emerald-950">
              3. Servidas en Mesa
            </h4>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900">
            {servedOrders.length}
          </span>
        </div>

        <div className="space-y-3 flex-1 overflow-y-auto max-h-[650px] custom-scrollbar pr-1">
          {servedOrders.length === 0 ? (
            <div className="py-12 text-center text-stone-400 text-xs">
              No hay mesas con comida servida pendiente de cobro.
            </div>
          ) : (
            servedOrders.map(renderOrderCard)
          )}
        </div>
      </div>
    </div>
  );
}
