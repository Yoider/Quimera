'use client';

import React, { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { Category, Product } from '@/types/menu';
import { Worker } from '@/lib/schedule/types';
import {
  updateProductAvailabilityAction,
  updateBatchAvailabilityAction,
  resetCatalogAction,
  deleteProductAction,
} from './actions';
import { enrichProductWithTaxonomy } from '@/data/taxonomyMenu';
import StaffProductTreeSidebar, { SelectedTreeNode } from './StaffProductTreeSidebar';
import TaxonomyIcon from './TaxonomyIcon';
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
  FolderOpen,
  Tag,
  Power,
  ChevronDown,
  ChevronUp,
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
  const [products, setProducts] = useState<Product[]>(() =>
    initialProducts.map(enrichProductWithTaxonomy)
  );
  const [workers, setWorkers] = useState<Worker[]>(initialWorkers);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTreeSidebarOpen, setIsTreeSidebarOpen] = useState(true);
  const [isMobileTreeDrawerOpen, setIsMobileTreeDrawerOpen] = useState(false);
  const [selectedTreeNode, setSelectedTreeNode] = useState<SelectedTreeNode>({
    type: 'all',
    label: 'Todas las Categorías',
  });
  const [collapsedSubgroups, setCollapsedSubgroups] = useState<Record<string, boolean>>({});
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
    const enriched = enrichProductWithTaxonomy(saved);
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === enriched.id);
      if (exists) {
        return prev.map((p) => (p.id === enriched.id ? enriched : p));
      } else {
        return [enriched, ...prev];
      }
    });
    showNotification(`Plato "${enriched.name}" guardado correctamente.`);
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

  const handleBatchToggleAvailability = (productIds: string[], targetStatus: boolean) => {
    if (productIds.length === 0) return;

    setProducts((prev) =>
      prev.map((p) => (productIds.includes(p.id) ? { ...p, isAvailable: targetStatus } : p))
    );

    startTransition(async () => {
      const res = await updateBatchAvailabilityAction(productIds, targetStatus);
      if (res.success) {
        showNotification(
          `Lote actualizado (${productIds.length} productos): ahora están ${
            targetStatus ? 'DISPONIBLES' : 'AGOTADOS'
          }.`
        );
      }
    });
  };

  const handleResetCatalog = () => {
    if (confirm('¿Restablecer todos los platos a disponibles por defecto?')) {
      startTransition(async () => {
        await resetCatalogAction();
        setProducts(initialProducts.map((p) => enrichProductWithTaxonomy({ ...p, isAvailable: true })));
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

  // Filtered products for staff view by search and IDE tree selection
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesFormat = p.format.toLowerCase().includes(q);
        const matchesSubtype = (p.subtype || '').toLowerCase().includes(q);
        const matchesTags = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesFormat && !matchesSubtype && !matchesTags) {
          return false;
        }
      }

      // 2. Tree Node Selection
      if (selectedTreeNode.type === 'category') {
        return p.categoryId === selectedTreeNode.categoryId;
      }
      if (selectedTreeNode.type === 'subtype') {
        return (
          p.categoryId === selectedTreeNode.categoryId &&
          p.subtype === selectedTreeNode.subtypeName
        );
      }
      if (selectedTreeNode.type === 'tag') {
        return (
          p.categoryId === selectedTreeNode.categoryId &&
          p.subtype === selectedTreeNode.subtypeName &&
          (p.tags || []).includes(selectedTreeNode.tag || '')
        );
      }
      return true;
    });
  }, [products, searchQuery, selectedTreeNode]);

  // Group filtered products by Category and Subtype
  const groupedSubgroups = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        categoryId: string;
        categoryName: string;
        categoryIcon: string;
        subtypeName: string;
        products: Product[];
        allTags: string[];
      }
    >();

    for (const prod of filteredProducts) {
      const cat = initialCategories.find((c) => c.id === prod.categoryId);
      const catName = cat?.name || 'General';
      const catIcon = cat?.icon || 'Utensils';
      const subName = prod.subtype || 'General';
      const groupKey = `${prod.categoryId}-${subName}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          categoryId: prod.categoryId,
          categoryName: catName,
          categoryIcon: catIcon,
          subtypeName: subName,
          products: [],
          allTags: [],
        });
      }

      const group = map.get(groupKey)!;
      group.products.push(prod);
      for (const t of prod.tags || []) {
        if (!group.allTags.includes(t)) {
          group.allTags.push(t);
        }
      }
    }

    return Array.from(map.values());
  }, [filteredProducts, initialCategories]);

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
      <div className="flex-1 overflow-y-auto p-2 sm:p-2.5 space-y-1 custom-scrollbar">
        <div className="px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase text-stone-400">
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
              className={`w-full text-left py-2 px-2.5 rounded-xl transition-all duration-200 flex items-center justify-between group cursor-pointer ${
                isActive
                  ? 'bg-[#9E2A2B] text-white shadow-md border border-[#9E2A2B]'
                  : 'hover:bg-[#FAF8F5] text-[#2B2523] border border-transparent hover:border-[#EADBC8]/70'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white shadow-xs'
                      : 'bg-stone-100 text-stone-600 group-hover:text-[#9E2A2B] group-hover:bg-[#9E2A2B]/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-semibold truncate ${isActive ? 'text-white' : 'text-[#2B2523]'}`}>
                      {item.title}
                    </span>
                    {item.badge && (
                      <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-bold ${
                        isActive ? 'bg-white/25 text-white' : item.badgeClass
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] truncate leading-tight ${isActive ? 'text-white/80' : 'text-stone-500'}`}>
                    {item.description}
                  </p>
                </div>
              </div>

              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isActive ? 'text-amber-200 translate-x-0.5' : 'text-stone-300 group-hover:text-stone-500'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Sidebar Footer (Bottom Left Info) */}
      <div className="p-2.5 sm:p-3 border-t border-[#EADBC8] bg-[#FAF8F5] space-y-1.5 shrink-0">
        <div className="flex items-center justify-between text-[10.5px] text-stone-500 px-1">
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
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white hover:bg-stone-50 text-[#2B2523] border border-[#EADBC8] text-xs font-semibold transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-[#9E2A2B]" />
          <span>Volver a la Carta Pública</span>
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className={`w-full bg-[#FAF8F5] flex flex-col lg:flex-row text-[#2B2523] ${
        activeTab === 'orders' ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Permanent Left Sidebar on Desktop (PC): Light Background with Prominent Shadow */}
      <aside
        className={`hidden lg:flex flex-col w-64 2xl:w-72 shrink-0 bg-white border-r border-[#EADBC8] z-30 shadow-2xl ${
          activeTab === 'orders' ? 'h-full overflow-hidden' : 'sticky top-0 h-screen'
        }`}
      >
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-76 sm:w-80 bg-white border-r border-[#EADBC8] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderNavSidebar(true)}
      </aside>

      {/* Main Area: Top Bar + Active Module View */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          activeTab === 'orders' ? 'h-full overflow-hidden' : ''
        }`}
      >
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
      <main
        className={`flex-1 min-h-0 w-full mx-auto ${
          activeTab === 'orders'
            ? 'h-full max-w-[1600px] px-3 sm:px-4 lg:px-6 py-2 flex flex-col overflow-hidden'
            : 'max-w-7xl 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-8'
        }`}
      >
        {activeTab === 'inventory' && (
          <div className="flex flex-col lg:flex-row gap-5 items-start">
            {/* Center Area: Controls + Sectioned Subgroups */}
            <div className="flex-1 min-w-0 w-full space-y-4">
              {/* Filter and Actions Bar */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-[#EADBC8] shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#6E6259] absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar producto, subtipo o etiqueta (#Barril, #Zero, etc.)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-xs sm:text-sm text-[#2B2523] placeholder-[#6E6259]/70 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Toggle IDE Sidebar on Mobile/Desktop */}
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                        setIsMobileTreeDrawerOpen((prev) => !prev);
                      } else {
                        setIsTreeSidebarOpen((prev) => !prev);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isTreeSidebarOpen
                        ? 'bg-[#2B2523] text-[#D4A373] border-[#2B2523] shadow-xs'
                        : 'bg-white text-[#2B2523] border-[#EADBC8] hover:border-[#D4A373]'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Explorador IDE</span>
                    <span className="sm:hidden">Árbol IDE</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 font-mono">
                      {selectedTreeNode.type === 'all'
                        ? 'Todo'
                        : selectedTreeNode.label.split('>').pop()?.trim()}
                    </span>
                  </button>

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
                    <span className="hidden sm:inline">Restablecer</span>
                  </button>
                </div>
              </div>

              {/* Active Filter Pill / Breadcrumb when a folder or tag is selected in IDE tree */}
              {selectedTreeNode.type !== 'all' && (
                <div className="bg-[#FAF8F5] px-3.5 py-2 rounded-xl border border-[#EADBC8] flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-stone-500 font-medium">Filtrando por:</span>
                    <span className="font-bold text-[#9E2A2B] flex items-center gap-1 truncate">
                      <TaxonomyIcon name={selectedTreeNode.label} className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{selectedTreeNode.label}</span>
                    </span>
                    <span className="text-stone-400 font-mono text-[11px]">
                      ({filteredProducts.length} productos)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTreeNode({
                        type: 'all',
                        label: 'Todas las Categorías',
                      })
                    }
                    className="text-[11px] font-bold text-[#9E2A2B] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <span>Mostrar todo</span>
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* SECTIONED ACCORDIONS & SUBGROUPS IN THE CENTER */}
              {groupedSubgroups.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-2xl border border-[#EADBC8] space-y-2">
                  <Layers className="w-8 h-8 text-stone-300 mx-auto" />
                  <p className="text-sm font-semibold text-stone-700">
                    No se encontraron productos en este subgrupo o con este filtro.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTreeNode({ type: 'all', label: 'Todas las Categorías' });
                    }}
                    className="text-xs font-bold text-[#9E2A2B] hover:underline cursor-pointer"
                  >
                    Restablecer filtros y ver todo el catálogo
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {groupedSubgroups.map((group) => {
                    const isCollapsed = collapsedSubgroups[group.key] ?? false;
                    const groupProductIds = group.products.map((p) => p.id);
                    const availableInGroup = group.products.filter((p) => p.isAvailable).length;
                    const isGroupAllAvailable =
                      availableInGroup === group.products.length && group.products.length > 0;
                    const isGroupAllUnavailable =
                      availableInGroup === 0 && group.products.length > 0;

                    return (
                      <div
                        key={group.key}
                        className="bg-white rounded-2xl border border-[#EADBC8] shadow-xs overflow-hidden transition-all"
                      >
                        {/* Subgroup Header Banner with Batch Control */}
                        <div className="p-3 sm:p-3.5 bg-[#FAF8F5] border-b border-[#EADBC8] flex items-center justify-between gap-3">
                          <div
                            className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                            onClick={() =>
                              setCollapsedSubgroups((prev) => ({
                                ...prev,
                                [group.key]: !isCollapsed,
                              }))
                            }
                          >
                            <button
                              type="button"
                              className="p-1 rounded text-stone-400 hover:text-stone-700 transition-colors"
                            >
                              {isCollapsed ? (
                                <ChevronRight className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>

                            <div className="w-7 h-7 rounded-lg bg-[#2B2523] flex items-center justify-center shrink-0 shadow-2xs">
                              <TaxonomyIcon
                                name={group.subtypeName}
                                categoryId={group.categoryId}
                                className="w-4 h-4 shrink-0"
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#9E2A2B] bg-[#9E2A2B]/10 px-2 py-0.5 rounded-md">
                                  {group.categoryName}
                                </span>
                                <h4 className="font-serif font-bold text-sm text-[#2B2523] truncate">
                                  {group.subtypeName}
                                </h4>
                              </div>
                              <span className="text-[10.5px] text-stone-500 block mt-0.5">
                                {group.products.length} productos en este subgrupo ·{' '}
                                <strong
                                  className={
                                    isGroupAllUnavailable
                                      ? 'text-rose-600'
                                      : 'text-emerald-700'
                                  }
                                >
                                  {availableInGroup} disponibles
                                </strong>
                              </span>
                            </div>
                          </div>

                          {/* Batch Availability Toggle for Subgroup */}
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() =>
                                handleBatchToggleAvailability(
                                  groupProductIds,
                                  !isGroupAllAvailable
                                )
                              }
                              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                                isGroupAllAvailable
                                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                              }`}
                              title={
                                isGroupAllAvailable
                                  ? `Agotar/pausar todos los ${group.products.length} productos de este subgrupo`
                                  : `Activar todos los ${group.products.length} productos de este subgrupo`
                              }
                            >
                              <Power className="w-3 h-3" />
                              <span className="hidden sm:inline">
                                {isGroupAllAvailable ? 'Pausar Lote' : 'Activar Lote'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Subgroup Body */}
                        {!isCollapsed && (
                          <div className="p-3.5 sm:p-4 space-y-3">
                            {/* Tags Chips Bar */}
                            {group.allTags.length > 0 && (
                              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                                <span className="text-[10px] uppercase font-bold text-stone-400 shrink-0">
                                  Etiquetas:
                                </span>
                                {group.allTags.map((tag) => {
                                  const isSelectedTag =
                                    selectedTreeNode.type === 'tag' &&
                                    selectedTreeNode.tag === tag &&
                                    selectedTreeNode.subtypeName === group.subtypeName;

                                  return (
                                    <button
                                      key={tag}
                                      type="button"
                                      onClick={() =>
                                        setSelectedTreeNode(
                                          isSelectedTag
                                            ? {
                                                type: 'subtype',
                                                categoryId: group.categoryId,
                                                subtypeName: group.subtypeName,
                                                label: `${group.categoryName} > ${group.subtypeName}`,
                                              }
                                            : {
                                                type: 'tag',
                                                categoryId: group.categoryId,
                                                subtypeName: group.subtypeName,
                                                tag,
                                                label: `${group.subtypeName} > #${tag}`,
                                              }
                                        )
                                      }
                                      className={`px-2 py-0.5 rounded-md text-[10.5px] font-medium transition-colors cursor-pointer flex items-center gap-1 border shrink-0 ${
                                        isSelectedTag
                                          ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]'
                                          : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-[#D4A373]'
                                      }`}
                                    >
                                      <TaxonomyIcon
                                        name={tag}
                                        categoryId={group.categoryId}
                                        className="w-3 h-3 shrink-0"
                                      />
                                      <span>#{tag}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                            {/* Cards Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {group.products.map((product) => {
                                return (
                                  <div
                                    key={product.id}
                                    className={`p-3.5 rounded-2xl border transition-all bg-white flex flex-col justify-between gap-3 shadow-2xs ${
                                      product.isAvailable
                                        ? 'border-[#EADBC8] hover:border-[#D4A373]'
                                        : 'border-red-200 bg-red-50/20'
                                    }`}
                                  >
                                    <div className="space-y-2">
                                      <div className="flex items-start gap-2.5">
                                        {/* Thumbnail image with fallback */}
                                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative shadow-2xs">
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
                                          <div className="flex items-start justify-between gap-1.5">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6259] truncate block">
                                              <strong className="text-[#9E2A2B]">{product.format}</strong>
                                            </span>
                                            <span className="font-sans font-bold text-[#9E2A2B] text-sm shrink-0">
                                              {product.price.toFixed(2)}€
                                            </span>
                                          </div>

                                          <h4 className="font-serif font-bold text-sm text-[#2B2523] leading-snug line-clamp-1 mt-0.5">
                                            {product.name}
                                          </h4>

                                          {/* Subtype and Tags Badges */}
                                          <div className="flex flex-wrap gap-1 mt-1">
                                            {product.tags?.slice(0, 3).map((t) => (
                                              <span
                                                key={t}
                                                className="text-[9px] px-1.5 py-0.5 rounded bg-amber-50/80 text-stone-800 border border-amber-200/80 font-medium flex items-center gap-1"
                                              >
                                                <TaxonomyIcon
                                                  name={t}
                                                  categoryId={product.categoryId}
                                                  className="w-2.5 h-2.5 shrink-0"
                                                />
                                                <span>#{t}</span>
                                              </span>
                                            ))}
                                            {product.badge && (
                                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-[#9E2A2B]/10 text-[#9E2A2B] border border-[#9E2A2B]/20">
                                                {product.badge}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <p className="text-[11px] text-[#6E6259] line-clamp-2">
                                        {product.description}
                                      </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="pt-2 border-t border-[#EADBC8]/70 flex items-center justify-between gap-2">
                                      <button
                                        onClick={() =>
                                          handleToggleAvailability(
                                            product.id,
                                            product.isAvailable
                                          )
                                        }
                                        disabled={isPending}
                                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                                          product.isAvailable
                                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            : 'bg-red-600 hover:bg-red-700 text-white'
                                        }`}
                                        title={
                                          product.isAvailable
                                            ? 'Marcar como agotado'
                                            : 'Marcar como disponible'
                                        }
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

                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => setEditingProduct(product)}
                                          className="p-1.5 rounded-lg border border-[#EADBC8] hover:border-[#9E2A2B] text-[#9E2A2B] hover:bg-[#9E2A2B]/10 text-xs font-semibold transition-colors cursor-pointer"
                                          title="Modificar foto, descripción, precio o subtipo"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>

                                        <button
                                          onClick={() => setProductToDelete(product)}
                                          className="p-1.5 rounded-lg border border-stone-200 hover:border-rose-400 text-stone-400 hover:text-rose-600 hover:bg-rose-50 text-xs transition-colors cursor-pointer"
                                          title="Eliminar plato de la carta"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Desktop Right Sidebar: IDE Folder Explorer */}
            {isTreeSidebarOpen && (
              <div className="hidden lg:block shrink-0 sticky top-20 max-h-[calc(100vh-100px)] rounded-2xl overflow-hidden border border-[#EADBC8] shadow-sm">
                <StaffProductTreeSidebar
                  products={products}
                  categories={initialCategories}
                  selectedNode={selectedTreeNode}
                  onSelectNode={(node) => setSelectedTreeNode(node)}
                  onBatchToggleAvailability={handleBatchToggleAvailability}
                  isPending={isPending}
                  onClose={() => setIsTreeSidebarOpen(false)}
                />
              </div>
            )}
          </div>
        )}

        {/* Mobile Slide-over Drawer for IDE Explorer */}
        {isMobileTreeDrawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in">
            <div className="w-80 max-w-[85vw] h-full bg-white shadow-2xl animate-in slide-in-from-right">
              <StaffProductTreeSidebar
                products={products}
                categories={initialCategories}
                selectedNode={selectedTreeNode}
                onSelectNode={(node) => {
                  setSelectedTreeNode(node);
                  setIsMobileTreeDrawerOpen(false);
                }}
                onBatchToggleAvailability={handleBatchToggleAvailability}
                isPending={isPending}
                onClose={() => setIsMobileTreeDrawerOpen(false)}
              />
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          /* General Floor Plan & Orders Suite */
          <div className="flex-1 min-h-0 flex flex-col space-y-2">
            {/* View Mode Rendering */}
            <div className="flex-1 min-h-0 flex flex-col">
              {ordersViewMode === 'floor' ? (
                <StaffFloorPlanView
                  tables={restaurantTables}
                  orders={activeOrdersList}
                  onSelectTable={(table) => setSelectedTableForPda(table)}
                  onRefreshData={loadTablesAndOrders}
                  products={products}
                  categories={initialCategories}
                  ordersViewMode={ordersViewMode}
                  onSetOrdersViewMode={setOrdersViewMode}
                  kanbanOrdersCount={activeOrdersList.length}
                />
              ) : (
                <div className="flex-1 min-h-0 flex flex-col space-y-2">
                  {/* Kanban View Top Header with Switcher */}
                  <div className="shrink-0 bg-white py-1.5 px-3 sm:px-4 rounded-xl border border-[#EADBC8] shadow-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#EADBC8]">
                      <button
                        type="button"
                        onClick={() => setOrdersViewMode('floor')}
                        className="px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer text-stone-600 hover:text-[#2B2523] hover:bg-white"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Plano 2D del Bar</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setOrdersViewMode('kanban')}
                        className="px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-[#9E2A2B] text-white shadow-xs"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>Tablero Kanban ({activeOrdersList.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={loadTablesAndOrders}
                        className="p-1 rounded-lg text-stone-400 hover:text-[#2B2523] hover:bg-white transition-colors cursor-pointer"
                        title="Actualizar mesas y comandas"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto">
                    <StaffOrdersKanbanView
                      orders={activeOrdersList}
                      tables={restaurantTables}
                      onOpenPda={(table) => setSelectedTableForPda(table)}
                      onRefreshData={loadTablesAndOrders}
                    />
                  </div>
                </div>
              )}
            </div>

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
