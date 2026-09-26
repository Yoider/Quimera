'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { Category, Product } from '@/types/menu';
import { Worker } from '@/lib/schedule/types';
import { updateProductAvailabilityAction, resetCatalogAction, deleteProductAction } from './actions';
import StaffWorkersView from './StaffWorkersView';
import StaffScheduleView from './StaffScheduleView';
import StaffProductModal from './StaffProductModal';
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
  Users,
  Calendar,
  Edit2,
  Plus,
  Trash2,
  AlertTriangle,
} from 'lucide-react';

interface StaffClientProps {
  initialCategories: Category[];
  initialProducts: Product[];
  initialWorkers: Worker[];
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
  initialWorkers,
}: StaffClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'workers' | 'schedule'>('inventory');
  const [orders, setOrders] = useState<MockOrder[]>(INITIAL_MOCK_ORDERS);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<string | null>(null);

  // Product management modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleProductSaved = (saved: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      } else {
        return [saved, ...prev];
      }
    });
    showNotification(`Plato "${saved.name}" guardado correctamente.`);
  };

  const handleDeleteProduct = (productId: string) => {
    startTransition(async () => {
      const target = products.find((p) => p.id === productId);
      const res = await deleteProductAction(productId);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        setProductToDelete(null);
        if (editingProduct?.id === productId) setEditingProduct(null);
        showNotification(`Plato "${target?.name || ''}" eliminado de la carta.`);
      } else {
        alert('Error al eliminar el plato de la base de datos.');
      }
    });
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 text-sm font-medium border-t border-stone-800 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`py-3 flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
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
            className={`py-3 flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
              activeTab === 'orders'
                ? 'border-[#D4A373] text-[#D4A373]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            <span>Comandas en Curso ({orders.filter((o) => o.status !== 'SERVED').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('workers')}
            className={`py-3 flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
              activeTab === 'workers'
                ? 'border-[#D4A373] text-[#D4A373]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gestión de Plantilla ({workers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`py-3 flex items-center gap-2 border-b-2 shrink-0 transition-colors ${
              activeTab === 'schedule'
                ? 'border-[#D4A373] text-[#D4A373]'
                : 'border-transparent text-stone-400 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="flex items-center gap-1.5">
              Cuadrante de Horarios
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-gradient-to-r from-amber-500 to-[#9E2A2B] text-white font-bold tracking-wider uppercase">
                IA
              </span>
            </span>
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
        {activeTab === 'inventory' && (
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

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setIsCreateProductModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Plato</span>
                </button>

                <button
                  onClick={handleResetCatalog}
                  disabled={isPending}
                  className="px-3.5 py-2 rounded-xl border border-[#EADBC8] text-xs font-semibold text-[#6E6259] hover:bg-stone-50 hover:text-[#2B2523] transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer todo</span>
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

            {/* Product Toggle & Edit Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const category = initialCategories.find((c) => c.id === product.categoryId);

                return (
                  <div
                    key={product.id}
                    className={`p-4 rounded-2xl border transition-all bg-white flex flex-col justify-between gap-3 shadow-2xs ${
                      product.isAvailable
                        ? 'border-[#EADBC8] hover:border-[#D4A373]'
                        : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3">
                        {/* Thumbnail image with fallback */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative shadow-2xs">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6259] truncate block">
                              {category?.name || 'General'} · <strong className="text-[#9E2A2B]">{product.format}</strong>
                            </span>
                            <span className="font-sans font-bold text-[#9E2A2B] text-sm shrink-0">
                              {product.price.toFixed(2)}€
                            </span>
                          </div>

                          <h4 className="font-serif font-bold text-base text-[#2B2523] leading-snug line-clamp-1">
                            {product.name}
                          </h4>

                          {product.badge && (
                            <span className="inline-block mt-0.5 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              {product.badge}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-[#6E6259] line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    {/* Touch Friendly Action Buttons */}
                    <div className="pt-2 border-t border-[#EADBC8]/70 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleAvailability(product.id, product.isAvailable)}
                        disabled={isPending}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                          product.isAvailable
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                        title={product.isAvailable ? 'Marcar como agotado' : 'Marcar como disponible'}
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

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 rounded-lg border border-[#EADBC8] hover:border-[#9E2A2B] text-[#9E2A2B] hover:bg-[#9E2A2B]/10 text-xs font-semibold transition-colors cursor-pointer"
                          title="Modificar foto, descripción, precio o formato"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setProductToDelete(product)}
                          className="p-1.5 rounded-lg border border-stone-200 hover:border-rose-400 text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                          title="Eliminar plato de la carta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
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

        {/* Workers Roster View */}
        {activeTab === 'workers' && (
          <StaffWorkersView
            initialWorkers={workers}
            onWorkersChange={setWorkers}
          />
        )}

        {/* Weekly Schedule View */}
        {activeTab === 'schedule' && (
          <StaffScheduleView workers={workers} />
        )}
      </main>

      {/* Product Edit / Create Modal */}
      {(editingProduct || isCreateProductModalOpen) && (
        <StaffProductModal
          isOpen={!!editingProduct || isCreateProductModalOpen}
          mode={editingProduct ? 'edit' : 'create'}
          product={editingProduct}
          categories={initialCategories}
          onClose={() => {
            setEditingProduct(null);
            setIsCreateProductModalOpen(false);
          }}
          onSave={handleProductSaved}
          onRequestDelete={(prod) => {
            setEditingProduct(null);
            setProductToDelete(prod);
          }}
        />
      )}

      {/* Delete Product Confirmation Modal */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isPending && setProductToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl border border-rose-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif font-bold text-lg text-[#2B2523]">
                  ¿Eliminar plato de la carta?
                </h3>
                <p className="text-xs text-[#6E6259] leading-relaxed">
                  ¿Estás seguro de que deseas eliminar permanentemente{' '}
                  <strong className="text-[#2B2523]">{productToDelete.name}</strong> ({productToDelete.format} · {productToDelete.price.toFixed(2)}€)?
                </p>
              </div>
            </div>

            <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl text-[11px] text-rose-800 space-y-1">
              <p>⚠️ <strong>Atención:</strong> Esta acción no se puede deshacer.</p>
              <p>El plato será eliminado de la base de datos y desaparecerá de la carta para los comensales.</p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDeleteProduct(productToDelete.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPending ? 'Eliminando...' : 'Sí, eliminar plato'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
