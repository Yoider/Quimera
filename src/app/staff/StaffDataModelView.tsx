'use client';

import React, { useState, useEffect, useTransition, useRef, useMemo } from 'react';
import {
  Database,
  Table2,
  Key,
  Link2,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  ShieldAlert,
  Info,
  Calendar,
  Users,
  UtensilsCrossed,
  ReceiptText,
  Clock,
  Sparkles,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  GripHorizontal,
  LayoutGrid,
} from 'lucide-react';
import {
  getDynamicDatabaseSchemaAction,
  DynamicModelDefinition,
  DynamicRelationDefinition,
} from './actions';

export type ModelModule = 'all' | 'catalog' | 'staff' | 'orders' | 'general';

interface NodePosition {
  x: number;
  y: number;
}

// Initial structured spatial distribution for the tables
const DEFAULT_NODE_POSITIONS: Record<string, NodePosition> = {
  // Módulo Catálogo (Izquierda - Centro)
  Category: { x: 60, y: 120 },
  Product: { x: 440, y: 80 },
  ProductAllergen: { x: 860, y: 140 },
  Allergen: { x: 1260, y: 180 },

  // Módulo Personal & Horarios (Centro - Inferior)
  StaffUser: { x: 60, y: 680 },
  User: { x: 440, y: 660 },
  ShiftAssignment: { x: 860, y: 640 },
  WeeklySchedule: { x: 1260, y: 640 },

  // Módulo Comandas & Pedidos (Inferior)
  Order: { x: 180, y: 1180 },
  OrderItem: { x: 640, y: 1180 },
};

function getModelIcon(name: string): React.ComponentType<{ className?: string }> {
  const lower = name.toLowerCase();
  if (lower.includes('category')) return Layers;
  if (lower.includes('product') || lower.includes('dish')) return UtensilsCrossed;
  if (lower.includes('allergen')) return ShieldAlert;
  if (lower.includes('staff')) return Key;
  if (lower.includes('user') || lower.includes('worker') || lower.includes('employee')) return Users;
  if (lower.includes('schedule')) return Calendar;
  if (lower.includes('shift')) return Clock;
  if (lower.includes('order')) return ReceiptText;
  if (lower.includes('item')) return UtensilsCrossed;
  return Table2;
}

