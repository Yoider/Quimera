'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RestaurantTableData,
  RestaurantZoneData,
  ActiveOrderData,
  saveRestaurantTableAction,
  deleteRestaurantTableAction,
  getRestaurantZonesAction,
  saveRestaurantZoneAction,
  deleteRestaurantZoneAction,
  transferTableOrderAction,
  openTableServiceAction,
  closeAndPayTableOrderAction,
} from './orderActions';
import StaffFloorPlanRightSidebar from './StaffFloorPlanRightSidebar';
import StaffCanvasItemToolbar from './StaffCanvasItemToolbar';
import StaffKeyboardShortcutsModal from './StaffKeyboardShortcutsModal';
import StaffTableActionPopover from './StaffTableActionPopover';
import StaffTransferTableModal from './StaffTransferTableModal';
import { ProductItem, CategoryItem } from './StaffWaiterPdaModal';
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
  Keyboard,
  MapPin,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react';

interface StaffFloorPlanViewProps {
  tables: RestaurantTableData[];
  orders: ActiveOrderData[];
  onSelectTable: (table: RestaurantTableData) => void;
  onRefreshData: () => void;
  products?: ProductItem[];
  categories?: CategoryItem[];
  ordersViewMode?: 'floor' | 'kanban';
  onSetOrdersViewMode?: (mode: 'floor' | 'kanban') => void;
  kanbanOrdersCount?: number;
}

export type SelectedCanvasItem =
  | { type: 'zone'; id: string }
  | { type: 'table'; id: string }
  | null;

interface ZoneResizeSession {
  zoneId: string;
  handleType: 'SE' | 'E' | 'S' | 'MOVE';
  startClientX: number;
  startClientY: number;
  startPosX: number;
  startPosY: number;
  startWidth: number;
  startHeight: number;
}

