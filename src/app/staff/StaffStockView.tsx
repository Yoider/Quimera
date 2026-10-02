'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  Package,
  Truck,
  Trash2,
  Calendar,
  Search,
  Plus,
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  MessageCircle,
  Phone,
  Euro,
  Scale,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  TrendingDown,
  RefreshCw,
  Edit2,
  ShieldAlert,
} from 'lucide-react';
import {
  getSupplyItemsAction,
  updateStockQuantityAction,
  createSupplyItemAction,
  getSuppliersAction,
  createSupplierAction,
  getSupplierOrderProposalsAction,
  getFoodWasteRecordsAction,
  logFoodWasteAction,
  getLocalEventsAction,
  SupplyItemData,
  SupplierData,
  SupplierOrderProposal,
  FoodWasteData,
  LocalEventData,
} from './stockActions';

const WASTE_REASONS: Record<string, string> = {
  EXPIRED: 'Fecha de caducidad superada',
  SPOILED: 'Deterioro de producto fresco (fruta/verdura)',
  COOKING_ERROR: 'Error de cocina o plato quemado',
  LEFTOVER: 'Sobrante no recuperable de fin de servicio',
  OTHER: 'Otra incidencia / Rotura de envase',
};

type StockSubTab = 'inventory' | 'suppliers' | 'waste' | 'events';