export function StaffDataModelView() {
  const [selectedModule, setSelectedModule] = useState<ModelModule>('all');
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'canvas' | 'tables' | 'relations'>('canvas');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [models, setModels] = useState<DynamicModelDefinition[]>([]);
  const [relations, setRelations] = useState<DynamicRelationDefinition[]>([]);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [isLiveFromPrisma, setIsLiveFromPrisma] = useState<boolean>(false);

  // Canvas spatial interaction state
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 30, y: 30 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node positions map
  const [nodePositions, setNodePositions] = useState<Record<string, NodePosition>>(DEFAULT_NODE_POSITIONS);
  const [draggingNode, setDraggingNode] = useState<{
    name: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const pendingPointer = useRef<{ clientX: number; clientY: number } | null>(null);

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  const fetchSchema = () => {
    startTransition(async () => {
      const res = await getDynamicDatabaseSchemaAction();
      if (res.success && res.models.length > 0) {
        setModels(res.models);
        setRelations(res.relations);
        setTotalRecords(res.totalRecords);
        setIsLiveFromPrisma(true);

        // Generate default positions for any newly added models not in initial map
        setNodePositions((prev) => {
          const next = { ...prev };
          let offsetX = 1600;
          let offsetY = 120;
          res.models.forEach((m) => {
            if (!next[m.name]) {
              next[m.name] = { x: offsetX, y: offsetY };
              offsetY += 400;
              if (offsetY > 1200) {
                offsetY = 120;
                offsetX += 380;
              }
            }
          });
          return next;
        });
      }
    });
  };

  useEffect(() => {
    fetchSchema();
  }, []);

  // Filtered models
  const filteredModels = models.filter((m) => {
    if (selectedModule !== 'all' && m.module !== selectedModule) {
      return false;
    }
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchName = m.name.toLowerCase().includes(q) || m.sqlTable.toLowerCase().includes(q);
      const matchField = m.fields.some((f) => f.name.toLowerCase().includes(q) || f.type.toLowerCase().includes(q));
      return matchName || matchField;
    }
    return true;
  });

  const visibleModelNames = useMemo(() => new Set(filteredModels.map((m) => m.name)), [filteredModels]);

  // Filtered relations
  const filteredRelations = relations.filter((r) => {
    if (!visibleModelNames.has(r.sourceTable) || !visibleModelNames.has(r.targetTable)) {
      return false;
    }
    if (activeModel) {
      return r.sourceTable === activeModel || r.targetTable === activeModel;
    }
    return true;
  });

  // --- Canvas Pan & Zoom Handlers ---
  const handleWheel = (e: React.WheelEvent) => {
    if (viewMode !== 'canvas') return;
    e.preventDefault();

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    const newZoom = Math.min(Math.max(zoom * zoomFactor, 0.35), 2.0);

    // Zoom centered towards mouse position
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const newPanX = mouseX - (mouseX - pan.x) * (newZoom / zoom);
    const newPanY = mouseY - (mouseY - pan.y) * (newZoom / zoom);

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
  };

  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    // Only pan if clicking directly on the canvas background or SVG
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.interactive-node-card')) return;

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    target.setPointerCapture(e.pointerId);
  };

  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    if (!draggingNode && !isPanning) return;
    pendingPointer.current = { clientX: e.clientX, clientY: e.clientY };

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        if (!pendingPointer.current) return;
        const { clientX, clientY } = pendingPointer.current;

        if (draggingNode) {
          const rect = canvasContainerRef.current?.getBoundingClientRect();
          if (!rect) return;

          const canvasX = (clientX - rect.left - pan.x) / zoom;
          const canvasY = (clientY - rect.top - pan.y) / zoom;

          setNodePositions((prev) => ({
            ...prev,
            [draggingNode.name]: {
              x: Math.round(canvasX - draggingNode.offsetX),
              y: Math.round(canvasY - draggingNode.offsetY),
            },
          }));
        } else if (isPanning) {
          setPan({
            x: clientX - panStart.x,
            y: clientY - panStart.y,
          });
        }
      });
    }
  };

  const handleCanvasPointerUp = (e: React.PointerEvent) => {
    setIsPanning(false);
    setDraggingNode(null);
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
  };

  // Node Drag Start
  const handleNodePointerDown = (e: React.PointerEvent, modelName: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    const rect = canvasContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentPos = nodePositions[modelName] || { x: 0, y: 0 };
    const canvasX = (e.clientX - rect.left - pan.x) / zoom;
    const canvasY = (e.clientY - rect.top - pan.y) / zoom;

    setDraggingNode({
      name: modelName,
      offsetX: canvasX - currentPos.x,
      offsetY: canvasY - currentPos.y,
    });

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResetZoom = () => {
    setZoom(0.85);
    setPan({ x: 30, y: 30 });
  };

  const catalogCount = models.filter((m) => m.module === 'catalog').length;
  const staffCount = models.filter((m) => m.module === 'staff').length;
  const ordersCount = models.filter((m) => m.module === 'orders').length;
  const generalCount = models.filter((m) => m.module === 'general').length;

  return (
    <div className={`space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#FAF8F5] p-6 overflow-hidden flex flex-col space-y-4' : ''}`}>
      {/* Top Banner / Metrics */}
      <div className="bg-[#2B2523] rounded-3xl p-6 sm:p-7 text-white shadow-xl border border-stone-800 relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4A373]/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4A373]/20 border border-[#D4A373]/30 text-[#D4A373] text-xs font-semibold uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                <span>Esquema PostgreSQL · Prisma ORM</span>
              </span>

              {isLiveFromPrisma && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Tablero Dinámico Reactivo (DMMF)</span>
                </span>
              )}
            </div>

            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-[#FAF8F5]">
              Modelo de Datos de Taberna Quimera
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Pizarra interactiva en tiempo real. Puedes <strong>arrastrar y mover las tablas</strong>, hacer <strong>zoom</strong>, <strong>desplazar el tablero</strong> y observar cómo las relaciones siguen los nodos dinámicamente.
            </p>
          </div>

          {/* Quick Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Tablas</span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-[#D4A373]">
                {models.length > 0 ? models.length : '...'}
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Relaciones</span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-emerald-400">
                {relations.length > 0 ? relations.length : '...'}
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center">
              <span className="block text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Registros BD</span>
              <span className="font-serif font-bold text-xl sm:text-2xl text-amber-300">
                {isPending ? '...' : totalRecords}
              </span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 text-center flex flex-col justify-center items-center">
              <button
                onClick={fetchSchema}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#9E2A2B] hover:bg-[#852223] text-xs font-bold transition-colors cursor-pointer text-white disabled:opacity-50"
                title="Sincronizar esquema y conteo de PostgreSQL"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isPending ? 'animate-spin' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Module Filters, Search & View Switcher */}
      <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-[#EADBC8] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shrink-0">
        {/* Module Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
          <button
            onClick={() => {
              setSelectedModule('all');
              setActiveModel(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedModule === 'all'
                ? 'bg-[#9E2A2B] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            🌟 Todos ({models.length})
          </button>

          <button
            onClick={() => {
              setSelectedModule('catalog');
              setActiveModel(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedModule === 'catalog'
                ? 'bg-[#D97706] text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            🍽️ Catálogo ({catalogCount})
          </button>

          <button
            onClick={() => {
              setSelectedModule('staff');
              setActiveModel(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedModule === 'staff'
                ? 'bg-[#2563EB] text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
            }`}
          >
            👥 Personal ({staffCount})
          </button>

          <button
            onClick={() => {
              setSelectedModule('orders');
              setActiveModel(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedModule === 'orders'
                ? 'bg-[#059669] text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            🧾 Comandas ({ordersCount})
          </button>

          {generalCount > 0 && (
            <button
              onClick={() => {
                setSelectedModule('general');
                setActiveModel(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedModule === 'general'
                  ? 'bg-[#7C3AED] text-white shadow-xs'
                  : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
              }`}
            >
              ⚙️ General ({generalCount})
            </button>
          )}
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar tabla o campo..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B]"
            />
          </div>

          <div className="flex items-center rounded-xl bg-stone-100 p-1 border border-stone-200 shrink-0">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'canvas'
                  ? 'bg-[#9E2A2B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
              title="Tablero interactivo con arrastre en tiempo real"
            >
              <Move className="w-3.5 h-3.5" />
              <span>Tablero Canvas</span>
            </button>

            <button
              onClick={() => setViewMode('tables')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'tables'
                  ? 'bg-white text-[#2B2523] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Cuadrícula</span>
            </button>

            <button
              onClick={() => setViewMode('relations')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'relations'
                  ? 'bg-white text-[#2B2523] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>Relaciones ({filteredRelations.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Model Indicator if selected */}
      {activeModel && (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 shrink-0">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-amber-600" />
            <span>
              Filtrando y resaltando conexiones de la tabla <strong>{activeModel}</strong>.
            </span>
          </div>
          <button
            onClick={() => setActiveModel(null)}
            className="font-bold underline hover:text-amber-950 cursor-pointer"
          >
            Quitar filtro
          </button>
        </div>
      )}

      {/* VIEW 1: INTERACTIVE DYNAMIC CANVAS (DEFAULT) */}
      {viewMode === 'canvas' && (
        <div
          ref={canvasContainerRef}
          onWheel={handleWheel}
          onPointerDown={handleCanvasPointerDown}
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={handleCanvasPointerUp}
          className={`relative w-full rounded-3xl border border-[#EADBC8] overflow-hidden select-none bg-[#F7F4EF] shadow-inner touch-none ${
            isFullscreen ? 'flex-1 h-full' : 'h-[750px]'
          } ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {/* GPU-accelerated Background Dot Grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #D4A373 1.2px, transparent 1.2px)',
              backgroundSize: `${Math.round(26 * zoom)}px ${Math.round(26 * zoom)}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`,
              willChange: isPanning ? 'background-position' : 'auto',
            }}
          />

          {/* Instruction helper tag */}
          <div className="absolute top-4 left-4 z-20 pointer-events-none bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-stone-200 text-[11px] text-stone-600 shadow-xs flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-[#9E2A2B]" />
            <span>Arrastra cualquier tabla para moverla · Rueda del ratón o +/- para Zoom</span>
          </div>

          {/* Canvas Transform Viewport */}
          <div
            className="absolute top-0 left-0 w-full h-full origin-top-left pointer-events-none"
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: '0 0',
              willChange: isPanning || draggingNode ? 'transform' : 'auto',
            }}
          >
            {/* SVG RELATIONS LAYER */}
            <svg
              className="absolute top-0 left-0 overflow-visible pointer-events-none"
              style={{ width: 3000, height: 2500 }}
            >
              <defs>
                {/* Arrow markers for each module */}
                <marker
                  id="arrow-catalog"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#9E2A2B" />
                </marker>
                <marker
                  id="arrow-staff"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
                </marker>
                <marker
                  id="arrow-orders"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#059669" />
                </marker>
                <marker
                  id="arrow-general"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#7C3AED" />
                </marker>
              </defs>

              {filteredRelations.map((rel) => {
                const posA = nodePositions[rel.sourceTable];
                const posB = nodePositions[rel.targetTable];
                if (!posA || !posB) return null;

                const nodeWidth = 310;
                const isHighlighted =
                  activeModel === rel.sourceTable || activeModel === rel.targetTable;
                const isDimmed = activeModel !== null && !isHighlighted;

                // Smart anchor points calculation
                let x1: number, y1: number, x2: number, y2: number;
                let cx1: number, cy1: number, cx2: number, cy2: number;

                if (posA.x + nodeWidth <= posB.x) {
                  // Source is to the left of Target
                  x1 = posA.x + nodeWidth;
                  y1 = posA.y + 65;
                  x2 = posB.x;
                  y2 = posB.y + 65;
                  const dx = Math.abs(x2 - x1) * 0.5;
                  cx1 = x1 + dx;
                  cy1 = y1;
                  cx2 = x2 - dx;
                  cy2 = y2;
                } else if (posA.x >= posB.x + nodeWidth) {
                  // Source is to the right of Target
                  x1 = posA.x;
                  y1 = posA.y + 65;
                  x2 = posB.x + nodeWidth;
                  y2 = posB.y + 65;
                  const dx = Math.abs(x2 - x1) * 0.5;
                  cx1 = x1 - dx;
                  cy1 = y1;
                  cx2 = x2 + dx;
                  cy2 = y2;
                } else {
                  // Vertically aligned or overlapping
                  x1 = posA.x + nodeWidth / 2;
                  y1 = posA.y + (posA.y < posB.y ? 220 : 0);
                  x2 = posB.x + nodeWidth / 2;
                  y2 = posB.y + (posA.y < posB.y ? 0 : 220);
                  const dy = Math.abs(y2 - y1) * 0.5;
                  cx1 = x1;
                  cy1 = y1 + (posA.y < posB.y ? dy : -dy);
                  cx2 = x2;
                  cy2 = y2 + (posA.y < posB.y ? -dy : dy);
                }

                const strokeColor =
                  rel.module === 'catalog'
                    ? '#9E2A2B'
                    : rel.module === 'staff'
                    ? '#2563EB'
                    : rel.module === 'orders'
                    ? '#059669'
                    : '#7C3AED';

                return (
                  <g key={rel.id} className="transition-opacity duration-200">
                    {/* Shadow / Glow line */}
                    {isHighlighted && (
                      <path
                        d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={7}
                        strokeOpacity={0.25}
                        strokeLinecap="round"
                      />
                    )}

                    {/* Main connector curve */}
                    <path
                      d={`M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={isHighlighted ? 3 : 2}
                      strokeDasharray={rel.type === 'N:M' ? '4 4' : undefined}
                      strokeOpacity={isDimmed ? 0.15 : isHighlighted ? 1 : 0.65}
                      markerEnd={`url(#arrow-${rel.module})`}
                      className="transition-[stroke-opacity,opacity] duration-150"
                    />

                    {/* Central interactive connection badge */}
                    <circle
                      cx={(x1 + x2) / 2}
                      cy={(y1 + y2) / 2}
                      r={4}
                      fill={strokeColor}
                      opacity={isDimmed ? 0.2 : 0.8}
                    />
                  </g>
                );
              })}
            </svg>

            {/* DRAGGABLE HTML TABLE NODES */}
            {filteredModels.map((model) => {
              const Icon = getModelIcon(model.name);
              const pos = nodePositions[model.name] || { x: 100, y: 100 };
              const isSelected = activeModel === model.name;
              const isDragging = draggingNode?.name === model.name;

              const connectedRelations = relations.filter(
                (r) => r.sourceTable === model.name || r.targetTable === model.name
              );

              return (
                <div
                  key={model.name}
                  id={`node-${model.name}`}
                  style={{
                    transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
                    width: 310,
                    willChange: isDragging ? 'transform' : 'auto',
                  }}
                  className={`interactive-node-card absolute top-0 left-0 pointer-events-auto bg-white rounded-2xl border shadow-lg transition-shadow duration-150 ${
                    isSelected
                      ? 'ring-4 ring-[#9E2A2B] shadow-2xl z-30'
                      : isDragging
                      ? 'shadow-2xl ring-2 ring-stone-400 z-40'
                      : 'border-stone-300 hover:shadow-xl z-10'
                  }`}
                >
                  {/* Draggable Table Header */}
                  <div
                    onPointerDown={(e) => handleNodePointerDown(e, model.name)}
                    style={{ backgroundColor: model.accentColor }}
                    className="px-4 py-3 text-white rounded-t-2xl cursor-grab active:cursor-grabbing flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GripHorizontal className="w-4 h-4 text-white/50 shrink-0" />
                      <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-serif font-bold text-sm tracking-wide text-white truncate">
                            {model.name}
                          </h4>
                        </div>
                        <span className="text-[10px] text-white/80 block font-mono">
                          SQL: {model.sqlTable}
                        </span>
                      </div>
                    </div>

                    {/* Live Count Pill */}
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-white/80 px-2 py-0.5 rounded-full bg-black/25">
                        {model.count !== undefined ? `${model.count} filas` : '...'}
                      </span>
                    </div>
                  </div>

                  {/* Compact Description */}
                  <div className="px-3.5 py-1.5 bg-stone-50 border-b border-stone-100 text-[11px] text-stone-600 truncate">
                    {model.description}
                  </div>

                  {/* Fields List */}
                  <div className="p-3 space-y-1 max-h-56 overflow-y-auto no-scrollbar font-mono text-[11px]">
                    {model.fields.map((f) => (
                      <div
                        key={f.name}
                        className={`flex items-center justify-between p-1 rounded transition-colors ${
                          f.isId
                            ? 'bg-amber-50/80 border border-amber-200/60'
                            : f.isForeignKey
                            ? 'bg-blue-50/80 border border-blue-200/60'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {f.isId && (
                            <span
                              className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-500 text-white shrink-0 flex items-center gap-0.5"
                              title="Primary Key"
                            >
                              <Key className="w-2 h-2" />
                              PK
                            </span>
                          )}
                          {f.isForeignKey && (
                            <button
                              onClick={() => {
                                if (f.foreignTable) {
                                  setActiveModel(f.foreignTable);
                                }
                              }}
                              className="px-1 py-0.2 rounded text-[8px] font-bold bg-blue-600 text-white shrink-0 flex items-center gap-0.5 cursor-pointer hover:bg-blue-700"
                              title={`FK -> ${f.foreignTable}`}
                            >
                              <Link2 className="w-2 h-2" />
                              FK
                            </button>
                          )}
                          {f.isUnique && (
                            <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-purple-600 text-white shrink-0">
                              UQ
                            </span>
                          )}
                          <span
                            className={`font-semibold truncate ${
                              f.isId
                                ? 'text-amber-900 font-bold'
                                : f.isForeignKey
                                ? 'text-blue-900 font-bold'
                                : 'text-[#2B2523]'
                            }`}
                          >
                            {f.name}
                          </span>
                          {f.isNullable && <span className="text-[9px] text-stone-400">?</span>}
                        </div>

                        <span className="text-[10px] text-stone-500 font-normal shrink-0">
                          {f.type}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Table Footer with Connection Chips */}
                  <div className="px-3 py-2 bg-stone-50/80 border-t border-stone-200 flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                      {connectedRelations.slice(0, 3).map((r) => {
                        const other = r.sourceTable === model.name ? r.targetTable : r.sourceTable;
                        return (
                          <span
                            key={r.id}
                            onClick={() => setActiveModel(other)}
                            className="px-1.5 py-0.5 rounded bg-white border border-stone-200 text-stone-600 hover:text-[#9E2A2B] hover:border-[#9E2A2B] cursor-pointer font-bold shrink-0"
                            title={`Conectada con ${other}`}
                          >
                            {other}
                          </span>
                        );
                      })}
                      {connectedRelations.length > 3 && (
                        <span className="text-stone-400">+{connectedRelations.length - 3}</span>
                      )}
                    </div>

                    <button
                      onClick={() => setActiveModel(isSelected ? null : model.name)}
                      className="font-bold text-[#9E2A2B] hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      {isSelected ? 'Desmarcar' : 'Resaltar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* FLOATING CANVAS CONTROLS (BOTTOM-RIGHT) */}
          <div className="absolute bottom-5 right-5 z-30 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-2xl border border-stone-300 shadow-xl">
            <button
              onClick={() => setZoom((prev) => Math.min(prev * 1.15, 2.0))}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-700 font-bold transition-colors cursor-pointer"
              title="Aumentar Zoom (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <span className="px-2 text-xs font-mono font-bold text-stone-600">
              {Math.round(zoom * 100)}%
            </span>

            <button
              onClick={() => setZoom((prev) => Math.max(prev / 1.15, 0.35))}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-700 font-bold transition-colors cursor-pointer"
              title="Alejar Zoom (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <div className="h-4 w-px bg-stone-300 mx-0.5" />

            <button
              onClick={handleResetZoom}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              title="Restablecer zoom y centrar vista"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-xl hover:bg-stone-100 text-stone-700 transition-colors cursor-pointer"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Ver a pantalla completa'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: TRADITIONAL TABLES GRID */}
      {viewMode === 'tables' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredModels.map((model) => {
            const Icon = getModelIcon(model.name);
            const isSelected = activeModel === model.name;

            const connectedRelations = relations.filter(
              (r) => r.sourceTable === model.name || r.targetTable === model.name
            );

            return (
              <div
                key={model.name}
                id={`model-${model.name}`}
                className={`bg-white rounded-2xl border shadow-xs transition-all overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#9E2A2B] ring-4 ring-[#9E2A2B]/15 scale-[1.01]'
                    : 'border-[#EADBC8] hover:border-stone-300'
                }`}
              >
                {/* Table Header */}
                <div>
                  <div
                    className="px-5 py-4 text-white flex items-center justify-between"
                    style={{ backgroundColor: model.accentColor }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif font-bold text-base tracking-wide">
                            {model.name}
                          </h3>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-md bg-black/20 text-white/90">
                            SQL: {model.sqlTable}
                          </span>
                        </div>
                        <span className="text-[11px] text-white/80 block mt-0.5">
                          {model.moduleLabel}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-semibold uppercase text-white/70 block">
                        Registros
                      </span>
                      <span className="font-sans font-bold text-lg leading-tight">
                        {model.count !== undefined ? model.count : '...'}
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-2.5 bg-stone-50 border-b border-stone-100 text-xs text-stone-600">
                    {model.description}
                  </div>

                  <div className="p-4 space-y-1.5 max-h-72 overflow-y-auto no-scrollbar font-mono text-xs">
                    {model.fields.map((f) => (
                      <div
                        key={f.name}
                        className={`flex items-center justify-between p-1.5 rounded-lg transition-colors ${
                          f.isId
                            ? 'bg-amber-50/70 border border-amber-200/60'
                            : f.isForeignKey
                            ? 'bg-blue-50/70 border border-blue-200/60'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          {f.isId && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500 text-white shrink-0 flex items-center gap-0.5">
                              <Key className="w-2.5 h-2.5" />
                              PK
                            </span>
                          )}
                          {f.isForeignKey && (
                            <button
                              onClick={() => {
                                if (f.foreignTable) {
                                  setActiveModel(f.foreignTable);
                                }
                              }}
                              className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-600 text-white shrink-0 flex items-center gap-0.5 cursor-pointer hover:bg-blue-700"
                            >
                              <Link2 className="w-2.5 h-2.5" />
                              FK
                            </button>
                          )}
                          {f.isUnique && (
                            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-purple-600 text-white shrink-0">
                              UQ
                            </span>
                          )}
                          <span
                            className={`font-semibold truncate ${
                              f.isId ? 'text-amber-900' : f.isForeignKey ? 'text-blue-900' : 'text-[#2B2523]'
                            }`}
                          >
                            {f.name}
                          </span>
                          {f.isNullable && <span className="text-[10px] text-stone-400">?</span>}
                        </div>

                        <span className="text-[11px] text-stone-500 font-normal">
                          {f.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-stone-50 border-t border-stone-200/70 space-y-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1.5 tracking-wider">
                      Relaciones ({connectedRelations.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {connectedRelations.map((rel) => {
                        const otherTable = rel.sourceTable === model.name ? rel.targetTable : rel.sourceTable;
                        const isOutgoing = rel.sourceTable === model.name;

                        return (
                          <button
                            key={rel.id}
                            onClick={() => {
                              setActiveModel(otherTable);
                              setViewMode('relations');
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-stone-200 text-[10px] font-medium text-stone-700 hover:border-[#9E2A2B] hover:text-[#9E2A2B] transition-colors cursor-pointer"
                          >
                            <span>{isOutgoing ? '1:N →' : 'N:1 ←'}</span>
                            <span className="font-bold">{otherTable}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-200/50 text-[11px]">
                    <span className="text-stone-500 font-mono text-[10px]">
                      {model.indexes && model.indexes.length > 0 ? model.indexes.join(' ') : 'Sin índices compuestos'}
                    </span>
                    <button
                      onClick={() => setActiveModel(isSelected ? null : model.name)}
                      className="font-bold text-[#9E2A2B] hover:underline cursor-pointer"
                    >
                      {isSelected ? 'Desmarcar' : 'Ver Enlaces'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: RELATIONS & INTEGRITY LIST */}
      {viewMode === 'relations' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#EADBC8] p-5 shadow-xs">
            <h3 className="font-serif font-bold text-lg text-[#2B2523] mb-1">
              Mapa de Relaciones e Integridad Referencial
            </h3>
            <p className="text-xs text-stone-600 mb-4">
              Definición de claves foráneas, cardinalidades (1:N, N:M) y políticas de integridad referencial detectadas en directo por Prisma.
            </p>

            <div className="space-y-3">
              {filteredRelations.map((rel) => (
                <div
                  key={rel.id}
                  className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 hover:border-[#9E2A2B]/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-lg bg-white border border-stone-300 font-mono font-bold text-xs text-[#2B2523] shadow-2xs">
                      {rel.sourceTable} <span className="text-amber-700">.{rel.sourceField}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-stone-500 tracking-wider">
                        {rel.type}
                      </span>
                      <ArrowRight className="w-4 h-4 text-stone-400" />
                    </div>

                    <div className="px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 font-mono font-bold text-xs text-blue-900 shadow-2xs">
                      {rel.targetTable} <span className="text-blue-600">.{rel.targetField}</span>
                    </div>
                  </div>

                  <div className="flex-1 md:px-4">
                    <p className="text-xs text-stone-700">{rel.description}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        rel.onDelete === 'Cascade'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}
                    >
                      onDelete: {rel.onDelete}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
