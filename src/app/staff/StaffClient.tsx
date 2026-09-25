'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Category, Product } from '@/types/menu';
import { updateProductAvailabilityAction, resetCatalogAction } from './actions';
import {
  ShieldCheck,
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  ClipboardList,
  Layers,
  Clock,
  RotateCcw,
  Sparkles,
  ChefHat,
  Beer,
} from 'lucide-react';

interface StaffClientProps {
  initialCategories: Category[];
  initialProducts: Product[];
}

interface MockOrder {
  id: string;
  table: string;
  time: string;
  status: 'PENDING' | 'PREPARING' | 'SERVED';
  items: { name: string; quantity: number; notes?: string }[];
  total: number;
}

const INITIAL_MOCK_ORDERS: MockOrder[] = [
  {
    id: 'ord-101',
    table: 'Mesa 4 (Terraza)',
    time: 'Hace 5 min',
    status: 'PREPARING',
    items: [
      { name: 'Doble Cruzcampo', quantity: 2 },
      { name: 'Ensaladilla Clásica Quimera', quantity: 1 },
      { name: 'Molletito Quimera (Pinchito & Chipi)', quantity: 2, notes: 'Bien tostados' },
    ],
    total: 16.40,
  },
  {
    id: 'ord-102',
    table: 'Barra 2',
    time: 'Hace 2 min',
    status: 'PENDING',
    items: [
      { name: 'Caña Cruzcampo', quantity: 1 },
      { name: 'Gilda Matrimonio', quantity: 2 },
      { name: 'Chicharrón Frito Recién Hecho', quantity: 1 },
    ],
    total: 9.90,
  },
  {
    id: 'ord-103',
    table: 'Mesa 8 (Salón)',
    time: 'Hace 12 min',
    status: 'SERVED',
    items: [
      { name: 'Jamón Ibérico Bellota 100% (100grs)', quantity: 1 },
      { name: 'Queso Payoyo Curado (100grs)', quantity: 1 },
      { name: 'Vino Tinto Rioja Crianza', quantity: 2 },
    ],
    total: 33.50,
  },
];