export default function StaffStockView() {
  const [activeTab, setActiveTab] = useState<StockSubTab>('inventory');
  const [isPending, startTransition] = useTransition();

  // Data states
  const [items, setItems] = useState<SupplyItemData[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierData[]>([]);
  const [orderProposals, setOrderProposals] = useState<SupplierOrderProposal[]>([]);
  const [wasteRecords, setWasteRecords] = useState<FoodWasteData[]>([]);
  const [totalWasteCost, setTotalWasteCost] = useState<number>(0);
  const [topWastedItems, setTopWastedItems] = useState<{ name: string; cost: number; count: number }[]>([]);
  const [events, setEvents] = useState<LocalEventData[]>([]);

  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);
  const [filterTodayOrdersOnly, setFilterTodayOrdersOnly] = useState(false);

  // Modals
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isNewSupplierModalOpen, setIsNewSupplierModalOpen] = useState(false);
  const [isNewWasteModalOpen, setIsNewWasteModalOpen] = useState(false);
  const [selectedProposalForOrder, setSelectedProposalForOrder] = useState<SupplierOrderProposal | null>(null);

  // Toast notification
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Load all data
  const loadData = () => {
    startTransition(async () => {
      const [itemsRes, suppRes, propRes, wasteRes, eventsRes] = await Promise.all([
        getSupplyItemsAction(),
        getSuppliersAction(),
        getSupplierOrderProposalsAction(),
        getFoodWasteRecordsAction(),
        getLocalEventsAction(),
      ]);

      if (itemsRes.success) setItems(itemsRes.items);
      if (suppRes.success) setSuppliers(suppRes.suppliers);
      if (propRes.success) setOrderProposals(propRes.proposals);
      if (wasteRes.success) {
        setWasteRecords(wasteRes.records);
        setTotalWasteCost(wasteRes.totalCostLost);
        setTopWastedItems(wasteRes.topWastedItems);
      }
      if (eventsRes.success) setEvents(eventsRes.events);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle rapid quantity adjustment (+ / -)
  const handleAdjustQuantity = (item: SupplyItemData, delta: number) => {
    const newQty = Math.max(0, item.currentStock + delta);
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, currentStock: newQty } : it))
    );

    startTransition(async () => {
      const res = await updateStockQuantityAction(item.id, newQty, `Ajuste manual (${delta > 0 ? '+' : ''}${delta} ${item.unit})`);
      if (res.success) {
        showNotification(`Stock actualizado: "${item.name}" ahora tiene ${newQty} ${item.unit}.`);
      }
    });
  };

  // Categories list
  const CATEGORIES = [
    { id: 'all', label: 'Todos los Insumos' },
    { id: 'CARNES', label: '🥩 Carnes & Embutidos' },
    { id: 'QUESOS', label: '🧀 Quesos & Lácteos' },
    { id: 'FRUTAS_VERDURAS', label: '🥬 Huerta & Patatas' },
    { id: 'PANADERIA', label: '🥖 Panadería & Molletes' },
    { id: 'BEBIDAS', label: '🍺 Cerveza & Vinos' },
    { id: 'ACEITES_SALSAS', label: '🫒 Aceite & Salsas' },
    { id: 'ENVASES_LIMPIEZA', label: '🧻 Envases & Limpieza' },
  ];

  // Filtered inventory
  const filteredItems = items.filter((it) => {
    if (selectedCategory !== 'all' && it.category !== selectedCategory) return false;
    if (filterLowStockOnly && it.currentStock > it.minStock) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        it.name.toLowerCase().includes(q) ||
        (it.primarySupplierName && it.primarySupplierName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered suppliers
  const filteredSuppliers = suppliers.filter((s) => {
    if (filterTodayOrdersOnly) {
      const proposal = orderProposals.find((p) => p.supplierId === s.id);
      if (!proposal?.isTodayOrderDay) return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.phone.includes(q);
    }
    return true;
  });

  const lowStockCount = items.filter((i) => i.currentStock <= i.minStock).length;
  const criticalStockCount = items.filter((i) => i.currentStock <= 0).length;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2B2523] text-white border border-[#D4A373] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-[#D4A373]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner / Metrics */}
      <div className="bg-[#2B2523] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A373]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A373]/20 border border-[#D4A373]/30 text-[#D4A373] text-xs font-semibold uppercase tracking-wider">
                <Package className="w-3.5 h-3.5" />
                <span>Gestión de Almacén · Camas (Sevilla)</span>
              </span>
              <span className="text-stone-400 text-xs">· Puerta del Aljarafe</span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#FAF8F5]">
              Stock, Proveedores & Mermas
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Control de materias primas, pedidos directos por WhatsApp a proveedores locales, registro de desperdicios y previsión de demanda por festividades sevillanas.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Insumos</span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-[#D4A373]">{items.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Bajo Mínimo</span>
              <span className={`font-serif font-bold text-xl sm:text-2xl ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {lowStockCount}
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Proveedores</span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-blue-400">{suppliers.length}</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Mermas (€)</span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-rose-400">{totalWasteCost}€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-2 shadow-sm border border-[#EADBC8] flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'bg-[#9E2A2B] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#FAF8F5]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Inventario & Insumos ({items.length})</span>
          {lowStockCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-400 text-stone-900 text-[10px] font-bold">
              {lowStockCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'suppliers'
              ? 'bg-[#9E2A2B] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#FAF8F5]'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Proveedores & WhatsApp ({suppliers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('waste')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'waste'
              ? 'bg-[#9E2A2B] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#FAF8F5]'
          }`}
        >
          <Trash2 className="w-4 h-4" />
          <span>Control de Mermas ({totalWasteCost}€)</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 min-w-[140px] py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'events'
              ? 'bg-[#9E2A2B] text-white shadow-xs'
              : 'text-[#6E6259] hover:bg-[#FAF8F5]'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Eventos Camas / Sevilla ({events.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: INVENTARIO DE INSUMOS & STOCK */}
      {/* ========================================================================= */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EADBC8] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar insumo (ej: Jamón, Aceite, Huevos)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B]"
                />
              </div>

              {/* Low stock filter toggle */}
              <button
                onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  filterLowStockOnly
                    ? 'bg-amber-100 text-amber-900 border border-amber-300'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Solo Bajo Mínimo ({lowStockCount})</span>
              </button>
            </div>

            <button
              onClick={() => setIsNewItemModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#852223] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Insumo</span>
            </button>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  selectedCategory === cat.id
                    ? 'bg-[#2B2523] text-white shadow-2xs'
                    : 'bg-white border border-[#EADBC8] text-stone-600 hover:bg-stone-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Inventory Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => {
              const isCritical = item.currentStock <= 0;
              const isLow = item.currentStock <= item.minStock && !isCritical;

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between gap-3 transition-all ${
                    isCritical
                      ? 'border-red-300 ring-2 ring-red-100'
                      : isLow
                      ? 'border-amber-300 ring-2 ring-amber-100'
                      : 'border-[#EADBC8]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6259]">
                          {item.category.replace('_', ' ')}
                        </span>
                        <h4 className="font-serif font-bold text-base text-[#2B2523]">
                          {item.name}
                        </h4>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isCritical
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : isLow
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {isCritical ? 'AGOTADO' : isLow ? 'BAJO MÍNIMO' : 'ÓPTIMO'}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-xs text-[#6E6259] line-clamp-1 italic">
                        {item.notes}
                      </p>
                    )}

                    {/* Supplier tag */}
                    {item.primarySupplierName && (
                      <div className="flex items-center gap-1 text-[11px] text-stone-600 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200">
                        <Truck className="w-3 h-3 text-[#9E2A2B]" />
                        <span>Proveedor: <strong>{item.primarySupplierName}</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Stock Levels & Touch Controls */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">
                        Stock Actual / Mínimo
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className={`font-sans font-extrabold text-2xl ${isCritical ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-[#2B2523]'}`}>
                          {item.currentStock}
                        </span>
                        <span className="text-xs text-stone-500 font-medium">
                          / {item.minStock} {item.unit}
                        </span>
                      </div>
                    </div>

                    {/* Quick + / - Adjuster */}
                    <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#EADBC8] p-1 rounded-xl">
                      <button
                        onClick={() => handleAdjustQuantity(item, -1)}
                        className="w-8 h-8 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Restar 1 unidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleAdjustQuantity(item, 1)}
                        className="w-8 h-8 rounded-lg bg-[#9E2A2B] hover:bg-[#852223] text-white flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Sumar 1 unidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PROVEEDORES & ASISTENTE DE PEDIDOS WHATSAPP */}
      {/* ========================================================================= */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#EADBC8] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar proveedor o teléfono..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B]"
                />
              </div>

              <button
                onClick={() => setFilterTodayOrdersOnly(!filterTodayOrdersOnly)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                  filterTodayOrdersOnly
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-stone-50 text-stone-600 border border-stone-200 hover:bg-stone-100'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Toca Pedir HOY</span>
              </button>
            </div>

            <button
              onClick={() => setIsNewSupplierModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#852223] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Proveedor</span>
            </button>
          </div>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map((supplier) => {
              const proposal = orderProposals.find((p) => p.supplierId === supplier.id);
              const isToday = proposal?.isTodayOrderDay;
              const shortages = proposal?.items.length || 0;

              return (
                <div
                  key={supplier.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between gap-4 transition-all ${
                    isToday ? 'border-emerald-300 ring-2 ring-emerald-100' : 'border-[#EADBC8]'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-serif font-bold text-base text-[#2B2523]">
                            {supplier.name}
                          </h4>
                          {isToday && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                              HOY
                            </span>
                          )}
                        </div>
                        {supplier.contactName && (
                          <span className="text-xs text-[#6E6259] block">
                            Contacto: {supplier.contactName}
                          </span>
                        )}
                      </div>

                      <a
                        href={`tel:${supplier.phone}`}
                        className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
                        title="Llamar por teléfono"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {/* Schedule Details */}
                    <div className="space-y-1.5 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                      <div>
                        <strong className="text-[#2B2523]">Días de pedido:</strong> {supplier.orderDays}
                      </div>
                      {supplier.deliveryDays && (
                        <div>
                          <strong className="text-[#2B2523]">Entrega:</strong> {supplier.deliveryDays}
                        </div>
                      )}
                      {supplier.notes && (
                        <div className="text-[11px] text-stone-500 italic mt-1">
                          {supplier.notes}
                        </div>
                      )}
                    </div>

                    {/* Shortage indicator */}
                    {shortages > 0 && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{shortages} producto(s) bajo mínimos para pedir</span>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Action Button */}
                  <div className="pt-3 border-t border-stone-100">
                    <button
                      onClick={() => proposal && setSelectedProposalForOrder(proposal)}
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Pedir por WhatsApp</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 3: CONTROL DE MERMAS & DESPERDICIO */}
      {/* ========================================================================= */}
      {activeTab === 'waste' && (
        <div className="space-y-6">
          {/* Waste Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-rose-200 p-5 shadow-xs bg-gradient-to-br from-rose-50/50 to-white">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
                Total Pérdida Económica
              </span>
              <span className="font-serif font-extrabold text-3xl text-rose-600 mt-1 block">
                {totalWasteCost.toFixed(2)}€
              </span>
              <span className="text-xs text-stone-500 mt-1 block">
                Coste acumulado en comida y producto desechado
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-[#EADBC8] p-5 shadow-xs md:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-[#2B2523] uppercase tracking-wider block">
                  Top Alimentos Desperdiciados (Optimizar Compras)
                </span>
                <button
                  onClick={() => setIsNewWasteModalOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Registrar Merma</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topWastedItems.length > 0 ? (
                  topWastedItems.map((top, idx) => (
                    <div key={idx} className="bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                      <span className="text-xs font-bold text-[#2B2523] truncate block">
                        {top.name}
                      </span>
                      <span className="text-sm font-extrabold text-rose-600 block">
                        {top.cost.toFixed(2)}€
                      </span>
                      <span className="text-[10px] text-stone-500 block">
                        {top.count} registro(s)
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-stone-400 italic col-span-3">
                    Aún no hay mermas registradas. ¡Excelente trabajo en cocina!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Waste History Table */}
          <div className="bg-white rounded-2xl border border-[#EADBC8] p-5 shadow-xs space-y-4">
            <h4 className="font-serif font-bold text-base text-[#2B2523]">
              Historial de Mermas Registradas
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-stone-200 text-[#6E6259] uppercase text-[10px] tracking-wider">
                    <th className="pb-3 font-bold">Fecha</th>
                    <th className="pb-3 font-bold">Producto / Insumo</th>
                    <th className="pb-3 font-bold">Cantidad</th>
                    <th className="pb-3 font-bold">Motivo</th>
                    <th className="pb-3 font-bold text-right">Coste (€)</th>
                    <th className="pb-3 font-bold">Registrado por</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {wasteRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 text-stone-500 whitespace-nowrap">{r.date}</td>
                      <td className="py-3 font-bold text-[#2B2523]">{r.itemName}</td>
                      <td className="py-3 font-semibold">{r.quantity} {r.unit}</td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-semibold">
                          {r.reasonLabel}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-rose-600">
                        {r.estimatedCost.toFixed(2)}€
                      </td>
                      <td className="py-3 text-stone-500">{r.loggedBy || 'Cocina'}</td>
                    </tr>
                  ))}
                  {wasteRecords.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-stone-400 italic">
                        No hay registros de mermas recientes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 4: CALENDARIO DE EVENTOS & DEMANDA CAMAS / SEVILLA */}
      {/* ========================================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-xs border border-[#EADBC8]">
            <h3 className="font-serif font-bold text-lg text-[#2B2523]">
              Festividades y Eventos Clave (Camas / Sevilla)
            </h3>
            <p className="text-xs text-[#6E6259] mt-0.5 max-w-3xl">
              El motor de previsión anticipa picos de afluencia por ferias locales, pasos romeros, partidos de fútbol y festivos, recomendando qué insumos reforzar para evitar roturas de stock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="bg-white rounded-2xl border border-[#EADBC8] p-5 shadow-xs flex flex-col justify-between gap-4 hover:border-[#D4A373] transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B]">
                        {ev.location}
                      </span>
                      <h4 className="font-serif font-bold text-base text-[#2B2523]">
                        {ev.title}
                      </h4>
                    </div>

                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200 text-xs font-extrabold shrink-0">
                      +{Math.round((ev.demandMultiplier - 1) * 100)}% Buya
                    </span>
                  </div>

                  <p className="text-xs text-[#6E6259]">
                    {ev.description}
                  </p>

                  <div className="text-[11px] font-semibold text-stone-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D4A373]" />
                    <span>{ev.startDate} - {ev.endDate}</span>
                  </div>

                  {ev.recommendedFocus && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 space-y-1">
                      <strong className="block text-[11px] uppercase tracking-wider text-amber-800">
                        ⚡ Insumos Críticos a Reforzar:
                      </strong>
                      <span>{ev.recommendedFocus}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PREVIEW DE PEDIDO WHATSAPP */}
      {/* ========================================================================= */}
      {selectedProposalForOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setSelectedProposalForOrder(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                  Asistente de Pedidos WhatsApp
                </span>
                <h3 className="font-serif font-bold text-xl text-[#2B2523]">
                  {selectedProposalForOrder.supplierName}
                </h3>
                <span className="text-xs text-[#6E6259]">
                  Teléfono: {selectedProposalForOrder.phone} · Días: {selectedProposalForOrder.orderDays}
                </span>
              </div>
              <button
                onClick={() => setSelectedProposalForOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Items to Order */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-[#2B2523] block">
                Insumos que necesitan reposición:
              </span>

              {selectedProposalForOrder.items.length > 0 ? (
                <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-48 overflow-y-auto">
                  {selectedProposalForOrder.items.map((it) => (
                    <div key={it.itemId} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-[#2B2523]">{it.name}</strong>
                        <span className="text-stone-400 text-[11px] block">
                          Stock actual: {it.currentStock} / Mínimo: {it.minStock} {it.unit}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        Pedir {it.orderQuantity} {it.unit}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-500 italic bg-stone-50 p-3 rounded-xl border border-stone-200">
                  No hay insumos bajo mínimos de este proveedor. Se enviará el texto de pedido habitual o consulta de reposición.
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
              <button
                onClick={() => setSelectedProposalForOrder(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>

              <a
                href={selectedProposalForOrder.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setSelectedProposalForOrder(null)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Abrir WhatsApp & Enviar Pedido</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTRAR MERMA / DESPERDICIO */}
      {/* ========================================================================= */}
      {isNewWasteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsNewWasteModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-rose-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-[#2B2523]">
                  Registrar Merma o Desperdicio
                </h3>
                <p className="text-xs text-[#6E6259]">
                  Descontará el stock y registrará el coste económico en el balance.
                </p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const itemId = (form.elements.namedItem('supplyItemId') as HTMLSelectElement).value;
                const selectedItem = items.find((i) => i.id === itemId);
                const quantity = parseFloat((form.elements.namedItem('quantity') as HTMLInputElement).value);
                const reason = (form.elements.namedItem('reason') as HTMLSelectElement).value;
                const cost = selectedItem ? selectedItem.currentPrice * quantity : 0;

                startTransition(async () => {
                  const res = await logFoodWasteAction({
                    supplyItemId: itemId || undefined,
                    itemName: selectedItem ? selectedItem.name : 'Plato / Desperdicio vario',
                    quantity,
                    unit: selectedItem ? selectedItem.unit : 'unidades',
                    estimatedCost: cost,
                    reason,
                  });

                  if (res.success) {
                    showNotification('Merma registrada con éxito.');
                    setIsNewWasteModalOpen(false);
                    loadData();
                  }
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-[#2B2523] mb-1">
                  Insumo o Alimento *
                </label>
                <select
                  name="supplyItemId"
                  required
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#9E2A2B]"
                >
                  {items.map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name} ({it.unit} · {it.currentPrice}€)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2523] mb-1">
                  Cantidad desechada *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  name="quantity"
                  defaultValue="1"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#9E2A2B]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2523] mb-1">
                  Motivo de la merma *
                </label>
                <select
                  name="reason"
                  required
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#9E2A2B]"
                >
                  <option value="SPOILED">Deterioro de producto fresco (fruta/verdura)</option>
                  <option value="EXPIRED">Fecha de caducidad superada</option>
                  <option value="COOKING_ERROR">Error de cocina o plato quemado</option>
                  <option value="LEFTOVER">Sobrante no recuperable de fin de servicio</option>
                  <option value="OTHER">Otro motivo / Rotura de envase</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewWasteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Guardar Merma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO INSUMO */}
      {/* ========================================================================= */}
      {isNewItemModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsNewItemModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif font-bold text-lg text-[#2B2523]">
              Añadir Nuevo Insumo al Stock
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const category = (form.elements.namedItem('category') as HTMLSelectElement).value;
                const currentStock = parseFloat((form.elements.namedItem('currentStock') as HTMLInputElement).value);
                const minStock = parseFloat((form.elements.namedItem('minStock') as HTMLInputElement).value);
                const unit = (form.elements.namedItem('unit') as HTMLInputElement).value;
                const currentPrice = parseFloat((form.elements.namedItem('currentPrice') as HTMLInputElement).value);
                const primarySupplierId = (form.elements.namedItem('primarySupplierId') as HTMLSelectElement).value;

                startTransition(async () => {
                  const res = await createSupplyItemAction({
                    name,
                    category,
                    currentStock,
                    minStock,
                    unit,
                    currentPrice,
                    primarySupplierId: primarySupplierId || undefined,
                  });

                  if (res.success) {
                    showNotification(`Insumo "${name}" añadido al almacén.`);
                    setIsNewItemModalOpen(false);
                    loadData();
                  }
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-[#2B2523] mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  name="name"
                  placeholder="ej: Solomillo de cerdo ibérico"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5] focus:outline-none focus:border-[#9E2A2B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Categoría *</label>
                  <select
                    name="category"
                    required
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  >
                    <option value="CARNES">Carnes & Embutidos</option>
                    <option value="QUESOS">Quesos & Lácteos</option>
                    <option value="FRUTAS_VERDURAS">Huerta & Patatas</option>
                    <option value="PANADERIA">Panadería</option>
                    <option value="BEBIDAS">Bebidas</option>
                    <option value="ACEITES_SALSAS">Aceites & Salsas</option>
                    <option value="ENVASES_LIMPIEZA">Envases & Limpieza</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Unidad de medida *</label>
                  <input
                    type="text"
                    required
                    name="unit"
                    placeholder="kg, litros, cajas..."
                    defaultValue="kg"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    step="0.1"
                    name="currentStock"
                    defaultValue="10"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    step="0.1"
                    name="minStock"
                    defaultValue="3"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Precio (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="currentPrice"
                    defaultValue="5.00"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2523] mb-1">Proveedor Principal</label>
                <select
                  name="primarySupplierId"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                >
                  <option value="">Sin proveedor asignado</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#852223] text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Guardar Insumo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: NUEVO PROVEEDOR */}
      {/* ========================================================================= */}
      {isNewSupplierModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setIsNewSupplierModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif font-bold text-lg text-[#2B2523]">
              Añadir Nuevo Proveedor
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const contactName = (form.elements.namedItem('contactName') as HTMLInputElement).value;
                const phone = (form.elements.namedItem('phone') as HTMLInputElement).value;
                const orderDays = (form.elements.namedItem('orderDays') as HTMLInputElement).value;
                const deliveryDays = (form.elements.namedItem('deliveryDays') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLInputElement).value;

                startTransition(async () => {
                  const res = await createSupplierAction({
                    name,
                    contactName,
                    phone,
                    orderDays,
                    deliveryDays,
                    notes,
                  });

                  if (res.success) {
                    showNotification(`Proveedor "${name}" creado con éxito.`);
                    setIsNewSupplierModalOpen(false);
                    loadData();
                  }
                });
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-semibold text-[#2B2523] mb-1">Nombre de la Empresa *</label>
                <input
                  type="text"
                  required
                  name="name"
                  placeholder="ej: Distribuciones Sevilla"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    name="contactName"
                    placeholder="ej: Manolo"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Teléfono (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    name="phone"
                    placeholder="+34 600 000 000"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Días de Pedido *</label>
                  <input
                    type="text"
                    required
                    name="orderDays"
                    placeholder="ej: Lunes y Miércoles"
                    defaultValue="Lunes y Jueves"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#2B2523] mb-1">Días de Entrega</label>
                  <input
                    type="text"
                    name="deliveryDays"
                    placeholder="ej: Martes y Viernes mañana"
                    className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2B2523] mb-1">Notas / Ubicación</label>
                <input
                  type="text"
                  name="notes"
                  placeholder="ej: Polígono El Manchón, Camas"
                  className="w-full p-2.5 rounded-xl border border-stone-200 text-xs bg-[#FAF8F5]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsNewSupplierModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#852223] text-white text-xs font-bold cursor-pointer transition-colors"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