export default function StaffFloorPlanView({
  tables,
  orders,
  onSelectTable,
  onRefreshData,
  products = [],
  categories = [],
  ordersViewMode = 'floor',
  onSetOrdersViewMode,
  kanbanOrdersCount,
}: StaffFloorPlanViewProps) {
  const [isDesignMode, setIsDesignMode] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [selectedTableForInspector, setSelectedTableForInspector] = useState<RestaurantTableData | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState<boolean>(false);

  // Table Action Popover state
  const [activePopoverTable, setActivePopoverTable] = useState<RestaurantTableData | null>(null);

  // Transfer Table Modal state
  const [transferSourceTable, setTransferSourceTable] = useState<RestaurantTableData | null>(null);

  // Right Sidebar active tab
  const [sidebarTab, setSidebarTab] = useState<'tables' | 'zones' | 'inspector' | 'order'>('order');

  // Selected Canvas Item for intelligent Canva-style toolbar & layer manipulation
  const [selectedCanvasItem, setSelectedCanvasItem] = useState<SelectedCanvasItem>(null);

  // Local optimistic tables state for 60fps/120fps fluid movement
  const [localTables, setLocalTables] = useState<RestaurantTableData[]>(tables);
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [isHoldingTableId, setIsHoldingTableId] = useState<string | null>(null);

  // Dynamic Zones state
  const [zones, setZones] = useState<RestaurantZoneData[]>([]);
  const [resizingZoneId, setResizingZoneId] = useState<string | null>(null);
  const zoneResizeSessionRef = useRef<ZoneResizeSession | null>(null);

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

    const hasMoved = info.hasMoved;

    if (hasMoved) {
      // It was an actual DRAG (table position changed):
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
    } else {
      // It was a CLEAN CLICK (no position movement):
      if (!isDesignMode && !isSidebarOpen) {
        // Neither 2D tools nor design mode enabled: OPEN THE POPUP!
        setActivePopoverTable(table);
        setSelectedTableForInspector(table);
        setSelectedCanvasItem(null);
      } else if (isDesignMode) {
        // Design mode enabled: select for layout moving/inspection
        setSelectedCanvasItem({ type: 'table', id: table.id });
        setSelectedTableForInspector(table);
        setSidebarTab('inspector');
        setIsSidebarOpen(true);
      } else if (isSidebarOpen) {
        // 2D Tools sidebar enabled: select table in sidebar
        setSelectedTableForInspector(table);
        setSelectedCanvasItem({ type: 'table', id: table.id });
      }
    }
  };

  // Popover Actions Handlers
  const handleTakeOrder = (table: RestaurantTableData) => {
    setActivePopoverTable(null);
    const isDesktop = typeof window !== 'undefined' ? window.innerWidth >= 1024 : true;
    if (isDesktop) {
      // Open in Right Sidebar on PC
      setSelectedTableForInspector(table);
      setSidebarTab('order');
      setIsSidebarOpen(true);
    } else {
      // Open Waiter PDA Modal on mobile
      onSelectTable(table);
    }
  };

  const handleOpenService = async (table: RestaurantTableData) => {
    setActivePopoverTable(null);
    const res = await openTableServiceAction({
      tableNumber: table.tableNumber,
      pax: table.seats,
    });
    if (res.success) {
      handleRefreshAll();
    }
  };

  const handleTransferTable = (table: RestaurantTableData) => {
    setActivePopoverTable(null);
    setTransferSourceTable(table);
  };

  const handleEditTable = (table: RestaurantTableData) => {
    setActivePopoverTable(null);
    setSelectedTableForInspector(table);
    setSidebarTab('inspector');
    setIsSidebarOpen(true);
  };

  const handlePayOrder = async (orderId: string) => {
    setActivePopoverTable(null);
    const targetOrder = orders.find((o) => o.id === orderId);
    if (confirm(`¿Cobrar la comanda por un total de ${targetOrder ? targetOrder.totalAmount.toFixed(2) : ''}€ y liberar la mesa?`)) {
      await closeAndPayTableOrderAction(orderId);
      handleRefreshAll();
    }
  };

  const handleConfirmTransfer = async (fromTableNumber: string, toTableNumber: string) => {
    const res = await transferTableOrderAction({
      fromTableNumber,
      toTableNumber,
    });
    if (res.success) {
      handleRefreshAll();
    } else {
      alert(res.error || 'Error al traspasar la mesa');
    }
  };

  // Start Direct Zone Resizing or Moving on Canvas
  const handleZoneResizeStart = (
    e: React.PointerEvent,
    zone: RestaurantZoneData,
    handleType: 'SE' | 'E' | 'S' | 'MOVE'
  ) => {
    if (!isDesignMode) return;
    if (e.button !== 0) return;
    e.stopPropagation();

    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.setPointerCapture(e.pointerId);
    } catch (_) {}

    zoneResizeSessionRef.current = {
      zoneId: zone.id,
      handleType,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPosX: zone.posX,
      startPosY: zone.posY,
      startWidth: zone.width,
      startHeight: zone.height,
    };
    setResizingZoneId(zone.id);
    setSelectedCanvasItem({ type: 'zone', id: zone.id });
  };

  // End Direct Zone Resizing or Moving
  const handleZoneResizeEnd = async (e: React.PointerEvent) => {
    e.stopPropagation();
    const targetEl = e.currentTarget as HTMLElement;
    try {
      targetEl.releasePointerCapture(e.pointerId);
    } catch (_) {}

    const session = zoneResizeSessionRef.current;
    zoneResizeSessionRef.current = null;
    setResizingZoneId(null);

    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }

    if (!session) return;

    const currentZone = zones.find((z) => z.id === session.zoneId);
    if (currentZone) {
      await saveRestaurantZoneAction({
        id: currentZone.id,
        code: currentZone.code,
        name: currentZone.name,
        subtitle: currentZone.subtitle,
        color: currentZone.color,
        posX: currentZone.posX,
        posY: currentZone.posY,
        width: currentZone.width,
        height: currentZone.height,
      });
      onRefreshData();
    }
  };

  // Unified Canvas Pointer Move: handles both zone resizing and table dragging
  const handleCanvasPointerMove = (e: React.PointerEvent) => {
    // 1. Zone Resizing / Moving
    if (isDesignMode && zoneResizeSessionRef.current && canvasRef.current) {
      const session = zoneResizeSessionRef.current;
      const rect = canvasRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - session.startClientX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - session.startClientY) / rect.height) * 100;

      pendingPointer.current = { clientX: e.clientX, clientY: e.clientY };

      if (rafId.current === null) {
        rafId.current = requestAnimationFrame(() => {
          rafId.current = null;
          setZones((prev) =>
            prev.map((z) => {
              if (z.id !== session.zoneId) return z;
              let newWidth = z.width;
              let newHeight = z.height;
              let newPosX = z.posX;
              let newPosY = z.posY;

              if (session.handleType === 'SE') {
                newWidth = Math.max(15, Math.min(100 - z.posX, session.startWidth + deltaXPercent));
                newHeight = Math.max(15, Math.min(100 - z.posY, session.startHeight + deltaYPercent));
              } else if (session.handleType === 'E') {
                newWidth = Math.max(15, Math.min(100 - z.posX, session.startWidth + deltaXPercent));
              } else if (session.handleType === 'S') {
                newHeight = Math.max(15, Math.min(100 - z.posY, session.startHeight + deltaYPercent));
              } else if (session.handleType === 'MOVE') {
                newPosX = Math.max(0, Math.min(100 - z.width, session.startPosX + deltaXPercent));
                newPosY = Math.max(0, Math.min(100 - z.height, session.startPosY + deltaYPercent));
              }

              if (snapToGrid) {
                newWidth = Math.round(newWidth / 2.5) * 2.5;
                newHeight = Math.round(newHeight / 2.5) * 2.5;
                newPosX = Math.round(newPosX / 2.5) * 2.5;
                newPosY = Math.round(newPosY / 2.5) * 2.5;
              }

              return {
                ...z,
                posX: Math.round(newPosX * 10) / 10,
                posY: Math.round(newPosY * 10) / 10,
                width: Math.round(newWidth * 10) / 10,
                height: Math.round(newHeight * 10) / 10,
              };
            })
          );
        });
      }
      return;
    }

    // 2. Table Dragging
    handleTablePointerMove(e);
  };


  // Toolbar Actions: Update Zone
  const handleUpdateZoneFromToolbar = async (zoneId: string, updates: Partial<RestaurantZoneData>) => {
    const target = zones.find((z) => z.id === zoneId);
    if (!target) return;
    const updated = { ...target, ...updates };
    setZones((prev) => prev.map((z) => (z.id === zoneId ? updated : z)));
    await saveRestaurantZoneAction({
      id: updated.id,
      code: updated.code,
      name: updated.name,
      subtitle: updated.subtitle,
      color: updated.color,
      posX: updated.posX,
      posY: updated.posY,
      width: updated.width,
      height: updated.height,
    });
    onRefreshData();
  };

  // Toolbar Actions: Delete Zone
  const handleDeleteZoneFromToolbar = async (zoneId: string) => {
    setZones((prev) => prev.filter((z) => z.id !== zoneId));
    setSelectedCanvasItem(null);
    await deleteRestaurantZoneAction(zoneId);
    onRefreshData();
  };

  // Toolbar Actions: Add Table inside Zone
  const handleAddTableInZone = async (zone: RestaurantZoneData) => {
    const existingNums = localTables.map((t) => {
      const n = parseInt(t.tableNumber.replace(/\D/g, ''), 10);
      return isNaN(n) ? 0 : n;
    });
    const nextNum = Math.max(0, ...existingNums) + 1 || localTables.length + 1;
    const newName = `Mesa ${nextNum}`;
    const newX = Math.min(90, Math.max(10, Math.round((zone.posX + zone.width / 2) * 10) / 10));
    const newY = Math.min(90, Math.max(10, Math.round((zone.posY + zone.height / 2) * 10) / 10));

    const res = await saveRestaurantTableAction({
      tableNumber: `T${nextNum}`,
      name: newName,
      zone: zone.code,
      seats: 4,
      shape: 'ROUND',
      color: zone.color,
      posX: newX,
      posY: newY,
    });

    if (res.success && res.table) {
      setLocalTables((prev) => [...prev, res.table!]);
      setSelectedCanvasItem({ type: 'table', id: res.table.id });
      onRefreshData();
    }
  };

  // Toolbar Actions: Reorder Layers
  const handleBringForwardZone = (zoneId: string) => {
    setZones((prev) => {
      const idx = prev.findIndex((z) => z.id === zoneId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.push(item);
      return next;
    });
  };

  const handleSendBackwardZone = (zoneId: string) => {
    setZones((prev) => {
      const idx = prev.findIndex((z) => z.id === zoneId);
      if (idx <= 0) return prev;
      const next = [...prev];
      const [item] = next.splice(idx, 1);
      next.unshift(item);
      return next;
    });
  };

  // Toolbar Actions: Update Table
  const handleUpdateTableFromToolbar = async (tableId: string, updates: Partial<RestaurantTableData>) => {
    const target = localTables.find((t) => t.id === tableId);
    if (!target) return;
    const updated = { ...target, ...updates };
    setLocalTables((prev) => prev.map((t) => (t.id === tableId ? updated : t)));
    await saveRestaurantTableAction({
      id: updated.id,
      tableNumber: updated.tableNumber,
      name: updated.name,
      zone: updated.zone,
      seats: updated.seats,
      shape: updated.shape,
      color: updated.color || undefined,
      posX: updated.posX,
      posY: updated.posY,
    });
    onRefreshData();
  };

  // Toolbar Actions: Delete Table
  const handleDeleteTableFromToolbar = async (table: RestaurantTableData) => {
    setLocalTables((prev) => prev.filter((t) => t.id !== table.id));
    setSelectedCanvasItem(null);
    await deleteRestaurantTableAction(table.id);
    onRefreshData();
  };

  // Comprehensive Keyboard Shortcuts Listener for 2D Floor Plan & Service
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isInput =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        Boolean(target?.isContentEditable);

      // 1. Safeguard: if writing inside any input/textarea, pause board shortcuts
      if (isInput) {
        if (e.key === 'Escape') {
          target?.blur();
        }
        return;
      }

      // 2. Open / Close Shortcuts Help Modal ('?' or '/')
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 3. Escape: Close popover, transfer modal, shortcuts modal, or clear selection
      if (e.key === 'Escape') {
        if (activePopoverTable) {
          setActivePopoverTable(null);
          return;
        }
        if (transferSourceTable) {
          setTransferSourceTable(null);
          return;
        }
        if (isShortcutsModalOpen) {
          setIsShortcutsModalOpen(false);
          return;
        }
        setSelectedCanvasItem(null);
        return;
      }

      // 4. Tab / Shift+Tab: Cycle through tables in order
      if (e.key === 'Tab') {
        if (localTables.length === 0) return;
        e.preventDefault();

        const currentIdx = localTables.findIndex(
          (t) => selectedCanvasItem?.type === 'table' && selectedCanvasItem.id === t.id
        );

        let nextIdx: number;
        if (e.shiftKey) {
          // Shift+Tab: Previous table
          nextIdx = currentIdx <= 0 ? localTables.length - 1 : currentIdx - 1;
        } else {
          // Tab: Next table
          nextIdx = currentIdx === -1 || currentIdx >= localTables.length - 1 ? 0 : currentIdx + 1;
        }

        const targetTable = localTables[nextIdx];
        if (targetTable) {
          setSelectedCanvasItem({ type: 'table', id: targetTable.id });
          setSelectedTableForInspector(targetTable);
        }
        return;
      }

      // 5. Enter or Space: Open Table Options Popover
      if (e.key === 'Enter' || e.key === ' ') {
        if (selectedCanvasItem?.type === 'table') {
          const targetTable = localTables.find((t) => t.id === selectedCanvasItem.id);
          if (targetTable) {
            e.preventDefault();
            if (isDesignMode) {
              setSelectedTableForInspector(targetTable);
              setSidebarTab('inspector');
              setIsSidebarOpen(true);
            } else {
              setActivePopoverTable(targetTable);
            }
          }
        }
        return;
      }

      // 6. Arrow Keys: Move selected table or zone
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();

        // Step size: Shift (5%), Alt (1%), Default (snapToGrid ? 2.5% : 1%)
        const step = e.shiftKey ? 5 : e.altKey ? 1 : snapToGrid ? 2.5 : 1;
        const dx = e.key === 'ArrowRight' ? step : e.key === 'ArrowLeft' ? -step : 0;
        const dy = e.key === 'ArrowDown' ? step : e.key === 'ArrowUp' ? -step : 0;

        // A) Moving a TABLE
        if (selectedCanvasItem?.type === 'table') {
          const tableId = selectedCanvasItem.id;
          const currentTable = localTables.find((t) => t.id === tableId);
          if (!currentTable) return;

          const nextX = Math.round(Math.max(5, Math.min(95, currentTable.posX + dx)) * 10) / 10;
          const nextY = Math.round(Math.max(5, Math.min(95, currentTable.posY + dy)) * 10) / 10;

          const updated = { ...currentTable, posX: nextX, posY: nextY };
          setLocalTables((prev) => prev.map((t) => (t.id === tableId ? updated : t)));

          saveRestaurantTableAction({
            id: updated.id,
            tableNumber: updated.tableNumber,
            name: updated.name,
            zone: updated.zone,
            seats: updated.seats,
            shape: updated.shape,
            color: updated.color || undefined,
            posX: updated.posX,
            posY: updated.posY,
          }).then(() => onRefreshData());
          return;
        }

        // B) Moving a ZONE (only when design mode / edition is ON)
        if (selectedCanvasItem?.type === 'zone') {
          if (!isDesignMode) return;
          const zoneId = selectedCanvasItem.id;
          const currentZone = zones.find((z) => z.id === zoneId);
          if (!currentZone) return;

          const nextX = Math.round(Math.max(0, Math.min(100 - currentZone.width, currentZone.posX + dx)) * 10) / 10;
          const nextY = Math.round(Math.max(0, Math.min(100 - currentZone.height, currentZone.posY + dy)) * 10) / 10;

          const updated = { ...currentZone, posX: nextX, posY: nextY };
          setZones((prev) => prev.map((z) => (z.id === zoneId ? updated : z)));

          saveRestaurantZoneAction({
            id: updated.id,
            code: updated.code,
            name: updated.name,
            subtitle: updated.subtitle,
            color: updated.color,
            posX: updated.posX,
            posY: updated.posY,
            width: updated.width,
            height: updated.height,
          }).then(() => onRefreshData());
          return;
        }
        return;
      }

      // 7. Mode toggles:
      // 'D': Toggle Design Mode
      if ((e.key === 'd' || e.key === 'D') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsDesignMode((prev) => {
          const next = !prev;
          if (next) {
            setIsSidebarOpen(true);
          } else {
            setSelectedCanvasItem(null);
          }
          return next;
        });
        return;
      }

      // 'G': Toggle Snap to Grid
      if ((e.key === 'g' || e.key === 'G') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setSnapToGrid((prev) => !prev);
        return;
      }

      // 'S': Toggle Right Sidebar
      if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsSidebarOpen((prev) => !prev);
        return;
      }

      // 8. Quick item additions:
      // 'T' or 'M': Quick Add Table
      if ((e.key === 't' || e.key === 'T' || e.key === 'm' || e.key === 'M') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const activeZone =
          selectedCanvasItem?.type === 'zone'
            ? zones.find((z) => z.id === selectedCanvasItem.id)
            : zones[0];
        if (activeZone) {
          handleAddTableInZone(activeZone);
        }
        return;
      }

      // 'Z': Delimit/Select Zone or trigger new zone sidebar
      if ((e.key === 'z' || e.key === 'Z') && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsSidebarOpen(true);
        return;
      }

      // 9. Delete / Backspace: Remove selected table or zone
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedCanvasItem?.type === 'table') {
          const targetTable = localTables.find((t) => t.id === selectedCanvasItem.id);
          if (targetTable) {
            e.preventDefault();
            if (confirm(`¿Eliminar la mesa "${targetTable.name}" del plano?`)) {
              handleDeleteTableFromToolbar(targetTable);
            }
          }
          return;
        }

        if (selectedCanvasItem?.type === 'zone') {
          const targetZone = zones.find((z) => z.id === selectedCanvasItem.id);
          if (targetZone) {
            e.preventDefault();
            if (confirm(`¿Eliminar la zona "${targetZone.name}" del plano?`)) {
              handleDeleteZoneFromToolbar(targetZone.id);
            }
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    localTables,
    zones,
    selectedCanvasItem,
    isDesignMode,
    snapToGrid,
    isShortcutsModalOpen,
    onSelectTable,
    onRefreshData,
  ]);

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
      {/* Floor Plan Control Banner (Unificada y Compacta) */}
      <div className="shrink-0 bg-white py-1.5 px-3 sm:px-4 rounded-xl border border-[#EADBC8] shadow-xs flex flex-wrap items-center justify-between gap-2">
        {/* Left: View Switcher (Plano 2D vs Kanban + Refresh) */}
        {onSetOrdersViewMode ? (
          <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#EADBC8]">
            <button
              type="button"
              onClick={() => onSetOrdersViewMode('floor')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
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
              onClick={() => onSetOrdersViewMode('kanban')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                ordersViewMode === 'kanban'
                  ? 'bg-[#9E2A2B] text-white shadow-xs'
                  : 'text-stone-600 hover:text-[#2B2523] hover:bg-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tablero Kanban ({kanbanOrdersCount ?? orders.length})</span>
            </button>

            <button
              type="button"
              onClick={handleRefreshAll}
              className="p-1 rounded-lg text-stone-400 hover:text-[#2B2523] hover:bg-white transition-colors cursor-pointer"
              title="Actualizar mesas y comandas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* Right: Action Controls */}
        <div className="flex items-center gap-2">
          {/* Usage hint pill: click vs hold */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200 text-[11px] text-stone-600 shadow-2xs">
            <span className="font-bold text-[#9E2A2B]">💡 Clic:</span> comanda
            <span className="text-stone-300">·</span>
            <span className="font-bold text-[#9E2A2B]">Sostener:</span> mover mesa
          </div>

          {/* Snap grid indicator badge */}
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10.5px] font-semibold border cursor-pointer transition-colors ${
              snapToGrid
                ? 'bg-stone-100 text-stone-700 border-stone-300 hover:bg-stone-200'
                : 'bg-stone-50 text-stone-400 border-dashed border-stone-200 hover:bg-stone-100'
            }`}
            title="Conmutar Snap 2.5% a rejilla (tecla G)"
          >
            <Grid className={`w-3 h-3 ${snapToGrid ? 'text-[#D4A373]' : 'text-stone-400'}`} />
            <span>Snap 2.5%</span>
            <kbd className="px-1 py-0.2 rounded bg-white text-[9px] font-mono font-bold text-stone-500 border border-stone-200">
              G
            </kbd>
          </button>

          {/* Shortcuts Modal Trigger Button */}
          <button
            type="button"
            onClick={() => setIsShortcutsModalOpen(true)}
            className="px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs bg-white hover:bg-stone-50 text-stone-700 border border-stone-200"
            title="Ver guía completa de atajos de teclado (tecla ?)"
          >
            <Keyboard className="w-3.5 h-3.5 text-[#9E2A2B]" />
            <span className="hidden sm:inline">Atajos</span>
            <kbd className="hidden md:inline px-1 py-0.2 rounded bg-stone-100 text-[9.5px] font-mono font-bold text-stone-600 border border-stone-300">
              ?
            </kbd>
          </button>

          {/* Toggle Sidebar Button */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isSidebarOpen
                ? 'bg-[#9E2A2B]/10 text-[#9E2A2B] border border-[#9E2A2B]/30'
                : 'bg-white hover:bg-stone-50 text-stone-700 border border-stone-200'
            }`}
            title="Mostrar u ocultar herramientas laterales (tecla S)"
          >
            <Sliders className="w-3.5 h-3.5 text-[#9E2A2B]" />
            <span className="hidden sm:inline">
              {isSidebarOpen ? 'Ocultar Herramientas' : 'Herramientas 2D'}
            </span>
            <kbd className="hidden lg:inline px-1 py-0.2 rounded bg-white text-[9px] font-mono font-bold text-stone-500 border border-stone-200">
              S
            </kbd>
          </button>

          {/* Toggle Design Mode */}
          <button
            type="button"
            onClick={() => {
              const nextMode = !isDesignMode;
              setIsDesignMode(nextMode);
              if (nextMode) {
                setIsSidebarOpen(true);
              } else {
                setSelectedCanvasItem(null);
              }
            }}
            className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
              isDesignMode
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-[#2B2523] border border-[#EADBC8]'
            }`}
            title="Alternar modo de diseño y edición del plano (tecla D)"
          >
            {isDesignMode ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Finalizar (D)</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3.5 h-3.5 text-[#9E2A2B]" />
                <span>Modo Diseño (D)</span>
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
          onPointerMove={handleCanvasPointerMove}
          onPointerUp={(e) => {
            if (zoneResizeSessionRef.current) {
              handleZoneResizeEnd(e);
            } else if (dragStartInfo.current) {
              const table = localTables.find((t) => t.id === dragStartInfo.current?.tableId);
              if (table) handleTablePointerUp(e, table);
            }
          }}
          onClick={() => {
            setSelectedCanvasItem(null);
            setActivePopoverTable(null);
            if (!isSidebarOpen) {
              setSelectedTableForInspector(null);
            }
          }}
          className="flex-1 min-h-[420px] w-full relative bg-[#FAF8F5] rounded-2xl border-2 border-[#EADBC8] overflow-hidden select-none shadow-inner"
          style={{
            backgroundImage: 'radial-gradient(#D4A373 0.75px, transparent 0.75px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Live Floor Metrics in Top-Left Corner (Sin fondo ni marco, ordenadas verticalmente) */}
          <div className="absolute top-3 left-4 z-20 pointer-events-none select-none flex flex-col gap-1.5">
            {/* 1. Libres */}
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-2xs" />
              <span>{freeTables} Libres</span>
            </div>

            {/* 2. Ocupadas */}
            <div className="flex items-center gap-2 text-xs font-bold text-[#9E2A2B] tracking-tight">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9E2A2B] shrink-0 animate-pulse" />
              <span>{occupiedTables} Ocupadas</span>
            </div>

            {/* 3. Personas */}
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-600 tracking-tight">
              <Users className="w-3.5 h-3.5 text-[#D4A373] shrink-0" />
              <span>{totalPaxInService} personas</span>
            </div>

            {/* 4. Servicio */}
            <div className="flex items-center gap-2 text-xs font-bold text-stone-800 tracking-tight">
              <span className="text-[#9E2A2B] text-xs font-black leading-none">€</span>
              <span>Servicio: <span className="text-[#9E2A2B] font-extrabold">{totalRevenueInService.toFixed(2)}€</span></span>
            </div>
          </div>

          {/* Canva-Style Floating Contextual Toolbar for Selected Item */}
          <StaffCanvasItemToolbar
            selectedItem={
              selectedCanvasItem?.type === 'zone' && isDesignMode
                ? (() => {
                    const z = zones.find((item) => item.id === selectedCanvasItem.id);
                    return z ? { type: 'zone', zone: z } : null;
                  })()
                : selectedCanvasItem?.type === 'table' && isDesignMode
                ? (() => {
                    const t = localTables.find((item) => item.id === selectedCanvasItem.id);
                    return t ? { type: 'table', table: t } : null;
                  })()
                : null
            }
            allZones={zones}
            onUpdateZone={handleUpdateZoneFromToolbar}
            onDeleteZone={handleDeleteZoneFromToolbar}
            onAddTableInZone={handleAddTableInZone}
            onBringForwardZone={handleBringForwardZone}
            onSendBackwardZone={handleSendBackwardZone}
            onUpdateTable={handleUpdateTableFromToolbar}
            onDeleteTable={handleDeleteTableFromToolbar}
            onOpenTableOrder={(table) => onSelectTable(table)}
            onDeselect={() => setSelectedCanvasItem(null)}
          />

          {/* Dynamic Delimited Zones with Direct Interactive Resize Handles */}
          {zones.map((zone, zoneIdx) => {
            const isBarra = zone.code === 'BARRA';
            const isTerraza = zone.code === 'TERRAZA';
            const isSelected = selectedCanvasItem?.type === 'zone' && selectedCanvasItem.id === zone.id && isDesignMode;
            const isResizing = resizingZoneId === zone.id && isDesignMode;

            return (
              <div
                key={zone.id}
                onClick={(e) => {
                  if (isDesignMode) {
                    e.stopPropagation();
                    setSelectedCanvasItem({ type: 'zone', id: zone.id });
                  }
                }}
                style={{
                  left: `${zone.posX}%`,
                  top: `${zone.posY}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                  borderColor: isSelected ? zone.color : `${zone.color}66`,
                  backgroundColor: isSelected ? `${zone.color}1F` : `${zone.color}0D`,
                  zIndex: isSelected || isResizing ? 25 : 10 + zoneIdx,
                }}
                className={`absolute rounded-2xl border-2 p-2.5 flex flex-col justify-between transition-[background-color,border-color,box-shadow] select-none ${
                  isSelected
                    ? 'border-solid shadow-xl ring-2 ring-offset-1 ring-[#9E2A2B]/70 cursor-default'
                    : isDesignMode
                    ? 'border-dashed hover:border-solid hover:shadow-md cursor-pointer'
                    : 'border-dashed cursor-default'
                }`}
              >
                {/* Zone Header with title and Drag/Move handle */}
                <div className={`flex items-center justify-between gap-1 ${zone.posX <= 5 && zone.posY <= 5 ? 'pl-28' : ''}`}>
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

                  {/* Move Handle (when selected in design mode) */}
                  {isSelected && isDesignMode && (
                    <div
                      onPointerDown={(e) => handleZoneResizeStart(e, zone, 'MOVE')}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1F1B1A]/80 text-[#D4A373] text-[10px] font-semibold cursor-move shadow-xs hover:bg-[#1F1B1A]"
                      title="Arrastra para mover la zona"
                    >
                      <Move className="w-3 h-3" />
                      <span className="hidden sm:inline">Mover</span>
                    </div>
                  )}
                </div>

                {zone.subtitle && (
                  <span className="text-[10px] text-stone-400 truncate">{zone.subtitle}</span>
                )}

                {/* Resize Handles and Dimension Indicator (when selected in design mode) */}
                {isSelected && isDesignMode && (
                  <>
                    {/* Dimension Tag */}
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-[#1F1B1A] text-[#D4A373] border border-stone-700 px-2 py-0.5 rounded-full text-[9.5px] font-mono font-bold shadow-md whitespace-nowrap pointer-events-none z-30">
                      {Math.round(zone.width)}% × {Math.round(zone.height)}%
                    </div>

                    {/* Corner SE Handle (Bottom-Right: Width + Height) */}
                    <div
                      onPointerDown={(e) => handleZoneResizeStart(e, zone, 'SE')}
                      className="absolute -bottom-2 -right-2 w-5 h-5 rounded-full bg-white border-2 border-[#9E2A2B] shadow-lg hover:scale-125 transition-transform cursor-se-resize flex items-center justify-center z-40"
                      title="Arrastra para redimensionar ancho y alto"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#9E2A2B]" />
                    </div>

                    {/* Edge E Handle (Right Border: Width only) */}
                    <div
                      onPointerDown={(e) => handleZoneResizeStart(e, zone, 'E')}
                      className="absolute top-1/2 -right-2 -translate-y-1/2 w-4 h-8 rounded-full bg-white border-2 border-[#9E2A2B] shadow-md hover:scale-115 transition-transform cursor-ew-resize flex items-center justify-center z-40"
                      title="Arrastra para estirar ancho"
                    >
                      <div className="w-1 h-4 rounded-full bg-[#9E2A2B]" />
                    </div>

                    {/* Edge S Handle (Bottom Border: Height only) */}
                    <div
                      onPointerDown={(e) => handleZoneResizeStart(e, zone, 'S')}
                      className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-4 rounded-full bg-white border-2 border-[#9E2A2B] shadow-md hover:scale-115 transition-transform cursor-ns-resize flex items-center justify-center z-40"
                      title="Arrastra para estirar alto"
                    >
                      <div className="w-4 h-1 rounded-full bg-[#9E2A2B]" />
                    </div>
                  </>
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
            const isSelected =
              selectedTableForInspector?.id === table.id ||
              (selectedCanvasItem?.type === 'table' && selectedCanvasItem.id === table.id);

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
                onClick={(e) => {
                  e.stopPropagation();
                  if (dragStartInfo.current?.hasMoved) return;

                  if (!isDesignMode && !isSidebarOpen) {
                    setActivePopoverTable(table);
                    setSelectedTableForInspector(table);
                    setSelectedCanvasItem(null);
                  } else if (isDesignMode) {
                    setSelectedCanvasItem({ type: 'table', id: table.id });
                    setSelectedTableForInspector(table);
                    setSidebarTab('inspector');
                    setIsSidebarOpen(true);
                  } else if (isSidebarOpen) {
                    setSelectedTableForInspector(table);
                    setSelectedCanvasItem({ type: 'table', id: table.id });
                  }
                }}
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

          {/* Table Action Popover */}
          {activePopoverTable && (
            <StaffTableActionPopover
              table={activePopoverTable}
              order={ordersByTable.get(activePopoverTable.tableNumber)}
              onClose={() => setActivePopoverTable(null)}
              onOpenService={handleOpenService}
              onTakeOrder={handleTakeOrder}
              onTransferTable={handleTransferTable}
              onEditTable={handleEditTable}
              onPayOrder={handlePayOrder}
            />
          )}
        </div>

        {/* Right Sidebar with 2D Editing Tools & Order Taking */}
        {isSidebarOpen && (
          <StaffFloorPlanRightSidebar
            isDesignMode={isDesignMode}
            onToggleDesignMode={(active) => {
              setIsDesignMode(active);
              if (!active) {
                setSelectedCanvasItem(null);
              }
            }}
            tables={localTables}
            zones={zones}
            selectedTable={selectedTableForInspector}
            onSelectTable={(table) => {
              setSelectedTableForInspector(table);
              if (table) setSelectedCanvasItem({ type: 'table', id: table.id });
            }}
            onRefreshData={handleRefreshAll}
            snapToGrid={snapToGrid}
            onToggleSnapToGrid={(snap) => setSnapToGrid(snap)}
            onClose={() => setIsSidebarOpen(false)}
            activeOrder={
              selectedTableForInspector
                ? ordersByTable.get(selectedTableForInspector.tableNumber) || null
                : null
            }
            products={products}
            categories={categories}
            activeTab={sidebarTab}
            onTabChange={(tab) => setSidebarTab(tab)}
            onOrderSaved={handleRefreshAll}
          />
        )}
      </div>

      {/* Keyboard Shortcuts Interactive Modal */}
      <StaffKeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Transfer Table Modal */}
      {transferSourceTable && (
        <StaffTransferTableModal
          isOpen={true}
          onClose={() => setTransferSourceTable(null)}
          sourceTable={transferSourceTable}
          sourceOrder={ordersByTable.get(transferSourceTable.tableNumber)}
          allTables={localTables}
          orders={orders}
          onConfirmTransfer={handleConfirmTransfer}
        />
      )}
    </div>
  );
}
