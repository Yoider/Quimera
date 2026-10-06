'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { Category, Product } from '@/types/menu';
import { Worker } from '@/lib/schedule/types';
import { updateProductAvailabilityAction, resetCatalogAction, deleteProductAction } from './actions';
import StaffWorkersView from './StaffWorkersView';
import StaffScheduleView from './StaffScheduleView';
import StaffProductModal from './StaffProductModal';
import { StaffDataModelView } from './StaffDataModelView';
import StaffStockView from './StaffStockView';
import StaffFloorPlanView from './StaffFloorPlanView';
import StaffOrdersKanbanView from './StaffOrdersKanbanView';
import StaffWaiterPdaModal from './StaffWaiterPdaModal';
import {
  RestaurantTableData,
  ActiveOrderData,
  getRestaurantTablesAction,
  getActiveOrdersAction,
} from './orderActions';
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
  Database,
  Package,
  Menu,
  X,
  ChevronRight,
  MoreHorizontal,
  SlidersHorizontal,
  MapPin,
  LayoutGrid,
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
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders' | 'workers' | 'schedule' | 'datamodel' | 'stock'>('inventory');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMoreSheetOpen, setIsMoreSheetOpen] = useState(false);
  const [orders, setOrders] = useState<MockOrder[]>(INITIAL_MOCK_ORDERS);
  const [restaurantTables, setRestaurantTables] = useState<RestaurantTableData[]>([]);
  const [activeOrdersList, setActiveOrdersList] = useState<ActiveOrderData[]>([]);
  const [ordersViewMode, setOrdersViewMode] = useState<'floor' | 'kanban'>('floor');
  const [selectedTableForPda, setSelectedTableForPda] = useState<RestaurantTableData | null>(null);
  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<string | null>(null);

  const loadTablesAndOrders = async () => {
    try {
      const [tablesRes, ordersRes] = await Promise.all([
        getRestaurantTablesAction(),
        getActiveOrdersAction(),
      ]);
      setRestaurantTables(tablesRes);
      setActiveOrdersList(ordersRes);
    } catch (err) {
      console.error('Error loading tables and orders:', err);
    }
  };

  useEffect(() => {
    loadTablesAndOrders();
  }, []);

  // Close sidebar or more sheet on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSidebarOpen(false);
        setIsMoreSheetOpen(false);
        setSelectedTableForPda(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    {
      id: 'inventory' as const,
      title: 'Control de Disponibilidad',
      description: 'Gestión de platos, fotos, precios y alérgenos',
      icon: Layers,
      badge: `${products.length}`,
      badgeClass: 'bg-stone-100 text-stone-700 border border-stone-200',
    },
    {
      id: 'orders' as const,
      title: 'Comandas en Curso',
      description: 'Plano 2D, mesas, PDA de camareros y cocina',
      icon: ClipboardList,
      badge: `${activeOrdersList.length}`,
      badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300',
    },
    {
      id: 'workers' as const,
      title: 'Gestión de Plantilla',
      description: 'Personal, roles, turnos y preferencias',
      icon: Users,
      badge: `${workers.length}`,
      badgeClass: 'bg-stone-100 text-stone-700 border border-stone-200',
    },
    {
      id: 'schedule' as const,
      title: 'Cuadrante de Horarios',
      description: 'Planificación semanal con algoritmo IA y PDF',
      icon: Calendar,
      badge: 'IA',
      badgeClass: 'bg-amber-50 text-[#9E2A2B] border border-amber-300 font-bold',
    },
    {
      id: 'stock' as const,
      title: 'Stock & Proveedores',
      description: 'Existencias, pedidos WhatsApp, mermas y eventos',
      icon: Package,
      badge: 'Excel',
      badgeClass: 'bg-emerald-50 text-emerald-800 border border-emerald-300',
    },
    {
      id: 'datamodel' as const,
      title: 'Modelo de Datos Relacional',
      description: 'Lienzo canvas interactivo de tablas y relaciones',
      icon: Database,
      badge: 'Canvas',
      badgeClass: 'bg-purple-50 text-purple-800 border border-purple-300',
    },
  ];

  const currentNav = navItems.find((n) => n.id === activeTab) || navItems[0];
  const CurrentNavIcon = currentNav.icon;

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

  const renderNavSidebar = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white text-[#2B2523]">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-[#EADBC8] bg-[#FAF8F5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#9E2A2B] text-amber-100 flex items-center justify-center font-serif font-bold text-lg shadow-xs border border-[#D4A373]/30 shrink-0">
            Q
          </div>
          <div className="min-w-0">
            <h2 className="font-serif font-bold text-sm tracking-wider uppercase text-[#2B2523] leading-none truncate">
              Taberna Quimera
            </h2>
            <span className="text-[10px] tracking-wider text-[#9E2A2B] uppercase font-semibold block mt-1 truncate">
              Panel de Staff · Camas
            </span>
          </div>
        </div>
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#2B2523] hover:bg-stone-100 transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar barra lateral"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modules List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
        <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider uppercase text-stone-400">
          Módulos de Gestión
        </div>

        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (isMobile) setIsSidebarOpen(false);
              }}
              className={`w-full text-left p-3 rounded-2xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-[#9E2A2B] text-white shadow-md border border-[#9E2A2B]'
                  : 'hover:bg-[#FAF8F5] text-[#2B2523] border border-transparent hover:border-[#EADBC8]/70'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 group-hover:text-[#9E2A2B] group-hover:bg-[#9E2A2B]/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-[#2B2523]'}`}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isActive ? 'bg-white/25 text-white' : item.badgeClass
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[11px] truncate mt-0.5 ${isActive ? 'text-white/80' : 'text-stone-500'}`}>
                    {item.description}
                  </p>
                </div>
              </div>

              <ChevronRight
                className={`w-4 h-4 shrink-0 transition-transform ${
                  isActive ? 'text-amber-200 translate-x-0.5' : 'text-stone-300 group-hover:text-stone-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3.5 border-t border-[#EADBC8] bg-[#FAF8F5] space-y-2.5 shrink-0">
        <div className="flex items-center justify-between text-[11px] text-stone-500 px-1">
          <span>Gestión Operativa</span>
          <span className="text-[#9E2A2B] font-semibold bg-white px-2 py-0.5 rounded-md border border-[#EADBC8]">
            v2.4 Activa
          </span>
        </div>
        <Link
          href="/"
          onClick={() => {
            if (isMobile) setIsSidebarOpen(false);
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white hover:bg-stone-50 text-[#2B2523] border border-[#EADBC8] text-xs font-semibold transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#9E2A2B]" />
          <span>Volver a la Carta Pública</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] flex flex-col lg:flex-row text-[#2B2523]">
      {/* Permanent Left Sidebar on Desktop (PC): Light Background with Prominent Shadow */}
      <aside className="hidden lg:flex flex-col w-72 2xl:w-80 shrink-0 bg-white border-r border-[#EADBC8] sticky top-0 h-screen z-30 shadow-2xl">
        {renderNavSidebar(false)}
      </aside>

      {/* Backdrop overlay for Mobile Drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Drawer (Left-to-Right) on < lg: Light Background */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-80 sm:w-88 bg-white border-r border-[#EADBC8] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderNavSidebar(true)}
      </aside>

      {/* Main Area: Top Bar + Active Module View */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Staff Top Navigation Bar */}
        <header className="w-full bg-[#2B2523] text-white border-b border-stone-800 sticky top-0 z-20 shadow-md">
          <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
            {/* Left section: Drawer trigger on mobile/tablet, hidden on desktop */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile/Tablet Drawer button (hidden on desktop lg where sidebar is always visible) */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-[#D4A373]/20 hover:text-[#D4A373] text-stone-200 border border-stone-700 font-semibold text-xs transition-all cursor-pointer shadow-xs active:scale-95"
                aria-label="Abrir menú de gestión"
              >
                <Menu className="w-4 h-4 text-[#D4A373]" />
                <span className="font-semibold tracking-wide text-xs">Menú</span>
              </button>

              {/* Mobile Brand Emblema on < lg */}
              <div className="lg:hidden flex items-center gap-1.5">
                <div className="w-7 h-7 rounded-lg bg-[#9E2A2B] text-amber-100 flex items-center justify-center font-serif font-bold text-xs shadow-xs border border-[#D4A373]/40">
                  Q
                </div>
                <span className="font-serif font-bold text-[11px] uppercase tracking-wider text-stone-200 sm:inline hidden">
                  Quimera
                </span>
              </div>

              <div className="h-5 w-px bg-stone-700 hidden sm:block" />

              {/* Current Active Module Breadcrumb */}
              <div className="flex items-center gap-1.5">
                <span className="text-stone-400 text-xs hidden sm:inline">Módulo:</span>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-800/90 border border-stone-700 text-xs font-semibold text-[#D4A373]">
                  <CurrentNavIcon className="w-3.5 h-3.5 text-[#D4A373]" />
                  <span className="truncate max-w-[140px] sm:max-w-none">{currentNav.title}</span>
                  {currentNav.badge && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${currentNav.badgeClass}`}>
                      {currentNav.badge}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right section: Quick Metrics + Back to Public Menu */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs">
                <span className="px-2 py-0.5 sm:py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-medium">
                  <span className="hidden sm:inline">Disponibles:</span><span className="sm:hidden">Disp:</span> <strong>{totalAvailable}</strong>
                </span>
                <span className="px-2 py-0.5 sm:py-1 rounded-md bg-rose-950/80 text-rose-300 border border-rose-800 font-medium">
                  <span className="hidden sm:inline">Agotados:</span><span className="sm:hidden">Agot:</span> <strong>{totalUnavailable}</strong>
                </span>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-amber-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Ver Carta</span>
              </Link>
            </div>
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
      <main className="flex-1 max-w-7xl 2xl:max-w-[1600px] mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8">
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
          /* General Floor Plan & Orders Suite */
          <div className="space-y-5">
            {/* Top Toolbar */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EADBC8] shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#2B2523] flex items-center gap-2">
                  <span>Gestión de Sala, Mesas & Comandas</span>
                  <span className="text-xs font-sans font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    En Directo
                  </span>
                </h3>
                <p className="text-xs text-[#6E6259] mt-0.5">
                  Plano 2D del bar en Camas, asignación de pedidos en mesa con PDA y tablero kanban.
                </p>
              </div>

              {/* View Switcher: Plano 2D vs Kanban */}
              <div className="flex items-center gap-2 bg-[#FAF8F5] p-1.5 rounded-2xl border border-[#EADBC8]">
                <button
                  type="button"
                  onClick={() => setOrdersViewMode('floor')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    ordersViewMode === 'floor'
                      ? 'bg-[#9E2A2B] text-white shadow-xs'
                      : 'text-stone-600 hover:text-[#2B2523] hover:bg-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Plano 2D del Bar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setOrdersViewMode('kanban')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    ordersViewMode === 'kanban'
                      ? 'bg-[#9E2A2B] text-white shadow-xs'
                      : 'text-stone-600 hover:text-[#2B2523] hover:bg-white'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tablero Kanban ({activeOrdersList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={loadTablesAndOrders}
                  className="p-2 rounded-xl text-stone-400 hover:text-[#2B2523] hover:bg-white transition-colors cursor-pointer"
                  title="Actualizar mesas y comandas"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* View Mode Rendering */}
            {ordersViewMode === 'floor' ? (
              <StaffFloorPlanView
                tables={restaurantTables}
                orders={activeOrdersList}
                onSelectTable={(table) => setSelectedTableForPda(table)}
                onRefreshData={loadTablesAndOrders}
              />
            ) : (
              <StaffOrdersKanbanView
                orders={activeOrdersList}
                tables={restaurantTables}
                onOpenPda={(table) => setSelectedTableForPda(table)}
                onRefreshData={loadTablesAndOrders}
              />
            )}

            {/* Waiter PDA Modal */}
            {selectedTableForPda && (
              <StaffWaiterPdaModal
                isOpen={true}
                onClose={() => setSelectedTableForPda(null)}
                table={selectedTableForPda}
                activeOrder={
                  activeOrdersList.find(
                    (o) => o.tableNumber === selectedTableForPda.tableNumber
                  ) || null
                }
                products={products}
                categories={initialCategories}
                onOrderSaved={loadTablesAndOrders}
              />
            )}
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

        {/* Stock & Suppliers View */}
        {activeTab === 'stock' && (
          <StaffStockView />
        )}

        {/* Relational Data Model View */}
        {activeTab === 'datamodel' && (
          <StaffDataModelView />
        )}
      </main>
    </div>

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

      {/* Delete Product Confirmation Modal (Bottom Sheet on mobile, centered on desktop) */}
      {productToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => !isPending && setProductToDelete(null)}
        >
          <div
            className="w-full max-w-md bg-white max-sm:rounded-t-3xl max-sm:rounded-b-none sm:rounded-2xl border border-rose-200 shadow-2xl p-6 space-y-4 max-sm:fixed max-sm:bottom-0 max-sm:inset-x-0 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Pull Handle */}
            <div className="sm:hidden w-12 h-1.5 bg-stone-300 rounded-full mx-auto -mt-2 mb-2" />

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
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => handleDeleteProduct(productToDelete.id)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isPending ? 'Eliminando...' : 'Sí, eliminar plato'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Native Bottom Navigation Bar (Fixed at bottom on phones/tablets) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#1E1917]/95 backdrop-blur-md border-t border-stone-800 shadow-2xl px-2 py-1.5 flex items-center justify-around safe-bottom">
        <button
          onClick={() => {
            setActiveTab('inventory');
            setIsMoreSheetOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
            activeTab === 'inventory' ? 'text-[#D4A373]' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 rounded-full text-[9px] font-bold bg-[#9E2A2B] text-white">
              {products.length}
            </span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Carta</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('orders');
            setIsMoreSheetOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
            activeTab === 'orders' ? 'text-[#D4A373]' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="relative">
            <ClipboardList className="w-5 h-5" />
            {orders.filter((o) => o.status !== 'SERVED').length > 0 && (
              <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-600 text-white animate-pulse">
                {orders.filter((o) => o.status !== 'SERVED').length}
              </span>
            )}
          </div>
          <span className="text-[10px] font-semibold mt-1">Comandas</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('stock');
            setIsMoreSheetOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
            activeTab === 'stock' ? 'text-[#D4A373]' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="relative">
            <Package className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2.5 px-1 py-0.2 rounded-full text-[8px] font-bold bg-emerald-600 text-white">
              Stock
            </span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Stock</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('schedule');
            setIsMoreSheetOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
            activeTab === 'schedule' ? 'text-[#D4A373]' : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="relative">
            <Calendar className="w-5 h-5" />
            <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full text-[8px] font-bold bg-gradient-to-r from-amber-500 to-[#9E2A2B] text-white">
              IA
            </span>
          </div>
          <span className="text-[10px] font-semibold mt-1">Horarios</span>
        </button>

        <button
          onClick={() => setIsMoreSheetOpen(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all active:scale-90 ${
            isMoreSheetOpen || activeTab === 'workers' || activeTab === 'datamodel'
              ? 'text-[#D4A373]'
              : 'text-stone-400 hover:text-stone-200'
          }`}
        >
          <div className="relative">
            <MoreHorizontal className="w-5 h-5" />
            {(activeTab === 'workers' || activeTab === 'datamodel') && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#D4A373]" />
            )}
          </div>
          <span className="text-[10px] font-semibold mt-1">Más</span>
        </button>
      </nav>

      {/* Mobile Bottom Sheet "Más Módulos" (Light Theme) */}
      {isMoreSheetOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col justify-end animate-in fade-in duration-200"
          onClick={() => setIsMoreSheetOpen(false)}
        >
          <div
            className="w-full bg-white text-[#2B2523] rounded-t-3xl border-t border-[#EADBC8] shadow-2xl p-5 pb-8 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pull Handle */}
            <div className="w-12 h-1.5 bg-stone-300 rounded-full mx-auto" />

            <div className="flex items-center justify-between pt-1 border-b border-[#EADBC8] pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-[#2B2523]">
                  Más Módulos & Gestión
                </h3>
                <p className="text-[11px] text-[#9E2A2B] font-semibold">
                  Panel de Taberna Quimera · Camas
                </p>
              </div>
              <button
                onClick={() => setIsMoreSheetOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-[#2B2523] hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 pt-1">
              <button
                onClick={() => {
                  setActiveTab('workers');
                  setIsMoreSheetOpen(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition-all active:scale-98 ${
                  activeTab === 'workers'
                    ? 'bg-[#9E2A2B] border-[#9E2A2B] text-white shadow-sm'
                    : 'bg-[#FAF8F5] border-[#EADBC8] text-[#2B2523] hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeTab === 'workers' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm block">Gestión de Plantilla</span>
                    <span className={`text-[11px] ${activeTab === 'workers' ? 'text-white/80' : 'text-stone-500'}`}>Equipo, roles, turnos y horas</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'workers' ? 'bg-white/20 text-white' : 'bg-stone-200 text-stone-700'
                }`}>
                  {workers.length}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('datamodel');
                  setIsMoreSheetOpen(false);
                }}
                className={`w-full p-3.5 rounded-2xl flex items-center justify-between border transition-all active:scale-98 ${
                  activeTab === 'datamodel'
                    ? 'bg-[#9E2A2B] border-[#9E2A2B] text-white shadow-sm'
                    : 'bg-[#FAF8F5] border-[#EADBC8] text-[#2B2523] hover:bg-stone-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeTab === 'datamodel' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-600'
                  }`}>
                    <Database className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <span className="font-semibold text-sm block">Modelo de Datos (ERD)</span>
                    <span className={`text-[11px] ${activeTab === 'datamodel' ? 'text-white/80' : 'text-stone-500'}`}>Lienzo interactivo Canvas</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  activeTab === 'datamodel' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700 border border-purple-200'
                }`}>
                  Canvas
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-[#EADBC8] space-y-2">
              <Link
                href="/"
                onClick={() => setIsMoreSheetOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 text-[#2B2523] border border-[#EADBC8] text-xs font-semibold transition-colors active:scale-98"
              >
                <ArrowLeft className="w-4 h-4 text-[#9E2A2B]" />
                <span>Volver a la Carta Pública</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
