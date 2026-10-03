'use client';

import React, { useState, useEffect, useTransition } from 'react';
import StaffStockCardOver from './StaffStockCardOver';
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
  ShieldCheck,
  Flame,
  Award,
  Zap,
  HeartPulse,
  SlidersHorizontal,
  X,
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

export default function StaffStockView() {
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
  const [filterWasteOnly, setFilterWasteOnly] = useState(false);
  const [filterZeroWasteOnly, setFilterZeroWasteOnly] = useState(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Selected item for 360 Card Over
  const [selectedCardOverItem, setSelectedCardOverItem] = useState<SupplyItemData | null>(null);

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

      if (itemsRes.success) {
        setItems(itemsRes.items);
        // Refresh selected card over item if open
        if (selectedCardOverItem) {
          const fresh = itemsRes.items.find((i) => i.id === selectedCardOverItem.id);
          if (fresh) setSelectedCardOverItem(fresh);
        }
      }
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
    const newQty = Math.max(0, Number((item.currentStock + delta).toFixed(1)));
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, currentStock: newQty } : it))
    );

    if (selectedCardOverItem?.id === item.id) {
      setSelectedCardOverItem((prev) => (prev ? { ...prev, currentStock: newQty } : null));
    }

    startTransition(async () => {
      const res = await updateStockQuantityAction(
        item.id,
        newQty,
        `Ajuste manual (${delta > 0 ? '+' : ''}${delta} ${item.unit})`
      );
      if (res.success) {
        showNotification(`Stock actualizado: "${item.name}" ahora tiene ${newQty} ${item.unit}.`);
        loadData();
      }
    });
  };

  // Quick waste logger from 360 card over
  const handleLogQuickWaste = async (wasteData: {
    supplyItemId: string;
    itemName: string;
    quantity: number;
    unit: string;
    estimatedCost: number;
    reason: string;
    notes?: string;
  }): Promise<boolean> => {
    const res = await logFoodWasteAction({
      supplyItemId: wasteData.supplyItemId,
      itemName: wasteData.itemName,
      quantity: wasteData.quantity,
      unit: wasteData.unit,
      estimatedCost: wasteData.estimatedCost,
      reason: wasteData.reason,
      notes: wasteData.notes,
      loggedBy: 'Equipo Quimera',
    });

    if (res.success) {
      showNotification(`Merma registrada: −${wasteData.quantity} ${wasteData.unit} en "${wasteData.itemName}".`);
      loadData();
      return true;
    } else {
      alert('Error al registrar la merma.');
      return false;
    }
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

  // Filtered inventory with stock status & search filters
  const filteredItems = items.filter((it) => {
    if (selectedCategory !== 'all' && it.category !== selectedCategory) return false;
    if (filterLowStockOnly && it.currentStock > it.minStock) return false;
    if (filterWasteOnly && it.totalWasteCost <= 0) return false;
    if (filterZeroWasteOnly && it.totalWasteCost > 0) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return (
        it.name.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        (it.primarySupplierName && it.primarySupplierName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const lowStockCount = items.filter((i) => i.currentStock <= i.minStock).length;
  const criticalStockCount = items.filter((i) => i.currentStock <= 0).length;
  const zeroWasteCount = items.filter((i) => i.totalWasteCost === 0).length;
  const withWasteCount = items.filter((i) => i.totalWasteCost > 0).length;
  const getCardHealthTheme = (status: SupplyItemData['healthStatus']) => {
    switch (status) {
      case 'HEALTHY':
        return {
          bar: 'bg-emerald-500',
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          border: 'border-[#EADBC8] hover:border-emerald-400',
          text: 'text-emerald-700',
          label: 'Óptimo',
          icon: ShieldCheck,
        };
      case 'WARNING':
        return {
          bar: 'bg-amber-500',
          badge: 'bg-amber-50 text-amber-800 border-amber-300',
          border: 'border-amber-300 ring-2 ring-amber-100/70',
          text: 'text-amber-700',
          label: 'Bajo Mínimo',
          icon: AlertTriangle,
        };
      case 'CRITICAL':
        return {
          bar: 'bg-rose-500',
          badge: 'bg-rose-50 text-rose-800 border-rose-300',
          border: 'border-rose-400 ring-2 ring-rose-100',
          text: 'text-rose-700',
          label: 'Riesgo de Rotura',
          icon: AlertTriangle,
        };
      case 'EMPTY':
      default:
        return {
          bar: 'bg-stone-500',
          badge: 'bg-stone-200 text-stone-800 border-stone-300',
          border: 'border-stone-400 ring-2 ring-stone-200',
          text: 'text-stone-700',
          label: 'Agotado',
          icon: AlertTriangle,
        };
    }
  };

  const getQuickWhatsAppUrl = (item: SupplyItemData) => {
    const phone = item.primarySupplierPhone?.replace(/\D/g, '') || '';
    if (!phone) return null;
    const cleanPhone = phone.startsWith('34') ? phone : `34${phone}`;
    const targetStock = item.minStock * 2;
    const suggestedQty = Math.max(1, Number((targetStock - item.currentStock).toFixed(1)));
    const text = encodeURIComponent(
      `Hola ${item.primarySupplierName || 'proveedor'}, te escribimos desde Taberna Quimera (Camas, Sevilla).\nNecesitamos pedir:\n- Insumo: ${item.name}\n- Cantidad: ${suggestedQty} ${item.unit}\n¿Nos confirmáis reparto? Muchas gracias.`
    );
    return `https://wa.me/${cleanPhone}?text=${text}`;
  };

  const renderFiltersContent = (isMobileDrawer = false) => (
    <div className="bg-white rounded-3xl p-5 shadow-xs border border-[#EADBC8] space-y-5">
      {/* Header if mobile */}
      {isMobileDrawer && (
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#9E2A2B]" />
            <h3 className="font-serif font-bold text-base text-[#2B2523]">Filtros & Categorías</h3>
          </div>
          <button
            onClick={() => setIsFilterDrawerOpen(false)}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* CTA Button: Add item */}
      <button
        onClick={() => {
          if (isMobileDrawer) setIsFilterDrawerOpen(false);
          setIsNewItemModalOpen(true);
        }}
        className="w-full py-2.5 px-4 rounded-xl bg-[#9E2A2B] hover:bg-[#852223] text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs cursor-pointer"
      >
        <Plus className="w-4 h-4" />
        <span>+ Añadir Nuevo Insumo</span>
      </button>

      {/* Search omnibox */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
          Búsqueda de Insumo
        </label>
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre o proveedor..."
            className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B] bg-[#FAF8F5]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stock Status Filters */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
          Estado del Stock
        </label>
        <div className="flex flex-col gap-1">
          <button
            onClick={() => {
              setFilterLowStockOnly(false);
              setFilterWasteOnly(false);
              setFilterZeroWasteOnly(false);
              if (isMobileDrawer) setIsFilterDrawerOpen(false);
            }}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              !filterLowStockOnly && !filterWasteOnly && !filterZeroWasteOnly
                ? 'bg-[#2B2523] text-white shadow-2xs font-bold'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5" />
              <span>Todos los Insumos</span>
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full ${
                !filterLowStockOnly && !filterWasteOnly && !filterZeroWasteOnly
                  ? 'bg-white/20 text-white'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {items.length}
            </span>
          </button>

          <button
            onClick={() => {
              setFilterLowStockOnly(!filterLowStockOnly);
              setFilterWasteOnly(false);
              setFilterZeroWasteOnly(false);
              if (isMobileDrawer) setIsFilterDrawerOpen(false);
            }}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              filterLowStockOnly
                ? 'bg-amber-100 text-amber-900 border border-amber-300 font-bold'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <AlertTriangle className={`w-3.5 h-3.5 ${filterLowStockOnly ? 'text-amber-700' : 'text-amber-500'}`} />
              <span>Bajo Mínimo</span>
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                filterLowStockOnly
                  ? 'bg-amber-200 text-amber-900'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {lowStockCount}
            </span>
          </button>

          <button
            onClick={() => {
              setFilterWasteOnly(!filterWasteOnly);
              setFilterLowStockOnly(false);
              setFilterZeroWasteOnly(false);
              if (isMobileDrawer) setIsFilterDrawerOpen(false);
            }}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              filterWasteOnly
                ? 'bg-rose-100 text-rose-900 border border-rose-300 font-bold'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <TrendingDown className={`w-3.5 h-3.5 ${filterWasteOnly ? 'text-rose-700' : 'text-rose-500'}`} />
              <span>Con Mermas</span>
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                filterWasteOnly
                  ? 'bg-rose-200 text-rose-900'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {withWasteCount}
            </span>
          </button>

          <button
            onClick={() => {
              setFilterZeroWasteOnly(!filterZeroWasteOnly);
              setFilterLowStockOnly(false);
              setFilterWasteOnly(false);
              if (isMobileDrawer) setIsFilterDrawerOpen(false);
            }}
            className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
              filterZeroWasteOnly
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold'
                : 'text-stone-700 hover:bg-stone-100'
            }`}
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className={`w-3.5 h-3.5 ${filterZeroWasteOnly ? 'text-emerald-700' : 'text-emerald-500'}`} />
              <span>Sin Mermas</span>
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                filterZeroWasteOnly
                  ? 'bg-emerald-200 text-emerald-900'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
            >
              {zeroWasteCount}
            </span>
          </button>
        </div>
      </div>

      {/* Category Selectable Menu */}
      <div className="space-y-1.5 pt-3 border-t border-stone-100">
        <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500 block">
          Categorías
        </label>
        <div className="flex flex-col gap-1 max-h-72 overflow-y-auto pr-1">
          {CATEGORIES.map((cat) => {
            const count = items.filter((i) => cat.id === 'all' || i.category === cat.id).length;
            const isSelected = selectedCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  if (isMobileDrawer) setIsFilterDrawerOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#2B2523] text-white shadow-2xs font-bold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
              >
                <span className="truncate pr-2">{cat.label}</span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2B2523] text-white border border-[#D4A373] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-[#D4A373]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Banner / Dashboard Resumen */}
      <div className="bg-[#2B2523] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-stone-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A373]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A373]/20 border border-[#D4A373]/30 text-[#D4A373] text-xs font-semibold uppercase tracking-wider">
                <Package className="w-3.5 h-3.5 text-[#D4A373]" />
                <span>Gestión de Stock & Existencias · Camas (Sevilla)</span>
              </span>
              <span className="text-stone-400 text-xs">· Inventario en Tiempo Real</span>
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#FAF8F5]">
              Centro de Control de Existencias & Insumos
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Control integral de existencias, aprovisionamiento con proveedores y registro de mermas para cocina y sala.
            </p>
          </div>

          {/* Key Metrics Board */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            {/* Total Insumos */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Total Insumos</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <Package className="w-4 h-4 text-stone-300" />
                <span className="font-serif font-bold text-xl sm:text-2xl text-stone-100">{items.length}</span>
              </div>
            </div>

            {/* Bajo Mínimo */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Bajo Mínimo</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <AlertTriangle className={`w-4 h-4 ${lowStockCount > 0 ? 'text-amber-400' : 'text-stone-500'}`} />
                <span className={`font-serif font-bold text-xl sm:text-2xl ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {lowStockCount}
                </span>
              </div>
            </div>

            {/* Sin Mermas */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Sin Mermas</span>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-serif font-bold text-xl sm:text-2xl text-emerald-300">
                  {zeroWasteCount}
                  <span className="text-xs text-stone-400 font-normal">/{items.length}</span>
                </span>
              </div>
            </div>

            {/* Total Waste Cost */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Pérdida Mermas</span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-rose-400 mt-0.5 block">
                −{totalWasteCost.toFixed(2)}€
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout: Cards Grid (Left) + Sticky Filters Sidebar (Right) */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Column: Mobile action bar + Insumos Cards Grid */}
        <div className="flex-1 w-full min-w-0 space-y-4">
          {/* Mobile/Tablet Bar: Open Filters Drawer + Quick Add */}
          <div className="lg:hidden bg-white rounded-2xl p-3 shadow-xs border border-[#EADBC8] flex items-center justify-between gap-3">
            <button
              onClick={() => setIsFilterDrawerOpen(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4 text-[#9E2A2B]" />
              <span>Filtros & Categorías</span>
              {(filterLowStockOnly || filterWasteOnly || filterZeroWasteOnly || selectedCategory !== 'all' || searchQuery) && (
                <span className="w-2 h-2 rounded-full bg-[#9E2A2B]" />
              )}
            </button>

            <button
              onClick={() => setIsNewItemModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-[#9E2A2B] hover:bg-[#852223] text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Insumo</span>
            </button>
          </div>

          {/* Active Filter Indicators Bar (if filters active) */}
          {(filterLowStockOnly || filterWasteOnly || filterZeroWasteOnly || selectedCategory !== 'all' || searchQuery) && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-amber-800">Filtro activo:</span>
                {searchQuery && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                    "{searchQuery}"
                  </span>
                )}
                {selectedCategory !== 'all' && (
                  <span className="bg-white px-2 py-0.5 rounded-md border border-amber-200 text-[11px]">
                    {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
                  </span>
                )}
                {filterLowStockOnly && (
                  <span className="bg-amber-200/80 px-2 py-0.5 rounded-md text-[11px] font-bold">
                    Bajo Mínimo
                  </span>
                )}
                {filterWasteOnly && (
                  <span className="bg-rose-200/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-rose-900">
                    Con Mermas
                  </span>
                )}
                {filterZeroWasteOnly && (
                  <span className="bg-emerald-200/80 px-2 py-0.5 rounded-md text-[11px] font-bold text-emerald-900">
                    Sin Mermas
                  </span>
                )}
                <span className="text-stone-500 text-[11px]">
                  ({filteredItems.length} insumos)
                </span>
              </div>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setFilterLowStockOnly(false);
                  setFilterWasteOnly(false);
                  setFilterZeroWasteOnly(false);
                }}
                className="text-[11px] font-bold text-[#9E2A2B] hover:underline cursor-pointer shrink-0"
              >
                Limpiar todo
              </button>
            </div>
          )}

          {/* Cards Grid */}
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-[#EADBC8] space-y-3">
              <Package className="w-12 h-12 text-stone-300 mx-auto" />
              <h3 className="font-serif font-bold text-lg text-[#2B2523]">No se encontraron insumos</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                No hay ningún insumo que coincida con los filtros seleccionados. Prueba a restablecer la búsqueda o las categorías.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setFilterLowStockOnly(false);
                  setFilterWasteOnly(false);
                  setFilterZeroWasteOnly(false);
                }}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5">
            {filteredItems.map((item) => {
              const theme = getCardHealthTheme(item.healthStatus);
              const HealthIcon = theme.icon;
              const whatsAppUrl = getQuickWhatsAppUrl(item);
              const assetValue = Number((item.currentStock * item.currentPrice).toFixed(2));

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedCardOverItem(item)}
                  className={`bg-white rounded-3xl border ${theme.border} p-5 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col justify-between gap-4 cursor-pointer group relative overflow-hidden`}
                >
                  {/* Subtle top indicator bar */}
                  <div className={`absolute top-0 inset-x-0 h-1 ${theme.bar}`} />

                  {/* Card Header */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                        {item.category.replace('_', ' ')}
                      </span>

                      {/* Status Badge */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${theme.badge}`}>
                        <HealthIcon className="w-3 h-3" />
                        <span>{theme.label}</span>
                      </span>
                    </div>

                    <div>
                      <h4 className="font-serif font-bold text-lg text-[#2B2523] group-hover:text-[#9E2A2B] transition-colors leading-tight">
                        {item.name}
                      </h4>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Coste: <strong className="text-stone-700">{item.currentPrice.toFixed(2)} €/{item.unit}</strong>
                        {' · '}
                        Valor en despensa: <strong className="text-stone-700">{assetValue.toFixed(2)} €</strong>
                      </p>
                    </div>

                    {/* Stock Level Bar */}
                    <div className="space-y-1 bg-stone-50 p-2.5 rounded-2xl border border-stone-200/70">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-stone-500 font-medium">Nivel de Stock</span>
                        <span className="font-extrabold text-[#2B2523]">{item.currentStock} / {item.minStock} {item.unit}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${theme.bar}`}
                          style={{ width: `${Math.min(100, Math.max(6, item.healthScore))}%` }}
                        />
                      </div>
                    </div>

                    {/* Waste Statistics */}
                    <div className="p-2.5 rounded-2xl border text-xs">
                      {item.totalWasteCost === 0 ? (
                        <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50/70 -m-1 p-2 rounded-xl">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <div className="truncate">
                            <strong className="block text-[11px] font-bold leading-tight">Desperdicio Cero</strong>
                            <span className="text-[10px] text-emerald-700">100% aprovechamiento en servicio</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2 text-rose-900 bg-rose-50/80 -m-1 p-2 rounded-xl border border-rose-200/60">
                          <div className="flex items-center gap-1.5 truncate">
                            <TrendingDown className="w-4 h-4 text-rose-600 shrink-0" />
                            <div className="truncate">
                              <span className="text-[11px] font-bold block leading-tight">
                                Mermas: <span className="text-rose-700">−{item.totalWasteCost.toFixed(2)} €</span>
                              </span>
                              <span className="text-[10px] text-rose-600 truncate block">
                                {item.totalWasteQuantity} {item.unit} ({item.wasteCount} incidencias)
                              </span>
                            </div>
                          </div>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-200 text-rose-900 shrink-0">
                            Merma
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Primary Supplier Box */}
                    <div className="flex items-center justify-between text-[11px] text-stone-600 bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EADBC8]/70">
                      <div className="flex items-center gap-1.5 truncate">
                        <Truck className="w-3.5 h-3.5 text-[#9E2A2B] shrink-0" />
                        <span className="truncate">
                          Proveedor: <strong>{item.primarySupplierName || 'Sin asignar'}</strong>
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 shrink-0">
                        {item.primarySupplierDeliveryDays ? `Entrega: ${item.primarySupplierDeliveryDays}` : '24h'}
                      </span>
                    </div>
                  </div>

                  {/* Card Footer: Quick Actions */}
                  <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                    {/* Quick + / - Adjuster */}
                    <div
                      className="flex items-center gap-1 bg-[#FAF8F5] border border-[#EADBC8] p-1 rounded-xl shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleAdjustQuantity(item, -1)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700 font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Restar 1 unidad"
                      >
                        <Minus className="w-3 h-3" />
                      </button>

                      <button
                        onClick={() => handleAdjustQuantity(item, 1)}
                        className="w-7 h-7 rounded-lg bg-[#9E2A2B] hover:bg-[#852223] text-white flex items-center justify-center font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
                        title="Sumar 1 unidad"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* WhatsApp Quick Trigger if in Danger */}
                    {whatsAppUrl && item.currentStock <= item.minStock && (
                      <a
                        href={whatsAppUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 transition-colors shadow-2xs cursor-pointer shrink-0"
                        title="Pedir reposición por WhatsApp"
                      >
                        <MessageCircle className="w-3 h-3 fill-white" />
                        <span>Pedir</span>
                      </a>
                    )}

                    {/* Card Details Open Action */}
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#9E2A2B] group-hover:translate-x-0.5 transition-transform ml-auto">
                      <span>Ficha Completa</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

        {/* Right Sticky Sidebar (Desktop PC, lg and up) */}
        <div className="hidden lg:flex flex-col w-80 2xl:w-88 shrink-0 sticky top-24 self-start space-y-4">
          {renderFiltersContent(false)}
        </div>
      </div>

      {/* Mobile / Tablet Filter Drawer Sheet */}
      {isFilterDrawerOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 lg:hidden"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div
            className="w-full max-w-xs h-full bg-[#FAF8F5] p-4 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {renderFiltersContent(true)}
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

      {/* Card Over 360 Drawer / Modal */}
      <StaffStockCardOver
        item={selectedCardOverItem}
        isOpen={!!selectedCardOverItem}
        onClose={() => setSelectedCardOverItem(null)}
        onAdjustQuantity={handleAdjustQuantity}
        onLogQuickWaste={handleLogQuickWaste}
        events={events}
        suppliers={suppliers}
      />
    </div>
  );
}
