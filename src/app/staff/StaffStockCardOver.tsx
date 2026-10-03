'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Package,
  Truck,
  Trash2,
  Calendar,
  MessageCircle,
  Phone,
  Euro,
  Scale,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Plus,
  Minus,
  ExternalLink,
  ShieldCheck,
  Flame,
  Award,
  History,
} from 'lucide-react';
import { SupplyItemData, SupplierData, LocalEventData, FoodWasteData } from './stockActions';

interface StaffStockCardOverProps {
  item: SupplyItemData | null;
  isOpen: boolean;
  onClose: () => void;
  onAdjustQuantity: (item: SupplyItemData, delta: number) => void;
  onLogQuickWaste: (wasteData: {
    supplyItemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    reason: string;
    notes?: string;
  }) => Promise<boolean>;
  events: LocalEventData[];
  suppliers: SupplierData[];
}

const WASTE_REASONS: Record<string, string> = {
  EXPIRED: 'Fecha de caducidad superada',
  SPOILED: 'Deterioro de producto fresco (fruta/verdura)',
  COOKING_ERROR: 'Error de cocina o plato quemado',
  LEFTOVER: 'Sobrante no recuperable de fin de servicio',
  OTHER: 'Otra incidencia / Rotura de envase',
};

export default function StaffStockCardOver({
  item,
  isOpen,
  onClose,
  onAdjustQuantity,
  onLogQuickWaste,
  events,
  suppliers,
}: StaffStockCardOverProps) {
  const [activeTab, setActiveTab] = useState<'supplier' | 'waste' | 'movements' | 'events'>('supplier');
  const [isSubmittingWaste, setIsSubmittingWaste] = useState(false);

  // Quick waste form states
  const [wasteQty, setWasteQty] = useState('1');
  const [wasteReason, setWasteReason] = useState('SPOILED');
  const [wasteNotes, setWasteNotes] = useState('');
  const [wasteSuccessMsg, setWasteSuccessMsg] = useState<string | null>(null);

  // Close on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  // Health color palette
  const getHealthColors = (status: SupplyItemData['healthStatus']) => {
    switch (status) {
      case 'HEALTHY':
        return {
          bar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          text: 'text-emerald-700',
          label: 'Salud Óptima',
          icon: ShieldCheck,
        };
      case 'WARNING':
        return {
          bar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
          badge: 'bg-amber-50 text-amber-800 border-amber-300',
          text: 'text-amber-700',
          label: 'Alerta de Stock',
          icon: AlertTriangle,
        };
      case 'CRITICAL':
        return {
          bar: 'bg-gradient-to-r from-rose-600 to-red-500',
          badge: 'bg-rose-50 text-rose-800 border-rose-300 animate-pulse',
          text: 'text-rose-700',
          label: 'Peligro de Rotura',
          icon: AlertTriangle,
        };
      case 'EMPTY':
      default:
        return {
          bar: 'bg-stone-500',
          badge: 'bg-stone-100 text-stone-800 border-stone-300',
          text: 'text-stone-700',
          label: '¡Agotado!',
          icon: AlertTriangle,
        };
    }
  };

  const health = getHealthColors(item.healthStatus);
  const HealthIcon = health.icon;

  // Target replenish quantity to reach 100% HP
  const targetStock = item.minStock * 2;
  const suggestedOrderQty = Math.max(0, Number((targetStock - item.currentStock).toFixed(1)));
  const estimatedOrderCost = Number((suggestedOrderQty * item.currentPrice).toFixed(2));

  // WhatsApp order link
  const buildWhatsAppLink = () => {
    const phone = item.primarySupplierPhone?.replace(/\D/g, '') || '';
    if (!phone) return '#';
    const cleanPhone = phone.startsWith('34') ? phone : `34${phone}`;
    const text = encodeURIComponent(
      `Hola ${item.primarySupplierName || 'proveedor'}, te escribimos desde Taberna Quimera (Camas, Sevilla).\n\nNos gustaría hacer un pedido para reponer existencias:\n- Producto: ${item.name}\n- Cantidad sugerida: ${suggestedOrderQty} ${item.unit}\n\n¿Podríais confirmarnos disponibilidad y día de reparto? Muchas gracias.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const handleQuickWasteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = parseFloat(wasteQty);
    if (isNaN(qty) || qty <= 0) {
      alert('Por favor introduce una cantidad válida.');
      return;
    }

    setIsSubmittingWaste(true);
    const estimatedCost = Number((qty * item.currentPrice).toFixed(2));

    const ok = await onLogQuickWaste({
      supplyItemId: item.id,
      itemName: item.name,
      quantity: qty,
      unit: item.unit,
      estimatedCost,
      reason: wasteReason,
      notes: wasteNotes,
    });

    setIsSubmittingWaste(false);
    if (ok) {
      setWasteSuccessMsg(`¡Merma registrada! −${qty} ${item.unit} (−${estimatedCost}€)`);
      setWasteQty('1');
      setWasteNotes('');
      setTimeout(() => setWasteSuccessMsg(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Container (Right side on desktop, bottom sheet on mobile) */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <aside className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-[#EADBC8] max-sm:rounded-t-3xl overflow-hidden animate-in slide-in-from-right sm:slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-4 sm:p-6 bg-[#2B2523] text-white border-b border-stone-800 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-xl text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Cerrar ficha"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold tracking-wider uppercase bg-[#9E2A2B] text-amber-100 border border-[#D4A373]/30">
                {item.category}
              </span>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${health.badge}`}>
                <HealthIcon className="w-3 h-3" />
                {health.label} ({item.healthScore}% HP)
              </span>
            </div>

            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white tracking-wide">
              {item.name}
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Proveedor Principal: <span className="text-[#D4A373] font-semibold">{item.primarySupplierName || 'Sin asignar'}</span>
            </p>

            {/* Quick Health & Stock Indicator */}
            <div className="mt-4 p-3 rounded-2xl bg-stone-900/90 border border-stone-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-300 font-medium">Barra de Salud del Insumo</span>
                <span className={`font-bold ${health.text}`}>{item.healthScore}% HP</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-stone-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${health.bar}`}
                  style={{ width: `${Math.min(100, Math.max(5, item.healthScore))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1">
                <span>
                  Existencias: <strong className="text-white text-xs">{item.currentStock} {item.unit}</strong> (Mín: {item.minStock} {item.unit})
                </span>
                <span>
                  Coste Unitario: <strong className="text-amber-300">{item.currentPrice.toFixed(2)} €/{item.unit}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Subtabs Navigation */}
          <div className="flex items-center justify-around border-b border-[#EADBC8] bg-[#FAF8F5] px-2 py-1.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('supplier')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'supplier'
                  ? 'bg-[#9E2A2B] text-white shadow-xs'
                  : 'text-[#6E6259] hover:text-[#2B2523] hover:bg-stone-200/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Proveedor & Pedido</span>
            </button>

            <button
              onClick={() => setActiveTab('waste')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'waste'
                  ? 'bg-[#9E2A2B] text-white shadow-xs'
                  : 'text-[#6E6259] hover:text-[#2B2523] hover:bg-stone-200/60'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Mermas & Registro</span>
              {item.wasteCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-900 text-rose-100">
                  {item.wasteCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('movements')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'movements'
                  ? 'bg-[#9E2A2B] text-white shadow-xs'
                  : 'text-[#6E6259] hover:text-[#2B2523] hover:bg-stone-200/60'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Movimientos</span>
            </button>

            <button
              onClick={() => setActiveTab('events')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'events'
                  ? 'bg-[#9E2A2B] text-white shadow-xs'
                  : 'text-[#6E6259] hover:text-[#2B2523] hover:bg-stone-200/60'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Eventos Camas</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white">
            
            {/* TAB 1: PROVEEDOR & PEDIDO */}
            {activeTab === 'supplier' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Supplier Profile Card */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EADBC8] space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E2A2B]">
                        Proveedor Oficial
                      </span>
                      <h3 className="font-serif font-bold text-lg text-[#2B2523]">
                        {item.primarySupplierName || 'Sin proveedor asignado'}
                      </h3>
                      {item.primarySupplierPhone && (
                        <p className="text-xs text-stone-600 flex items-center gap-1 mt-1">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          <span>{item.primarySupplierPhone}</span>
                        </p>
                      )}
                    </div>

                    {item.primarySupplierPhone && (
                      <a
                        href={`tel:${item.primarySupplierPhone}`}
                        className="px-3 py-1.5 rounded-xl bg-stone-800 text-stone-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        <span>Llamar</span>
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-[#EADBC8]/70 text-xs text-stone-600">
                    <div>
                      <span className="text-stone-400 text-[11px] block">Días habituales de pedido:</span>
                      <strong className="text-stone-800">{item.primarySupplierOrderDays || 'Cualquier día laborable'}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 text-[11px] block">Horario / Días de entrega:</span>
                      <strong className="text-stone-800">{item.primarySupplierDeliveryDays || '24h tras pedido'}</strong>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Replenish Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-950/90 to-[#1E1917] text-white border border-emerald-800/60 shadow-lg space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-emerald-200">
                          Reposición Express WhatsApp
                        </h4>
                        <p className="text-[11px] text-stone-400">
                          Restaura la barra de salud del insumo al 100% HP
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-lg bg-emerald-900/60 border border-emerald-700 text-emerald-300 font-bold text-xs">
                      +{suggestedOrderQty} {item.unit}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-emerald-900/60 text-xs text-stone-300 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Objetivo para salud óptima:</span>
                      <span className="font-semibold text-white">{targetStock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Existencias actuales:</span>
                      <span className="font-semibold text-amber-300">{item.currentStock} {item.unit}</span>
                    </div>
                    <div className="flex justify-between border-t border-stone-800 pt-1">
                      <span className="text-stone-400">Coste estimado del pedido:</span>
                      <span className="font-bold text-emerald-400">{estimatedOrderCost} €</span>
                    </div>
                  </div>

                  {item.primarySupplierPhone ? (
                    <a
                      href={buildWhatsAppLink()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs tracking-wide shadow-md transition-all active:scale-98 cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Enviar Pedido Directo a WhatsApp</span>
                    </a>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-stone-800 text-stone-400 text-xs text-center">
                      Configura el teléfono del proveedor para habilitar WhatsApp directo.
                    </div>
                  )}
                </div>

                {/* Comparative Price Quotes */}
                {item.prices && item.prices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-xs text-stone-500 uppercase tracking-wider">
                      Cotizaciones de Proveedores ({item.prices.length})
                    </h4>
                    <div className="space-y-1.5">
                      {item.prices.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 rounded-xl border border-[#EADBC8] bg-[#FAF8F5] flex items-center justify-between text-xs"
                        >
                          <div>
                            <strong className="text-stone-800">{p.supplierName}</strong>
                            {p.formatDescription && (
                              <span className="text-stone-500 text-[11px] block">
                                {p.formatDescription}
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-stone-900 text-sm">
                              {p.unitPrice.toFixed(2)} €
                            </span>
                            {p.isBestOffer && (
                              <span className="block text-[10px] font-bold text-emerald-700">
                                ★ Mejor Oferta
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: MERMAS & REGISTRO RÁPIDO */}
            {activeTab === 'waste' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* Waste Summary Metric */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                      Coste Perdido en Mermas
                    </span>
                    <span className="font-serif font-bold text-xl sm:text-2xl text-rose-900">
                      −{item.totalWasteCost.toFixed(2)} €
                    </span>
                    <span className="text-[11px] text-rose-700 block mt-0.5">
                      {item.totalWasteQuantity} {item.unit} desechados
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EADBC8]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                      Rango de Eficiencia
                    </span>
                    <span className="font-serif font-bold text-xl sm:text-2xl text-[#2B2523]">
                      {item.totalWasteCost === 0 ? '100%' : '94.2%'}
                    </span>
                    <span className="text-[11px] text-stone-500 block mt-0.5">
                      {item.wasteCount === 0 ? '🏅 Desperdicio Cero' : `${item.wasteCount} incidencias`}
                    </span>
                  </div>
                </div>

                {/* Inline Quick Waste Logger */}
                <form
                  onSubmit={handleQuickWasteSubmit}
                  className="p-4 rounded-2xl bg-stone-900 text-white border border-stone-800 space-y-3 shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4 text-rose-400" />
                      <span className="font-bold text-xs text-rose-200 uppercase tracking-wide">
                        + Registrar Merma de {item.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-400">
                      Descuenta automáticamente del stock
                    </span>
                  </div>

                  {wasteSuccessMsg && (
                    <div className="p-2.5 rounded-xl bg-emerald-900/80 border border-emerald-600 text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{wasteSuccessMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">
                        Cantidad desechada ({item.unit})
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={wasteQty}
                        onChange={(e) => setWasteQty(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-stone-400 mb-1">
                        Motivo principal
                      </label>
                      <select
                        value={wasteReason}
                        onChange={(e) => setWasteReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs font-semibold focus:outline-none focus:border-rose-500"
                      >
                        {Object.entries(WASTE_REASONS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Notas adicionales (ej: plato quemado, paquete roto...)"
                      value={wasteNotes}
                      onChange={(e) => setWasteNotes(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-stone-800 border border-stone-700 text-white text-xs placeholder:text-stone-500 focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingWaste}
                    className="w-full py-2.5 px-4 rounded-xl bg-rose-700 hover:bg-rose-600 text-white font-bold text-xs tracking-wide transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isSubmittingWaste ? 'Guardando merma...' : 'Registrar Merma y Descontar Stock'}</span>
                  </button>
                </form>

                {/* Waste Records History */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-xs text-stone-500 uppercase tracking-wider">
                    Historial de Mermas de este Insumo ({item.wasteRecords.length})
                  </h4>

                  {item.wasteRecords.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl bg-[#FAF8F5] border border-dashed border-[#EADBC8] text-stone-500 text-xs">
                      <Award className="w-8 h-8 text-amber-500 mx-auto mb-1.5" />
                      <strong className="block text-stone-800 text-sm">¡Desperdicio Cero!</strong>
                      No se han registrado mermas de este insumo. Excelente gestión del equipo.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {item.wasteRecords.map((w) => (
                        <div
                          key={w.id}
                          className="p-3 rounded-xl border border-rose-200/80 bg-rose-50/40 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-rose-950">{w.reasonLabel}</span>
                            <span className="font-bold text-rose-800">
                              −{w.estimatedCost.toFixed(2)} €
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-stone-500">
                            <span>
                              Cantidad: <strong>{w.quantity} {w.unit}</strong>
                            </span>
                            <span>{w.date}</span>
                          </div>
                          {w.notes && (
                            <p className="text-[11px] text-stone-600 italic border-t border-rose-200/50 pt-1 mt-1">
                              «{w.notes}»
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: MOVIMIENTOS & TRAZABILIDAD */}
            {activeTab === 'movements' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-xs text-stone-500 uppercase tracking-wider">
                    Últimos Movimientos de Stock
                  </h4>
                  <span className="text-[11px] text-stone-400">Trazabilidad en tiempo real</span>
                </div>

                {item.recentMovements.length === 0 ? (
                  <div className="p-6 text-center rounded-2xl bg-[#FAF8F5] border border-dashed border-[#EADBC8] text-stone-500 text-xs">
                    Sin movimientos registrados recientemente.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {item.recentMovements.map((m) => {
                      const isPositive = m.quantity > 0;
                      return (
                        <div
                          key={m.id}
                          className="p-3 rounded-xl border border-[#EADBC8] bg-[#FAF8F5] flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.type === 'IN'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.type === 'WASTE'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-stone-200 text-stone-800'
                            }`}>
                              {m.type === 'IN' ? 'Entrada / Pedido' : m.type === 'WASTE' ? 'Merma' : 'Ajuste Manual'}
                            </span>
                            <p className="text-stone-700 font-medium mt-1">
                              {m.reason || 'Sin motivo especificado'}
                            </p>
                            <span className="text-[10px] text-stone-400 block">{m.createdAt}</span>
                          </div>

                          <div className="text-right">
                            <span className={`font-bold text-sm ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {isPositive ? '+' : ''}{m.quantity} {item.unit}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: EVENTOS LOCALES CAMAS / SEVILLA */}
            {activeTab === 'events' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">Previsión Local Camas / Sevilla</strong>
                    <span>
                      Los eventos masivos en el Aljarafe y Sevilla disparan el consumo de insumos clave. Consulta los eventos para preparar compras preventivas.
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  {events.map((evt) => (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-xl border border-[#EADBC8] bg-[#FAF8F5] space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-[#2B2523]">{evt.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#9E2A2B] text-white">
                          +{Math.round((evt.demandMultiplier - 1) * 100)}% Demanda
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600">{evt.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-stone-500 pt-1 border-t border-[#EADBC8]/70">
                        <span>Fechas: <strong>{evt.startDate} al {evt.endDate}</strong></span>
                        <span className="text-[#9E2A2B] font-semibold">{evt.recommendedFocus || 'Refuerzo de despensa'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer with Quick Step Controls */}
          <div className="p-4 border-t border-[#EADBC8] bg-[#FAF8F5] flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-stone-500">Ajuste rápido:</span>
              <button
                onClick={() => onAdjustQuantity(item, -1)}
                className="w-8 h-8 rounded-lg bg-white border border-[#EADBC8] hover:bg-stone-100 flex items-center justify-center font-bold text-stone-700 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Restar 1"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onAdjustQuantity(item, 1)}
                className="w-8 h-8 rounded-lg bg-white border border-[#EADBC8] hover:bg-stone-100 flex items-center justify-center font-bold text-stone-700 transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title="Sumar 1"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cerrar Ficha
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
