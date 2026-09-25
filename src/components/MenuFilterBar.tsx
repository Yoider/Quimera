'use client';

import React from 'react';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react';
import { AllergenType } from '@/types/menu';

interface MenuFilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  excludedAllergens: AllergenType[];
  onToggleExcludeAllergen: (allergen: AllergenType) => void;
  onlyAvailable: boolean;
  onToggleOnlyAvailable: () => void;
  onResetFilters: () => void;
  totalFilteredCount: number;
  totalCount: number;
}

const COMMON_ALLERGEN_FILTERS: { label: string; allergen: AllergenType }[] = [
  { label: 'Sin Gluten', allergen: 'Gluten' },
  { label: 'Sin Lactosa', allergen: 'Lácteos' },
  { label: 'Sin Pescado', allergen: 'Pescado' },
  { label: 'Sin Crustáceos', allergen: 'Crustáceos' },
  { label: 'Sin Huevo', allergen: 'Huevos' },
  { label: 'Sin Frutos Secos', allergen: 'Frutos de cáscara' },
  { label: 'Sin Sulfitos', allergen: 'Sulfitos' },
];

export default function MenuFilterBar({
  searchQuery,
  onSearchChange,
  excludedAllergens,
  onToggleExcludeAllergen,
  onlyAvailable,
  onToggleOnlyAvailable,
  onResetFilters,
  totalFilteredCount,
  totalCount,
}: MenuFilterBarProps) {
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    excludedAllergens.length > 0 ||
    onlyAvailable;

  return (
    <div className="w-full bg-white rounded-2xl border border-[#EADBC8] p-4 sm:p-5 shadow-xs space-y-4">
      {/* Top Search Bar & Toggle Available */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6E6259]">
            <Search className="w-4 h-4 text-[#9E2A2B]" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por plato, ingrediente (ej. Jamón, Payoyo, Cruzcampo, Melva...)"
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm text-[#2B2523] placeholder-[#6E6259]/70 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#6E6259] hover:text-[#9E2A2B]"
              aria-label="Borrar búsqueda"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Toggle Only Available */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-[#2B2523]">
            <input
              type="checkbox"
              checked={onlyAvailable}
              onChange={onToggleOnlyAvailable}
              className="w-4 h-4 rounded text-[#9E2A2B] focus:ring-[#9E2A2B] accent-[#9E2A2B] border-stone-300"
            />
            <span>Solo disponibles</span>
          </label>

          {hasActiveFilters && (
            <button
              onClick={onResetFilters}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-[#9E2A2B] hover:bg-[#9E2A2B]/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>
      </div>

      {/* Allergen Filter Pills */}
      <div className="pt-2 border-t border-[#EADBC8]/70 flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#6E6259] shrink-0 uppercase tracking-wider">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#D4A373]" />
          <span>Filtro Alérgenos:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {COMMON_ALLERGEN_FILTERS.map((item) => {
            const isExcluded = excludedAllergens.includes(item.allergen);

            return (
              <button
                key={item.allergen}
                onClick={() => onToggleExcludeAllergen(item.allergen)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  isExcluded
                    ? 'bg-[#9E2A2B] text-white border border-[#9E2A2B] shadow-2xs font-semibold'
                    : 'bg-[#FAF8F5] text-[#2B2523] border border-[#EADBC8] hover:border-[#D4A373]'
                }`}
              >
                {isExcluded && <Check className="w-3 h-3 text-[#D4A373]" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Counter Bar */}
      <div className="flex items-center justify-between text-xs text-[#6E6259] pt-1">
        <div>
          Mostrando <span className="font-bold text-[#2B2523]">{totalFilteredCount}</span> de{' '}
          <span className="font-bold text-[#2B2523]">{totalCount}</span> elaboraciones
        </div>
        {hasActiveFilters && (
          <div className="text-[11px] text-[#9E2A2B] font-medium">
            Filtros aplicados
          </div>
        )}
      </div>
    </div>
  );
}
