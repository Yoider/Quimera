'use client';

import React, { useState } from 'react';
import {
  RestaurantTableData,
  RestaurantZoneData,
  saveRestaurantTableAction,
  deleteRestaurantTableAction,
  saveRestaurantZoneAction,
  deleteRestaurantZoneAction,
} from './orderActions';
import {
  Plus,
  Trash2,
  Users,
  Grid,
  Maximize2,
  Check,
  Edit3,
  Sliders,
  Layers,
  Sparkles,
  Move,
  X,
  Palette,
  RotateCcw,
  Square,
  Circle,
  RectangleHorizontal,
} from 'lucide-react';

interface StaffFloorPlanRightSidebarProps {
  isDesignMode: boolean;
  onToggleDesignMode: (active: boolean) => void;
  tables: RestaurantTableData[];
  zones: RestaurantZoneData[];
  selectedTable: RestaurantTableData | null;
  onSelectTable: (table: RestaurantTableData | null) => void;
  onRefreshData: () => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: (snap: boolean) => void;
  onClose?: () => void;
}

export default function StaffFloorPlanRightSidebar({
  isDesignMode,
  onToggleDesignMode,
  tables,
  zones,
  selectedTable,
  onSelectTable,
  onRefreshData,
  snapToGrid,
  onToggleSnapToGrid,
  onClose,
}: StaffFloorPlanRightSidebarProps) {
  const [activeTab, setActiveTab] = useState<'tables' | 'zones' | 'inspector'>(
    selectedTable ? 'inspector' : 'tables'
  );

  // New table form state
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableName, setNewTableName] = useState('');
  const [newTableZone, setNewTableZone] = useState('SALON');
  const [newTableSeats, setNewTableSeats] = useState(4);
  const [newTableShape, setNewTableShape] = useState<'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR_STOOL'>('ROUND');
  const [isSubmittingTable, setIsSubmittingTable] = useState(false);

  // Zone editor state
  const [selectedZoneCode, setSelectedZoneCode] = useState<string>(zones[0]?.code || 'SALON');
  const currentZone = zones.find((z) => z.code === selectedZoneCode) || zones[0];
  const [isNewZoneModalOpen, setIsNewZoneModalOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneSubtitle, setNewZoneSubtitle] = useState('');
  const [newZoneColor, setNewZoneColor] = useState('#D4A373');

  // Selected table inspector state
  const [inspectorName, setInspectorName] = useState(selectedTable?.name || '');
  const [inspectorSeats, setInspectorSeats] = useState(selectedTable?.seats || 4);
  const [inspectorZone, setInspectorZone] = useState(selectedTable?.zone || 'SALON');
  const [inspectorShape, setInspectorShape] = useState(selectedTable?.shape || 'ROUND');

  // Sync inspector when selected table changes
  React.useEffect(() => {
    if (selectedTable) {
      setInspectorName(selectedTable.name);
      setInspectorSeats(selectedTable.seats);
      setInspectorZone(selectedTable.zone);
      setInspectorShape(selectedTable.shape);
      setActiveTab('inspector');
    }
  }, [selectedTable]);

  // Handle Quick Add Table
  const handleQuickAdd = async (preset: {
    shape: 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR_STOOL';
    seats: number;
    zone: string;
  }) => {
    setIsSubmittingTable(true);
    const zoneTables = tables.filter((t) => t.zone === preset.zone);
    const nextIndex = zoneTables.length + 1;
    const prefix = preset.zone === 'BARRA' ? 'Barra' : preset.zone === 'TERRAZA' ? 'Terraza' : 'Mesa';
    const tableName = `${prefix} ${nextIndex}`;

    // Calculate smart initial position
    const currentZoneObj = zones.find((z) => z.code === preset.zone);
    const initialX = currentZoneObj ? currentZoneObj.posX + currentZoneObj.width / 2 : 50;
    const initialY = currentZoneObj ? currentZoneObj.posY + currentZoneObj.height / 2 : 50;

    await saveRestaurantTableAction({
      tableNumber: tableName,
      name: tableName,
      zone: preset.zone,
      seats: preset.seats,
      shape: preset.shape,
      color: preset.zone === 'BARRA' ? '#D4A373' : preset.zone === 'TERRAZA' ? '#2A9D8F' : '#9E2A2B',
      posX: Math.round(initialX),
      posY: Math.round(initialY),
    });

    setIsSubmittingTable(false);
    onRefreshData();
  };

  // Handle Custom Add Table
  const handleCreateCustomTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    setIsSubmittingTable(true);
    const currentZoneObj = zones.find((z) => z.code === newTableZone);
    const initialX = currentZoneObj ? currentZoneObj.posX + currentZoneObj.width / 2 : 50;
    const initialY = currentZoneObj ? currentZoneObj.posY + currentZoneObj.height / 2 : 50;

    await saveRestaurantTableAction({
      tableNumber: newTableNumber.trim() || newTableName.trim(),
      name: newTableName.trim(),
      zone: newTableZone,
      seats: newTableSeats,
      shape: newTableShape,
      color: newTableZone === 'BARRA' ? '#D4A373' : newTableZone === 'TERRAZA' ? '#2A9D8F' : '#9E2A2B',
      posX: Math.round(initialX),
      posY: Math.round(initialY),
    });

    setNewTableName('');
    setNewTableNumber('');
    setIsSubmittingTable(false);
    onRefreshData();
  };

  // Save selected table changes
  const handleSaveInspectorChanges = async () => {
    if (!selectedTable) return;
    await saveRestaurantTableAction({
      id: selectedTable.id,
      tableNumber: selectedTable.tableNumber,
      name: inspectorName.trim() || selectedTable.name,
      zone: inspectorZone,
      seats: inspectorSeats,
      shape: inspectorShape,
      posX: selectedTable.posX,
      posY: selectedTable.posY,
      color: selectedTable.color || undefined,
    });
    onRefreshData();
  };

  // Delete selected table
  const handleDeleteSelectedTable = async () => {
    if (!selectedTable) return;
    if (confirm(`¿Eliminar la mesa "${selectedTable.name}" del plano?`)) {
      await deleteRestaurantTableAction(selectedTable.id);
      onSelectTable(null);
      setActiveTab('tables');
      onRefreshData();
    }
  };

  // Update Zone Dimensions
  const handleUpdateZone = async (updates: Partial<RestaurantZoneData>) => {
    if (!currentZone) return;
    await saveRestaurantZoneAction({
      id: currentZone.id,
      code: currentZone.code,
      name: updates.name ?? currentZone.name,
      subtitle: updates.subtitle ?? currentZone.subtitle,
      color: updates.color ?? currentZone.color,
      posX: updates.posX ?? currentZone.posX,
      posY: updates.posY ?? currentZone.posY,
      width: updates.width ?? currentZone.width,
      height: updates.height ?? currentZone.height,
    });
    onRefreshData();
  };

  // Create new custom zone
  const handleCreateNewZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;
    const code = `ZONA_${Date.now()}`;
    await saveRestaurantZoneAction({
      code,
      name: newZoneName.trim(),
      subtitle: newZoneSubtitle.trim() || undefined,
      color: newZoneColor,
      posX: 10,
      posY: 10,
      width: 40,
      height: 40,
    });
    setIsNewZoneModalOpen(false);
    setNewZoneName('');
    setNewZoneSubtitle('');
    setSelectedZoneCode(code);
    onRefreshData();
  };

  return (
    <div className="w-full lg:w-76 2xl:w-80 bg-white border-l border-[#EADBC8] flex flex-col h-full shadow-lg select-none text-[#2B2523] shrink-0">
      {/* Header */}
      <div className="p-3 border-b border-[#EADBC8] bg-[#FAF8F5] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B]">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#2B2523] leading-none">
              Herramientas 2D
            </h4>
            <span className="text-[10px] text-stone-500 font-semibold block mt-0.5">
              Edición & Delimitación
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle Edit Mode Switch */}
          <button
            type="button"
            onClick={() => onToggleDesignMode(!isDesignMode)}
            className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs ${
              isDesignMode
                ? 'bg-emerald-600 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
            }`}
            title="Activar o desactivar modo edición"
          >
            {isDesignMode ? (
              <>
                <Check className="w-3 h-3" />
                <span>Edición ON</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3 text-[#9E2A2B]" />
                <span>Editar</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Segment Navigation */}
      <div className="p-2 border-b border-[#EADBC8] bg-white flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('tables')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'tables'
              ? 'bg-[#9E2A2B] text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Mesas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('zones')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
            activeTab === 'zones'
              ? 'bg-[#9E2A2B] text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Zonas</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('inspector')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer relative ${
            activeTab === 'inspector'
              ? 'bg-[#9E2A2B] text-white shadow-xs'
              : selectedTable
              ? 'text-[#9E2A2B] bg-[#9E2A2B]/10 font-bold'
              : 'text-stone-600 hover:bg-stone-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ficha</span>
          {selectedTable && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#9E2A2B] absolute top-1 right-1" />
          )}
        </button>
      </div>

      {/* Tab Contents: Scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3.5 custom-scrollbar text-xs">
        {/* ================= TAB: AGREGAR MESAS ================= */}
        {activeTab === 'tables' && (
          <div className="space-y-3 animate-in fade-in">
            {/* Quick Presets */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                Añadido Rápido con 1 Clic
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickAdd({ shape: 'BAR_STOOL', seats: 1, zone: 'BARRA' })}
                  disabled={isSubmittingTable}
                  className="p-2 rounded-xl border border-[#EADBC8] bg-white hover:border-[#D4A373] hover:bg-amber-50/30 flex items-center gap-2 transition-all cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center shrink-0">
                    <Circle className="w-3.5 h-3.5 text-[#D4A373]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[11px] block truncate">Taburete (1p)</span>
                    <span className="text-[9.5px] text-stone-500">Barra Tapeo</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAdd({ shape: 'SQUARE', seats: 2, zone: 'SALON' })}
                  disabled={isSubmittingTable}
                  className="p-2 rounded-xl border border-[#EADBC8] bg-white hover:border-[#9E2A2B] hover:bg-rose-50/30 flex items-center gap-2 transition-all cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0">
                    <Square className="w-3.5 h-3.5 text-[#9E2A2B]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[11px] block truncate">Cuadrada (2p)</span>
                    <span className="text-[9.5px] text-stone-500">Salón Interior</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAdd({ shape: 'ROUND', seats: 4, zone: 'SALON' })}
                  disabled={isSubmittingTable}
                  className="p-2 rounded-xl border border-[#EADBC8] bg-white hover:border-[#9E2A2B] hover:bg-rose-50/30 flex items-center gap-2 transition-all cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-100 border border-rose-300 flex items-center justify-center shrink-0">
                    <Circle className="w-3.5 h-3.5 text-[#9E2A2B]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[11px] block truncate">Redonda (4p)</span>
                    <span className="text-[9.5px] text-stone-500">Salón Interior</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickAdd({ shape: 'RECTANGLE', seats: 6, zone: 'TERRAZA' })}
                  disabled={isSubmittingTable}
                  className="p-2 rounded-xl border border-[#EADBC8] bg-white hover:border-[#2A9D8F] hover:bg-emerald-50/30 flex items-center gap-2 transition-all cursor-pointer text-left shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-md bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                    <RectangleHorizontal className="w-3.5 h-3.5 text-[#2A9D8F]" />
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-[11px] block truncate">Velador (6p)</span>
                    <span className="text-[9.5px] text-stone-500">Terraza Exterior</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Table Form */}
            <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#EADBC8] space-y-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">
                Personalizar Nueva Mesa
              </span>

              <form onSubmit={handleCreateCustomTable} className="space-y-2">
                <div>
                  <label className="text-[10.5px] font-bold text-stone-700 block mb-0.5">
                    Nombre / Número:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Mesa 6, Barra 5..."
                    value={newTableName}
                    onChange={(e) => {
                      setNewTableName(e.target.value);
                      setNewTableNumber(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#EADBC8] bg-white text-xs text-[#2B2523]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10.5px] font-bold text-stone-700 block mb-0.5">
                      Zona:
                    </label>
                    <select
                      value={newTableZone}
                      onChange={(e) => setNewTableZone(e.target.value)}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#EADBC8] bg-white text-xs text-[#2B2523]"
                    >
                      {zones.map((z) => (
                        <option key={z.code} value={z.code}>
                          {z.name.replace(/Zona \d+: /, '')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-stone-700 block mb-0.5">
                      Comensales (Pax):
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={newTableSeats}
                      onChange={(e) => setNewTableSeats(parseInt(e.target.value) || 2)}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#EADBC8] bg-white text-xs text-[#2B2523]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10.5px] font-bold text-stone-700 block mb-1">
                    Forma:
                  </label>
                  <div className="grid grid-cols-4 gap-1">
                    {(['ROUND', 'SQUARE', 'RECTANGLE', 'BAR_STOOL'] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewTableShape(s)}
                        className={`p-1.5 rounded-lg border text-[10px] font-semibold text-center transition-colors cursor-pointer ${
                          newTableShape === s
                            ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]'
                            : 'bg-white text-stone-600 border-stone-200'
                        }`}
                      >
                        {s === 'ROUND'
                          ? 'Redonda'
                          : s === 'SQUARE'
                          ? 'Cuad.'
                          : s === 'RECTANGLE'
                          ? 'Rect.'
                          : 'Tabur.'}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTable}
                  className="w-full mt-1 py-2 px-3 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Mesa al Plano</span>
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ================= TAB: DELIMITAR ZONAS ================= */}
        {activeTab === 'zones' && (
          <div className="space-y-3 animate-in fade-in">
            {/* Zone Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Seleccionar Zona
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewZoneModalOpen(true)}
                  className="text-[10px] font-bold text-[#9E2A2B] hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva Zona</span>
                </button>
              </div>

              <div className="space-y-1">
                {zones.map((z) => {
                  const isSelected = z.code === selectedZoneCode;
                  const zoneTablesCount = tables.filter((t) => t.zone === z.code).length;
                  return (
                    <button
                      key={z.code}
                      type="button"
                      onClick={() => setSelectedZoneCode(z.code)}
                      className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#9E2A2B] bg-[#9E2A2B]/10 font-bold text-[#9E2A2B]'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: z.color }}
                        />
                        <div className="min-w-0">
                          <span className="text-xs truncate block">{z.name}</span>
                          <span className="text-[10px] text-stone-400 block truncate">
                            {z.subtitle || 'Zona delimitada'}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold shrink-0">
                        {zoneTablesCount}m
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Zone Boundary Controls */}
            {currentZone && (
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EADBC8] space-y-3">
                <div className="flex items-center justify-between border-b border-[#EADBC8] pb-1.5">
                  <span className="text-[11px] font-bold text-[#2B2523] truncate">
                    Delimitación de {currentZone.name}
                  </span>
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: currentZone.color }}
                  />
                </div>

                {/* Name & Subtitle edit */}
                <div className="space-y-1.5">
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block">Nombre:</label>
                    <input
                      type="text"
                      value={currentZone.name}
                      onChange={(e) => handleUpdateZone({ name: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-[#EADBC8] bg-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-stone-600 block">Subtítulo:</label>
                    <input
                      type="text"
                      value={currentZone.subtitle || ''}
                      onChange={(e) => handleUpdateZone({ subtitle: e.target.value })}
                      className="w-full px-2 py-1 rounded-lg border border-[#EADBC8] bg-white text-xs"
                    />
                  </div>
                </div>

                {/* Spatial Sliders */}
                <div className="space-y-2 pt-1 border-t border-[#EADBC8]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                    Dimensiones y Coordenadas (%)
                  </span>

                  {/* Width */}
                  <div>
                    <div className="flex justify-between text-[10.5px] font-semibold text-stone-700">
                      <span>Ancho (Width):</span>
                      <span className="font-bold text-[#9E2A2B]">{Math.round(currentZone.width)}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="95"
                      step="1"
                      value={currentZone.width}
                      onChange={(e) => handleUpdateZone({ width: parseFloat(e.target.value) })}
                      className="w-full accent-[#9E2A2B] cursor-pointer"
                    />
                  </div>

                  {/* Height */}
                  <div>
                    <div className="flex justify-between text-[10.5px] font-semibold text-stone-700">
                      <span>Alto (Height):</span>
                      <span className="font-bold text-[#9E2A2B]">{Math.round(currentZone.height)}%</span>
                    </div>
                    <input
                      type="range"
                      min="15"
                      max="95"
                      step="1"
                      value={currentZone.height}
                      onChange={(e) => handleUpdateZone({ height: parseFloat(e.target.value) })}
                      className="w-full accent-[#9E2A2B] cursor-pointer"
                    />
                  </div>

                  {/* Pos X */}
                  <div>
                    <div className="flex justify-between text-[10.5px] font-semibold text-stone-700">
                      <span>Posición Horizontal (X):</span>
                      <span className="font-bold text-[#9E2A2B]">{Math.round(currentZone.posX)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="1"
                      value={currentZone.posX}
                      onChange={(e) => handleUpdateZone({ posX: parseFloat(e.target.value) })}
                      className="w-full accent-[#9E2A2B] cursor-pointer"
                    />
                  </div>

                  {/* Pos Y */}
                  <div>
                    <div className="flex justify-between text-[10.5px] font-semibold text-stone-700">
                      <span>Posición Vertical (Y):</span>
                      <span className="font-bold text-[#9E2A2B]">{Math.round(currentZone.posY)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="80"
                      step="1"
                      value={currentZone.posY}
                      onChange={(e) => handleUpdateZone({ posY: parseFloat(e.target.value) })}
                      className="w-full accent-[#9E2A2B] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Color presets */}
                <div className="pt-1 border-t border-[#EADBC8]">
                  <label className="text-[10px] font-bold text-stone-600 block mb-1">
                    Color de la Zona:
                  </label>
                  <div className="flex items-center gap-1.5">
                    {['#D4A373', '#9E2A2B', '#2A9D8F', '#264653', '#E76F51', '#457B9D', '#6B705C'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleUpdateZone({ color: c })}
                        className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                          currentZone.color === c ? 'scale-115 border-[#2B2523]' : 'border-white'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB: INSPECTOR DE MESA ================= */}
        {activeTab === 'inspector' && (
          <div className="space-y-3 animate-in fade-in">
            {selectedTable ? (
              <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EADBC8] space-y-3">
                <div className="flex items-center justify-between border-b border-[#EADBC8] pb-1.5">
                  <div>
                    <h5 className="font-serif font-bold text-sm text-[#2B2523]">
                      {selectedTable.name}
                    </h5>
                    <span className="text-[10px] text-stone-400">
                      Coordenadas: ({Math.round(selectedTable.posX)}%, {Math.round(selectedTable.posY)}%)
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleDeleteSelectedTable}
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition-colors"
                    title="Eliminar esta mesa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10.5px] font-bold text-stone-700 block mb-0.5">
                      Nombre / Etiqueta:
                    </label>
                    <input
                      type="text"
                      value={inspectorName}
                      onChange={(e) => setInspectorName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-[#EADBC8] bg-white text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10.5px] font-bold text-stone-700 block mb-0.5">
                        Zona:
                      </label>
                      <select
                        value={inspectorZone}
                        onChange={(e) => setInspectorZone(e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-[#EADBC8] bg-white text-xs"
                      >
                        {zones.map((z) => (
                          <option key={z.code} value={z.code}>
                            {z.name.replace(/Zona \d+: /, '')}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10.5px] font-bold text-stone-700 block mb-0.5">
                        Capacidad (Pax):
                      </label>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInspectorSeats(Math.max(1, inspectorSeats - 1))}
                          className="w-7 h-7 rounded-lg border border-stone-200 bg-white font-bold hover:bg-stone-50"
                        >
                          -
                        </button>
                        <span className="flex-1 text-center font-bold text-xs">{inspectorSeats}</span>
                        <button
                          type="button"
                          onClick={() => setInspectorSeats(inspectorSeats + 1)}
                          className="w-7 h-7 rounded-lg border border-stone-200 bg-white font-bold hover:bg-stone-50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10.5px] font-bold text-stone-700 block mb-1">
                      Forma:
                    </label>
                    <div className="grid grid-cols-4 gap-1">
                      {(['ROUND', 'SQUARE', 'RECTANGLE', 'BAR_STOOL'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setInspectorShape(s)}
                          className={`p-1.5 rounded-lg border text-[10px] font-semibold text-center transition-colors cursor-pointer ${
                            inspectorShape === s
                              ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]'
                              : 'bg-white text-stone-600 border-stone-200'
                          }`}
                        >
                          {s === 'ROUND'
                            ? 'Redonda'
                            : s === 'SQUARE'
                            ? 'Cuad.'
                            : s === 'RECTANGLE'
                            ? 'Rect.'
                            : 'Tabur.'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveInspectorChanges}
                    className="w-full mt-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Guardar Propiedades</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-stone-400 space-y-2">
                <Move className="w-8 h-8 mx-auto text-stone-300 stroke-[1.5]" />
                <p className="text-xs font-semibold text-stone-500">
                  Ninguna mesa seleccionada
                </p>
                <p className="text-[10.5px] text-stone-400">
                  Haz clic sobre cualquier mesa en el plano para inspeccionar y editar sus propiedades.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Tools: Snap to Grid & Controls */}
      <div className="p-2.5 border-t border-[#EADBC8] bg-[#FAF8F5] space-y-2 shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-1.5 text-stone-700 font-semibold text-[11px]">
            <Grid className="w-3.5 h-3.5 text-[#D4A373]" />
            <span>Ajuste a Cuadrícula (5%)</span>
          </div>

          <button
            type="button"
            onClick={() => onToggleSnapToGrid(!snapToGrid)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              snapToGrid ? 'bg-[#9E2A2B]' : 'bg-stone-300'
            }`}
          >
            <span
              className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-transform ${
                snapToGrid ? 'left-4.5' : 'left-1'
              }`}
            />
          </button>
        </div>

        <p className="text-[10px] text-stone-400 px-1 leading-tight">
          Mantén presionado sobre una mesa para arrastrarla de forma fluida a 60fps.
        </p>
      </div>

      {/* Modal: Crear Nueva Zona */}
      {isNewZoneModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsNewZoneModalOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl border border-[#EADBC8] shadow-2xl p-5 space-y-3 animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#EADBC8] pb-2">
              <h4 className="font-serif font-bold text-sm text-[#2B2523]">
                Crear Nueva Zona en el Plano
              </h4>
              <button
                type="button"
                onClick={() => setIsNewZoneModalOpen(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewZone} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-0.5">
                  Nombre de la Zona:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Zona VIP, Barra Alta, Patio..."
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#EADBC8] text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-0.5">
                  Subtítulo / Descripción:
                </label>
                <input
                  type="text"
                  placeholder="Ej: Zona reservada, veladores..."
                  value={newZoneSubtitle}
                  onChange={(e) => setNewZoneSubtitle(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-[#EADBC8] text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-stone-700 block mb-1">
                  Color Identificativo:
                </label>
                <div className="flex items-center gap-2">
                  {['#D4A373', '#9E2A2B', '#2A9D8F', '#264653', '#E76F51', '#457B9D', '#6B705C', '#8338EC'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewZoneColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                        newZoneColor === c ? 'scale-115 border-[#2B2523]' : 'border-white'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EADBC8]">
                <button
                  type="button"
                  onClick={() => setIsNewZoneModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-stone-200 text-stone-600 font-semibold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#9E2A2B] text-white font-bold text-xs"
                >
                  Crear Zona
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
