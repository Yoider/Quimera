'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RestaurantTableData,
  RestaurantZoneData,
  ActiveOrderData,
  saveRestaurantTableAction,
  getRestaurantZonesAction,
} from './orderActions';
import StaffFloorPlanRightSidebar from './StaffFloorPlanRightSidebar';
import {
  Users,
  Beer,
  Sun,
  UtensilsCrossed,
  Sliders,
  Check,
  Edit3,
  Move,
  Grid,
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
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [selectedTableForInspector, setSelectedTableForInspector] = useState<RestaurantTableData | null>(null);

  // Local optimistic tables state for 60fps/120fps fluid movement
  const [localTables, setLocalTables] = useState<RestaurantTableData[]>(tables);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [isHoldingTableId, setIsHoldingTableId] = useState<string | null>(null);

  // Dynamic Zones state
  const [zones, setZones] = useState<RestaurantZoneData[]>([]);

  // Canvas and RAF dragging refs
  const canvasRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const pendingPointer = useRef<{ clientX: number; clientY: number } | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const dragStartInfo = useRef<{
    tableId: string;
    tableNumber: string;
    startTime: number;
    startClientX: number;
    startClientY: number;
    startPosX: number;
    startPosY: number;
    offsetX: number;
    offsetY: number;
    hasMoved: boolean;
    isHolding: boolean;
  } | null>(null);

  // Sync local tables when parent tables change and user is not actively dragging
  useEffect(() => {
    if (!draggingTableId) {
      setLocalTables(tables);
    }
  }, [tables, draggingTableId]);

  // Load Zones from DB
  const loadZones = useCallback(async () => {
    const loaded = await getRestaurantZonesAction();
    setZones(loaded);
  }, []);

  useEffect(() => {
    loadZones();
  }, [loadZones]);

  // Clean up RAF and timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // Map orders by tableNumber
  const ordersByTable = new Map<string, ActiveOrderData>();
  orders.forEach((o) => {
    ordersByTable.set(o.tableNumber, o);
  });

  // Handle pointer down on a table: initiate click detection vs hold to drag
  const handleTablePointerDown = (e: React.PointerEvent, table: RestaurantTableData) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    // Clear any pending hold timer
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch (_) {}

    const canvasRect = canvasRef.current?.getBoundingClientRect();
    let offsetX = 0;
    let offsetY = 0;
    if (canvasRect) {
      const clickXPercent = ((e.clientX - canvasRect.left) / canvasRect.width) * 100;
      const clickYPercent = ((e.clientY - canvasRect.top) / canvasRect.height) * 100;
      offsetX = clickXPercent - table.posX;
      offsetY = clickYPercent - table.posY;
    }

    dragStartInfo.current = {
      tableId: table.id,
      tableNumber: table.tableNumber,
      startTime: Date.now(),
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPosX: table.posX,
      startPosY: table.posY,
      offsetX,
      offsetY,
      hasMoved: false,
      isHolding: false,
    };

    // Hold timer: if pressed and held for >= 220ms, unlock table to drag and prevent click modal
    holdTimerRef.current = setTimeout(() => {
      if (dragStartInfo.current && dragStartInfo.current.tableId === table.id) {
        dragStartInfo.current.isHolding = true;
        setIsHoldingTableId(table.id);
        setDraggingTableId(table.id);
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(25);
          } catch (_) {}
        }
      }
    }, 220);
  };

  // Handle pointer move: 60fps / 120fps requestAnimationFrame calculation
  const handleTablePointerMove = (e: React.PointerEvent) => {
    if (!dragStartInfo.current) return;

    const deltaX = Math.abs(e.clientX - dragStartInfo.current.startClientX);
    const deltaY = Math.abs(e.clientY - dragStartInfo.current.startClientY);
    const distance = Math.hypot(deltaX, deltaY);

    // If pointer moved more than 6px, immediately classify as drag and clear timer
    if (distance > 6) {
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      dragStartInfo.current.hasMoved = true;
      dragStartInfo.current.isHolding = true;
      if (draggingTableId !== dragStartInfo.current.tableId) {
        setDraggingTableId(dragStartInfo.current.tableId);
        setIsHoldingTableId(dragStartInfo.current.tableId);
      }
    }

    // Only update position if holding or dragging
    if (!dragStartInfo.current.isHolding && !dragStartInfo.current.hasMoved) {
      return;
    }

    pendingPointer.current = { clientX: e.clientX, clientY: e.clientY };

    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        rafId.current = null;
        if (!pendingPointer.current || !canvasRef.current || !dragStartInfo.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        let x = ((pendingPointer.current.clientX - rect.left) / rect.width) * 100 - dragStartInfo.current.offsetX;
        let y = ((pendingPointer.current.clientY - rect.top) / rect.height) * 100 - dragStartInfo.current.offsetY;

        // Clamp inside canvas boundary
        x = Math.max(5, Math.min(95, x));
        y = Math.max(5, Math.min(95, y));

        // Snap to grid if enabled (2.5% steps for precision alignment)
        if (snapToGrid) {
          x = Math.round(x / 2.5) * 2.5;
          y = Math.round(y / 2.5) * 2.5;
        }

        const targetId = dragStartInfo.current.tableId;
        setLocalTables((prev) =>
          prev.map((t) => (t.id === targetId ? { ...t, posX: Math.round(x * 10) / 10, posY: Math.round(y * 10) / 10 } : t))
        );
      });
    }
  };

  // Handle pointer up: discriminate click (open modal) vs hold/drag (move table)
  const handleTablePointerUp = async (e: React.PointerEvent, table: RestaurantTableData) => {
    e.stopPropagation();
    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.releasePointerCapture(e.pointerId);
    } catch (_) {}

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    const info = dragStartInfo.current;
    dragStartInfo.current = null;
    setDraggingTableId(null);
    setIsHoldingTableId(null);

    if (!info) return;

    const elapsedTime = Date.now() - info.startTime;
    const isHoldOrDrag = info.hasMoved || info.isHolding || elapsedTime >= 220;

    if (isHoldOrDrag) {
      // It was a HOLD or DRAG: DO NOT OPEN THE MODAL!
      if (info.hasMoved) {
        // Persist new position to database
        const movedTable = localTables.find((t) => t.id === info.tableId);
        if (movedTable) {
          await saveRestaurantTableAction({
            id: movedTable.id,
            tableNumber: movedTable.tableNumber,
            name: movedTable.name,
            zone: movedTable.zone,
            seats: movedTable.seats,
            shape: movedTable.shape,
            color: movedTable.color || undefined,
            posX: movedTable.posX,
            posY: movedTable.posY,
          });
          onRefreshData();
        }
      }
      // If only held in place without moving, do nothing (no modal, just released)
    } else {
      // It was a CLEAN CLICK (< 220ms and no drag):
      // OPEN THE MODAL!
      if (isDesignMode) {
        setSelectedTableForInspector(table);
        setIsSidebarOpen(true);
      } else {
        onSelectTable(table);
      }
    }
  };

  // Summary counts
  const totalTables = localTables.length;
  const occupiedTables = localTables.filter((t) => ordersByTable.has(t.tableNumber)).length;
  const freeTables = totalTables - occupiedTables;
  const totalPaxInService = orders.reduce((acc, o) => acc + (o.pax || 2), 0);
  const totalRevenueInService = orders.reduce((acc, o) => acc + o.totalAmount, 0);

  const handleRefreshAll = () => {
    loadZones();
    onRefreshData();
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-2">
      {/* Floor Plan Control Banner */}
      <div className="shrink-0 bg-white py-1.5 px-3 sm:px-4 rounded-xl border border-[#EADBC8] shadow-xs flex flex-wrap items-center justify-between gap-2">
        {/* Metrics Bar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{freeTables} Libres</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 text-xs font-bold text-[#9E2A2B]">
            <span className="w-2 h-2 rounded-full bg-[#9E2A2B] animate-pulse" />
            <span>{occupiedTables} Ocupadas</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-stone-100 text-xs font-semibold text-stone-700">
            <Users className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>{totalPaxInService} personas</span>
          </div>

          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 text-xs font-bold text-amber-900 border border-amber-200">
            <span>Servicio:</span>
            <span className="text-[#9E2A2B]">{totalRevenueInService.toFixed(2)}€</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Usage hint pill: click vs hold */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-stone-600 shadow-2xs">
            <span className="font-bold text-[#9E2A2B]">💡 Clic:</span> comanda
            <span className="text-stone-300">·</span>
            <span className="font-bold text-[#9E2A2B]">Sostener:</span> mover mesa
          </div>

          {/* Snap grid indicator badge */}
          {snapToGrid && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-[10.5px] font-semibold text-stone-600 border border-stone-200">
              <Grid className="w-3 h-3 text-[#D4A373]" />
              <span>Snap 2.5%</span>
            </span>
          )}

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isSidebarOpen
                ? 'bg-[#9E2A2B]/10 text-[#9E2A2B] border border-[#9E2A2B]/30'
                : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#9E2A2B]" />
            <span className="hidden sm:inline">
              {isSidebarOpen ? 'Ocultar Herramientas' : 'Herramientas 2D'}
            </span>
          </button>

          {/* Toggle Design Mode */}
          <button
            type="button"
            onClick={() => {
              const nextMode = !isDesignMode;
              setIsDesignMode(nextMode);
              if (nextMode) setIsSidebarOpen(true);
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isDesignMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-[#2B2523] border border-[#EADBC8]'
            }`}
          >
            {isDesignMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Finalizar Edición</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>Modo Diseño</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Floor Workspace: 2D Canvas + Right Sidebar */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2.5 overflow-hidden">
        {/* 2D Interactive Floor Canvas */}
        <div
          ref={canvasRef}
          onPointerMove={handleTablePointerMove}
          onPointerUp={(e) => {
            if (dragStartInfo.current) {
              const table = localTables.find((t) => t.id === dragStartInfo.current?.tableId);
              if (table) handleTablePointerUp(e, table);
            }
          }}
          className="flex-1 min-h-[420px] w-full relative bg-[#FAF8F5] rounded-2xl border-2 border-[#EADBC8] overflow-hidden select-none shadow-inner"
          style={{
            backgroundImage: 'radial-gradient(#D4A373 0.75px, transparent 0.75px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Dynamic Delimited Zones */}
          {zones.map((zone) => {
            const isBarra = zone.code === 'BARRA';
            const isTerraza = zone.code === 'TERRAZA';

            return (
              <div
                key={zone.id}
                style={{
                  left: `${zone.posX}%`,
                  top: `${zone.posY}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                  borderColor: `${zone.color}66`,
                  backgroundColor: `${zone.color}0D`,
                }}
                className="absolute rounded-2xl border-2 border-dashed p-2.5 pointer-events-none flex flex-col justify-between transition-all"
              >
                <div
                  className="flex items-center gap-1.5 text-xs font-serif font-bold uppercase tracking-wider"
                  style={{ color: zone.color }}
                >
                  {isBarra ? (
                    <Beer className="w-3.5 h-3.5" />
                  ) : isTerraza ? (
                    <Sun className="w-3.5 h-3.5" />
                  ) : (
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                  )}
                  <span className="truncate">{zone.name}</span>
                </div>
                {zone.subtitle && (
                  <span className="text-[10px] text-stone-400 truncate">{zone.subtitle}</span>
                )}
              </div>
            );
          })}

          {/* Render Tables in 2D with Smooth Pointer Drag */}
          {localTables.map((table) => {
            const order = ordersByTable.get(table.tableNumber);
            const isOccupied = !!order;
            const isPending = order?.status === 'PENDING';
            const isPreparing = order?.status === 'PREPARING';
            const isServed = order?.status === 'SERVED';
            const isBeingDragged = draggingTableId === table.id;
            const isSelected = selectedTableForInspector?.id === table.id;

            // Shape styles
            let shapeClasses = 'rounded-full w-18 h-18 sm:w-20 sm:h-20';
            if (table.shape === 'SQUARE') {
              shapeClasses = 'rounded-2xl w-18 h-18 sm:w-20 sm:h-20';
            } else if (table.shape === 'RECTANGLE') {
              shapeClasses = 'rounded-2xl w-24 h-15 sm:w-28 sm:h-17';
            } else if (table.shape === 'BAR_STOOL') {
              shapeClasses = 'rounded-full w-16 h-16 sm:w-18 sm:h-18';
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
                onPointerDown={(e) => handleTablePointerDown(e, table)}
                onPointerMove={handleTablePointerMove}
                onPointerUp={(e) => handleTablePointerUp(e, table)}
                style={{
                  left: `${table.posX}%`,
                  top: `${table.posY}%`,
                  transform: 'translate(-50%, -50%)',
                  touchAction: 'none',
                }}
                className={`absolute select-none transition-[box-shadow,transform] duration-150 ${
                  isBeingDragged || isHoldingTableId === table.id
                    ? 'z-40 scale-105 cursor-grabbing shadow-2xl ring-4 ring-[#9E2A2B]'
                    : isSelected
                    ? 'z-30 ring-3 ring-[#9E2A2B] shadow-xl'
                    : 'z-20 cursor-pointer'
                }`}
              >
                {/* Floating moving badge while holding / dragging */}
                {(isBeingDragged || isHoldingTableId === table.id) && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#9E2A2B] text-white text-[9px] font-bold rounded-full shadow-lg flex items-center gap-1 whitespace-nowrap z-50 pointer-events-none animate-bounce">
                    <Move className="w-2.5 h-2.5" />
                    <span>Moviendo</span>
                  </div>
                )}

                <div
                  className={`relative border-2 flex flex-col items-center justify-center p-1.5 shadow-md transition-transform hover:scale-102 ${shapeClasses} ${statusBorder}`}
                >
                  {/* Table Name */}
                  <span className="font-serif font-bold text-xs sm:text-[13px] text-[#2B2523] px-1 text-center leading-tight whitespace-nowrap">
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

                  {/* Drag indicator in design mode */}
                  {isDesignMode && (
                    <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#9E2A2B] text-white flex items-center justify-center shadow-xs">
                      <Move className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Sidebar with 2D Editing Tools */}
        {isSidebarOpen && (
          <StaffFloorPlanRightSidebar
            isDesignMode={isDesignMode}
            onToggleDesignMode={(active) => setIsDesignMode(active)}
            tables={localTables}
            zones={zones}
            selectedTable={selectedTableForInspector}
            onSelectTable={(table) => setSelectedTableForInspector(table)}
            onRefreshData={handleRefreshAll}
            snapToGrid={snapToGrid}
            onToggleSnapToGrid={(snap) => setSnapToGrid(snap)}
            onClose={() => setIsSidebarOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
