'use client';

import React, { useState } from 'react';
import {
  RestaurantTableData,
  ActiveOrderData,
  saveRestaurantTableAction,
  deleteRestaurantTableAction,
} from './orderActions';
import {
  LayoutGrid,
  Edit3,
  Check,
  Plus,
  Trash2,
  Users,
  ChefHat,
  Clock,
  Sparkles,
  Beer,
  Sun,
  UtensilsCrossed,
  Move,
} from 'lucide-react';

interface StaffFloorPlanViewProps {
  tables: RestaurantTableData[];
  orders: ActiveOrderData[];
  onSelectTable: (table: RestaurantTableData) => void;
  onRefreshData: () => void;
}

export default function StaffFloorPlanView({
  tables,
  orders,
  onSelectTable,
  onRefreshData,
}: StaffFloorPlanViewProps) {
  const [isDesignMode, setIsDesignMode] = useState<boolean>(false);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState<boolean>(false);
  const [newTableData, setNewTableData] = useState<{
    tableNumber: string;
    name: string;
    zone: 'SALON' | 'BARRA' | 'TERRAZA';
    seats: number;
    shape: 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR_STOOL';
    color: string;
  }>({
    tableNumber: '',
    name: '',
    zone: 'SALON',
    seats: 4,
    shape: 'ROUND',
    color: '#9E2A2B',
  });

  // Map orders by tableNumber
  const ordersByTable = new Map<string, ActiveOrderData>();
  orders.forEach((o) => {
    ordersByTable.set(o.tableNumber, o);
  });

  // Handle drag on canvas
  const handleCanvasClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDesignMode || !draggingTableId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    const targetTable = tables.find((t) => t.id === draggingTableId);
    if (targetTable) {
      await saveRestaurantTableAction({
        id: targetTable.id,
        tableNumber: targetTable.tableNumber,
        name: targetTable.name,
        zone: targetTable.zone,
        seats: targetTable.seats,
        shape: targetTable.shape,
        color: targetTable.color || undefined,
        posX: Math.round(x),
        posY: Math.round(y),
      });
      setDraggingTableId(null);
      onRefreshData();
    }
  };

  // Add new table
  const handleCreateNewTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableData.tableNumber.trim()) return;

    await saveRestaurantTableAction({
      tableNumber: newTableData.tableNumber.trim(),
      name: newTableData.name.trim() || newTableData.tableNumber.trim(),
      zone: newTableData.zone,
      seats: newTableData.seats,
      shape: newTableData.shape,
      color: newTableData.color,
      posX: newTableData.zone === 'BARRA' ? 25 : newTableData.zone === 'TERRAZA' ? 75 : 35,
      posY: 50,
    });

    setIsNewTableModalOpen(false);
    setNewTableData({
      tableNumber: '',
      name: '',
      zone: 'SALON',
      seats: 4,
      shape: 'ROUND',
      color: '#9E2A2B',
    });
    onRefreshData();
  };

  // Delete table
  const handleDeleteTable = async (id: string, name: string) => {
    if (confirm(`¿Eliminar la mesa "${name}" del plano?`)) {
      await deleteRestaurantTableAction(id);
      onRefreshData();
    }
  };

  // Summary counts
  const totalTables = tables.length;
  const occupiedTables = tables.filter((t) => ordersByTable.has(t.tableNumber)).length;
  const freeTables = totalTables - occupiedTables;
  const totalPaxInService = orders.reduce((acc, o) => acc + (o.pax || 2), 0);
  const totalRevenueInService = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  return (
    <div className="space-y-4">
      {/* Floor Plan Control Banner */}
      <div className="bg-white p-4 rounded-3xl border border-[#EADBC8] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Metrics Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{freeTables} Libres</span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 text-xs font-bold text-[#9E2A2B]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#9E2A2B] animate-pulse" />
            <span>{occupiedTables} Ocupadas</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-stone-100 text-xs font-semibold text-stone-700">
            <Users className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>{totalPaxInService} personas en sala</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-amber-50 text-xs font-bold text-amber-900 border border-amber-200">
            <span>Servicio en curso:</span>
            <span className="text-[#9E2A2B]">{totalRevenueInService.toFixed(2)}€</span>
          </div>
        </div>

        {/* Mode & Actions */}
        <div className="flex items-center gap-2">
          {isDesignMode && (
            <button
              onClick={() => setIsNewTableModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#EADBC8] hover:bg-stone-50 text-[#2B2523] text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#9E2A2B]" />
              <span>Añadir Mesa</span>
            </button>
          )}

          <button
            onClick={() => {
              setIsDesignMode(!isDesignMode);
              setDraggingTableId(null);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isDesignMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-[#2B2523] border border-[#EADBC8]'
            }`}
          >
            {isDesignMode ? (
              <>
                <Check className="w-4 h-4" />
                <span>Finalizar Edición</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4 text-[#9E2A2B]" />
                <span>Modo Diseño / Mover</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isDesignMode && (
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center gap-2 animate-in fade-in">
          <Move className="w-4 h-4 text-[#9E2A2B] shrink-0" />
          <span>
            <strong>Modo Diseño Activo:</strong> Haz clic en el botón de mover (<Move className="w-3 h-3 inline text-[#9E2A2B]" />) de cualquier mesa y luego haz clic en la nueva posición del plano donde quieras colocarla.
          </span>
        </div>
      )}

      {/* 2D Interactive Floor Canvas */}
      <div
        onClick={handleCanvasClick}
        className="relative w-full h-[620px] lg:h-[700px] bg-[#FAF8F5] rounded-3xl border-2 border-[#EADBC8] overflow-hidden select-none shadow-inner"
        style={{
          backgroundImage: 'radial-gradient(#D4A373 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px',
        }}
      >
        {/* Zone Markers / Architecture Guides */}
        {/* Zone: BARRA (Top-Left) */}
        <div className="absolute top-4 left-4 w-[48%] h-[38%] rounded-2xl border-2 border-dashed border-[#D4A373]/50 bg-amber-100/10 p-3 pointer-events-none flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-[#D4A373]">
            <Beer className="w-4 h-4" />
            <span>Zona 1: Barra de Tapeo & Bebidas</span>
          </div>
          <span className="text-[10px] text-stone-400">Mostrador & Taburetes</span>
        </div>

        {/* Zone: SALÓN COMEDOR (Bottom-Left) */}
        <div className="absolute bottom-4 left-4 w-[48%] h-[52%] rounded-2xl border-2 border-dashed border-[#9E2A2B]/30 bg-rose-50/10 p-3 pointer-events-none flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-[#9E2A2B]">
            <UtensilsCrossed className="w-4 h-4" />
            <span>Zona 2: Salón Comedor Interior</span>
          </div>
          <span className="text-[10px] text-stone-400">Mesas Bajas & Comedor</span>
        </div>

        {/* Zone: TERRAZA (Right Column) */}
        <div className="absolute top-4 right-4 w-[46%] h-[94%] rounded-2xl border-2 border-dashed border-[#2A9D8F]/40 bg-emerald-50/15 p-3 pointer-events-none flex flex-col justify-between">
          <div className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider text-[#2A9D8F]">
            <Sun className="w-4 h-4" />
            <span>Zona 3: Terraza & Veladores (Exterior)</span>
          </div>
          <span className="text-[10px] text-stone-400">Exterior Climatizado Camas</span>
        </div>

        {/* Render Tables in 2D */}
        {tables.map((table) => {
          const order = ordersByTable.get(table.tableNumber);
          const isOccupied = !!order;
          const isPending = order?.status === 'PENDING';
          const isPreparing = order?.status === 'PREPARING';
          const isServed = order?.status === 'SERVED';
          const isBeingMoved = draggingTableId === table.id;

          // Shape styles
          let shapeClasses = 'rounded-full w-20 h-20 sm:w-22 sm:h-22';
          if (table.shape === 'SQUARE') {
            shapeClasses = 'rounded-2xl w-20 h-20 sm:w-22 sm:h-22';
          } else if (table.shape === 'RECTANGLE') {
            shapeClasses = 'rounded-2xl w-28 h-18 sm:w-32 sm:h-20';
          } else if (table.shape === 'BAR_STOOL') {
            shapeClasses = 'rounded-full w-14 h-14 sm:w-16 sm:h-16';
          }

          // State colors
          let statusBorder = 'border-stone-300 bg-white hover:border-[#D4A373]';
          let statusBadge = 'Libre';
          let badgeColor = 'bg-stone-100 text-stone-500';

          if (isPending) {
            statusBorder = 'border-amber-400 bg-amber-50/90 ring-4 ring-amber-200/60 shadow-lg animate-pulse';
            statusBadge = 'Pidiendo';
            badgeColor = 'bg-amber-100 text-amber-900 border-amber-300';
          } else if (isPreparing) {
            statusBorder = 'border-blue-400 bg-blue-50/90 ring-4 ring-blue-200/60 shadow-lg';
            statusBadge = 'En Cocina';
            badgeColor = 'bg-blue-100 text-blue-900 border-blue-300';
          } else if (isServed) {
            statusBorder = 'border-emerald-500 bg-emerald-50/90 ring-4 ring-emerald-200/60 shadow-md';
            statusBadge = 'Servido';
            badgeColor = 'bg-emerald-100 text-emerald-900 border-emerald-300';
          }

          return (
            <div
              key={table.id}
              style={{
                left: `${table.posX}%`,
                top: `${table.posY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className={`absolute transition-all ${
                isBeingMoved ? 'ring-4 ring-[#9E2A2B] z-30 scale-110' : 'z-20'
              }`}
            >
              <div
                onClick={() => {
                  if (!isDesignMode) {
                    onSelectTable(table);
                  }
                }}
                className={`relative border-2 flex flex-col items-center justify-center p-1.5 shadow-md cursor-pointer transition-transform hover:scale-105 ${shapeClasses} ${statusBorder}`}
              >
                {/* Table Name */}
                <span className="font-serif font-bold text-xs sm:text-sm text-[#2B2523] truncate max-w-[90%] text-center leading-none">
                  {table.name}
                </span>

                {/* Seats / Pax */}
                <span className="text-[10px] text-[#6E6259] flex items-center gap-0.5 mt-0.5">
                  <Users className="w-2.5 h-2.5" />
                  <span>{order?.pax || table.seats}p</span>
                </span>

                {/* Price tag or Status */}
                {isOccupied ? (
                  <span className="text-[10.5px] font-bold text-[#9E2A2B] mt-0.5">
                    {order.totalAmount.toFixed(2)}€
                  </span>
                ) : (
                  <span className={`text-[8.5px] px-1.5 py-0.2 rounded-full font-semibold border mt-0.5 ${badgeColor}`}>
                    {statusBadge}
                  </span>
                )}

                {/* Design Mode Table Actions */}
                {isDesignMode && (
                  <div
                    className="absolute -top-3 -right-3 flex items-center gap-1 z-30"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => setDraggingTableId(isBeingMoved ? null : table.id)}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-white shadow-xs cursor-pointer ${
                        isBeingMoved ? 'bg-[#9E2A2B] ring-2 ring-white' : 'bg-stone-700 hover:bg-stone-800'
                      }`}
                      title="Mover mesa"
                    >
                      <Move className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteTable(table.id, table.name)}
                      className="w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs cursor-pointer"
                      title="Eliminar mesa"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Table Modal */}
      {isNewTableModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsNewTableModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-[#EADBC8] shadow-2xl p-6 space-y-4 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EADBC8] pb-3">
              <h3 className="font-serif font-bold text-base text-[#2B2523]">
                Añadir Nueva Mesa al Plano
              </h3>
              <button
                onClick={() => setIsNewTableModalOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewTable} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Nombre o Número de Mesa:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Mesa 6, Barra 5, Terraza 7..."
                  value={newTableData.tableNumber}
                  onChange={(e) =>
                    setNewTableData({
                      ...newTableData,
                      tableNumber: e.target.value,
                      name: e.target.value,
                    })
                  }
                  className="w-full p-2.5 rounded-xl border border-[#EADBC8] text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Zona:</label>
                  <select
                    value={newTableData.zone}
                    onChange={(e) =>
                      setNewTableData({
                        ...newTableData,
                        zone: e.target.value as any,
                      })
                    }
                    className="w-full p-2 rounded-xl border border-[#EADBC8]"
                  >
                    <option value="SALON">Salón Comedor</option>
                    <option value="BARRA">Barra Tapeo</option>
                    <option value="TERRAZA">Terraza Veladores</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    Comensales (Pax):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={newTableData.seats}
                    onChange={(e) =>
                      setNewTableData({
                        ...newTableData,
                        seats: parseInt(e.target.value) || 2,
                      })
                    }
                    className="w-full p-2 rounded-xl border border-[#EADBC8]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Forma 2D:</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['ROUND', 'SQUARE', 'RECTANGLE', 'BAR_STOOL'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewTableData({ ...newTableData, shape: s })}
                      className={`p-2 rounded-xl border text-[11px] font-semibold text-center ${
                        newTableData.shape === s
                          ? 'border-[#9E2A2B] bg-[#9E2A2B] text-white'
                          : 'border-stone-200 bg-stone-50'
                      }`}
                    >
                      {s === 'ROUND'
                        ? 'Redonda'
                        : s === 'SQUARE'
                        ? 'Cuadrada'
                        : s === 'RECTANGLE'
                        ? 'Rectang.'
                        : 'Taburete'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EADBC8] text-stone-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#9E2A2B] text-white font-bold"
                >
                  Crear Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