export default function StaffClient({
  initialCategories,
  initialProducts,
}: StaffClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [orders, setOrders] = useState<MockOrder[]>(INITIAL_MOCK_ORDERS);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleToggleAvailability = (productId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, isAvailable: newStatus } : p))
    );

    startTransition(async () => {
      const res = await updateProductAvailabilityAction(productId, newStatus);
      if (res.success) {
        showNotification(
          `Estado actualizado: "${products.find((p) => p.id === productId)?.name}" ahora está ${
            newStatus ? 'DISPONIBLE' : 'AGOTADO'
          }.`
        );
      }
    });
  };

  const handleResetCatalog = () => {
    if (confirm('¿Restablecer todos los platos a disponibles por defecto?')) {
      startTransition(async () => {
        await resetCatalogAction();
        setProducts(initialProducts.map((p) => ({ ...p, isAvailable: true })));
        showNotification('Catálogo restablecido con éxito.');
      });
    }
  };

  const handleAdvanceOrderStatus = (orderId: string) => {
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord.id !== orderId) return ord;
        if (ord.status === 'PENDING') return { ...ord, status: 'PREPARING' };
        if (ord.status === 'PREPARING') return { ...ord, status: 'SERVED' };
        return ord;
      })
    );
  };

  // Filtered products for staff view
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'all' && p.categoryId !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || p.format.toLowerCase().includes(q);
    }
    return true;
  });

  const totalAvailable = products.filter((p) => p.isAvailable).length;
  const totalUnavailable = products.filter((p) => !p.isAvailable).length;

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col text-[#2B2523]">
      {/* Staff Top Navigation */}
      <header className="bg-[#2B2523] text-white border-b border-stone-800 sticky top-0 z-30 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-amber-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Carta Clientes</span>
            </Link>
            <div className="h-4 w-px bg-stone-700 hidden sm:block" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4A373]" />
              <span className="font-serif font-bold tracking-wider uppercase text-sm sm:text-base">
                Quimera Staff & Barra
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-4 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
              Disponibles: <strong>{totalAvailable}</strong>
            </span>
            <span className="px-2.5 py-1 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800 font-medium">
              Agotados: <strong>{totalUnavailable}</strong>
            </span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 text-sm font-medium border-t border-stone-800">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'inventory'
                ? 'border-[#D4A373] text-[#D4A373]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Control de Disponibilidad ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-[#D4A373] text-[#D4A373]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Comandas en Curso ({orders.filter((o) => o.status !== 'SERVED').length})</span>
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#2B2523] text-white border border-[#D4A373] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3">
          <Sparkles className="w-4 h-4 text-[#D4A373]" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'inventory' ? (
          <div className="space-y-6">
            {/* Filter and Actions Bar */}
            <div className="bg-white p-4 rounded-xl border border-[#EADBC8] shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#6E6259] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Buscar producto por nombre o formato para cambiar estado..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#EADBC8] text-sm text-[#2B2523] placeholder-[#6E6259]/70 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                />
              </div>

              {/* Reset Action */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleResetCatalog}
                  disabled={isPending}
                  className="px-3.5 py-2 rounded-lg border border-[#EADBC8] text-xs font-semibold text-[#6E6259] hover:bg-stone-50 hover:text-[#2B2523] transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer todo a disponible</span>
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-[#9E2A2B] text-white'
                    : 'bg-white border border-[#EADBC8] text-[#2B2523] hover:border-[#D4A373]'
                }`}
              >
                Todas las categorías ({products.length})
              </button>
              {initialCategories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-colors ${
                    selectedCategory === c.id
                      ? 'bg-[#9E2A2B] text-white'
                      : 'bg-white border border-[#EADBC8] text-[#2B2523] hover:border-[#D4A373]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Product Toggle Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const category = initialCategories.find((c) => c.id === product.categoryId);

                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-xl border transition-all bg-white flex flex-col justify-between gap-3 ${
                      product.isAvailable
                        ? 'border-[#EADBC8] hover:border-emerald-300'
                        : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6259]">
                            {category?.name || 'General'} · {product.format}
                          </span>
                          <h4 className="font-serif font-bold text-base text-[#2B2523]">
                            {product.name}
                          </h4>
                        </div>
                        <span className="font-sans font-bold text-[#9E2A2B] text-sm shrink-0">
                          {product.price.toFixed(2)}€
                        </span>
                      </div>

                      <p className="text-xs text-[#6E6259] line-clamp-1 mt-1">
                        {product.description}
                      </p>
                    </div>

                    {/* Touch Friendly Big Toggle Button */}
                    <div className="pt-2 border-t border-[#EADBC8]/70 flex items-center justify-between">
                      <span className="text-xs text-[#6E6259]">
                        Estado en carta:
                      </span>

                      <button
                        onClick={() => handleToggleAvailability(product.id, product.isAvailable)}
                        disabled={isPending}
                        className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 ${
                          product.isAvailable
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                        }`}
                      >
                        {product.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Disponible</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Agotado</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Orders Board */
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif text-2xl font-bold text-[#2B2523]">
                  Panel de Comandas Activas
                </h3>
                <p className="text-xs text-[#6E6259]">
                  Seguimiento visual para cocina y barra de bebidas.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Servicio en directo
                </span>
              </div>
            </div>

            {/* Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {orders.map((order) => {
                const isPending = order.status === 'PENDING';
                const isPreparing = order.status === 'PREPARING';
                const isServed = order.status === 'SERVED';

                return (
                  <div
                    key={order.id}
                    className={`rounded-2xl border p-5 bg-white shadow-xs flex flex-col justify-between gap-4 ${
                      isPending
                        ? 'border-amber-300 ring-2 ring-amber-100'
                        : isPreparing
                        ? 'border-blue-300 ring-2 ring-blue-100'
                        : 'border-stone-200 opacity-60'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <span className="font-serif font-bold text-lg text-[#2B2523]">
                          {order.table}
                        </span>
                        <span className="text-[11px] font-medium text-[#6E6259] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {order.time}
                        </span>
                      </div>

                      {/* Status Pill */}
                      <div>
                        {isPending && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
                            ● Pendiente de Cocina
                          </span>
                        )}
                        {isPreparing && (
                          <span className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-900 text-xs font-bold uppercase tracking-wider flex items-center gap-1 w-fit">
                            <ChefHat className="w-3.5 h-3.5" />
                            En Preparación
                          </span>
                        )}
                        {isServed && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold uppercase tracking-wider">
                            ✓ Servido en Mesa
                          </span>
                        )}
                      </div>

                      {/* Items List */}
                      <div className="border-t border-b border-stone-100 py-3 space-y-2">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <span className="font-medium text-[#2B2523]">
                              <strong className="text-[#9E2A2B] mr-1.5">{it.quantity}x</strong>
                              {it.name}
                              {it.notes && (
                                <span className="block text-[11px] text-amber-700 italic">
                                  Nota: {it.notes}
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center text-xs font-bold text-[#2B2523]">
                        <span>Total Comanda:</span>
                        <span className="text-sm text-[#9E2A2B]">{order.total.toFixed(2)}€</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div>
                      {!isServed ? (
                        <button
                          onClick={() => handleAdvanceOrderStatus(order.id)}
                          className="w-full py-2.5 rounded-xl bg-[#2B2523] hover:bg-[#9E2A2B] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                        >
                          {isPending ? 'Pasar a "En Preparación" →' : 'Marcar como "Servido" ✓'}
                        </button>
                      ) : (
                        <div className="text-center py-2 text-xs font-semibold text-stone-400">
                          Comanda completada
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
