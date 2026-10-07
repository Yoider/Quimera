'use client';

import React, { useState } from 'react';
import {
  RestaurantTableData,
  ActiveOrderData,
} from './orderActions';
import {
  X,
  ArrowRightLeft,
  Users,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

interface StaffTransferTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceTable: RestaurantTableData | null;
  sourceOrder?: ActiveOrderData;
  allTables: RestaurantTableData[];
  orders: ActiveOrderData[];
  onConfirmTransfer: (fromTableNumber: string, toTableNumber: string) => Promise<void>;
}

export default function StaffTransferTableModal({
  isOpen,
  onClose,
  sourceTable,
  sourceOrder,
  allTables,
  orders,
  onConfirmTransfer,
}: StaffTransferTableModalProps) {
  const [selectedDestTableNumber, setSelectedDestTableNumber] = useState<string | null>(null);
  const [selectedZoneFilter, setSelectedZoneFilter] = useState<string>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !sourceTable) return null;

  // Map active orders by tableNumber
  const occupiedSet = new Set(orders.map((o) => o.tableNumber));

  // Available destination tables (excluding source table)
  const candidateTables = allTables.filter((t) => t.tableNumber !== sourceTable.tableNumber);

  const filteredCandidates =
    selectedZoneFilter === 'ALL'
      ? candidateTables
      : candidateTables.filter((t) => t.zone === selectedZoneFilter);

  const selectedDestTable = allTables.find((t) => t.tableNumber === selectedDestTableNumber);
  const isDestOccupied = selectedDestTableNumber ? occupiedSet.has(selectedDestTableNumber) : false;

  const handleExecuteTransfer = async () => {
    if (!selectedDestTableNumber) return;
    setIsSubmitting(true);
    try {
      await onConfirmTransfer(sourceTable.tableNumber, selectedDestTableNumber);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#FAF8F5] rounded-3xl border border-[#EADBC8] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#2B2523] px-5 py-4 text-white flex items-center justify-between border-b border-[#3D3532]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#9E2A2B] text-white flex items-center justify-center shadow-md">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base tracking-wide">
                Mover a Otra Mesa
              </h3>
              <p className="text-xs text-stone-300">
                Traspaso íntegro de la comanda y comensales de {sourceTable.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Transfer Summary Card */}
          <div className="bg-white rounded-2xl p-4 border border-[#EADBC8] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Origin Table */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-12 h-12 rounded-xl bg-[#9E2A2B]/10 border border-[#9E2A2B]/30 flex flex-col items-center justify-center shrink-0">
                <span className="font-serif font-bold text-xs text-[#9E2A2B]">Origen</span>
                <span className="font-serif font-extrabold text-sm text-[#2B2523]">{sourceTable.name}</span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#2B2523]">{sourceTable.zone}</div>
                <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                  <span>{sourceOrder?.pax || sourceTable.seats} comensales</span>
                  <span>·</span>
                  <span className="font-bold text-[#9E2A2B]">
                    {sourceOrder ? `${sourceOrder.totalAmount.toFixed(2)}€` : '0.00€'}
                  </span>
                </div>
              </div>
            </div>

            <ArrowRight className="w-5 h-5 text-stone-400 shrink-0 hidden sm:block" />

            {/* Destination Table Preview */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div
                className={`w-12 h-12 rounded-xl border flex flex-col items-center justify-center shrink-0 ${
                  selectedDestTable
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-stone-100 border-dashed border-stone-300 text-stone-400'
                }`}
              >
                <span className="font-serif font-bold text-[10px]">Destino</span>
                <span className="font-serif font-extrabold text-xs">
                  {selectedDestTable ? selectedDestTable.name : '?'}
                </span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#2B2523]">
                  {selectedDestTable ? selectedDestTable.zone : 'Selecciona mesa abajo'}
                </div>
                <div className="text-[11px] text-stone-500">
                  {selectedDestTable
                    ? `${selectedDestTable.seats} plazas disponibles`
                    : 'Haz clic en una mesa libre'}
                </div>
              </div>
            </div>
          </div>

          {/* Warning if destination is occupied */}
          {isDestOccupied && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-200 flex items-center gap-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Atención:</strong> La mesa destino ya tiene una comanda activa. Los pedidos se fusionarán en la misma cuenta.
              </span>
            </div>
          )}

          {/* Zone Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {[
              { id: 'ALL', label: 'Todas las Zonas' },
              { id: 'SALON', label: 'Salón' },
              { id: 'BARRA', label: 'Barra' },
              { id: 'TERRAZA', label: 'Terraza' },
            ].map((z) => (
              <button
                key={z.id}
                type="button"
                onClick={() => setSelectedZoneFilter(z.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedZoneFilter === z.id
                    ? 'bg-[#9E2A2B] text-white shadow-2xs'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>

          {/* Destination Tables Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
            {filteredCandidates.map((tbl) => {
              const occupied = occupiedSet.has(tbl.tableNumber);
              const isSelected = selectedDestTableNumber === tbl.tableNumber;

              return (
                <button
                  key={tbl.id}
                  type="button"
                  onClick={() => setSelectedDestTableNumber(tbl.tableNumber)}
                  className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#9E2A2B] ring-2 ring-[#9E2A2B] bg-[#9E2A2B]/5 shadow-sm'
                      : occupied
                      ? 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
                      : 'border-stone-200 bg-white hover:border-[#D4A373] hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-xs text-[#2B2523] truncate">
                      {tbl.name}
                    </span>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#9E2A2B] text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-2 text-[10.5px]">
                    <span className="text-stone-500 flex items-center gap-0.5">
                      <Users className="w-2.5 h-2.5" />
                      <span>{tbl.seats}p</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full font-semibold text-[9.5px] ${
                        occupied
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {occupied ? 'Ocupada' : 'Libre'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-stone-50 border-t border-[#EADBC8] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!selectedDestTableNumber || isSubmitting}
            onClick={handleExecuteTransfer}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer ${
              selectedDestTableNumber && !isSubmitting
                ? 'bg-[#9E2A2B] hover:bg-[#852223] text-white'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>
              {isSubmitting
                ? 'Traspasando...'
                : selectedDestTableNumber
                ? `Mover a ${selectedDestTableNumber}`
                : 'Selecciona mesa destino'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
