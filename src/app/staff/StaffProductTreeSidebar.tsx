'use client';

import React, { useState, useMemo } from 'react';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Tag,
  Search,
  X,
  Layers,
  Power,
  CheckCircle2,
  XCircle,
  ChevronsDown,
  ChevronsUp,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react';
import { Product, Category } from '@/types/menu';
import {
  TreeCategoryNode,
  TreeSubtypeNode,
  buildTaxonomyTree,
} from '@/data/taxonomyMenu';
import TaxonomyIcon from './TaxonomyIcon';

export interface SelectedTreeNode {
  type: 'all' | 'category' | 'subtype' | 'tag';
  categoryId?: string;
  subtypeName?: string;
  tag?: string;
  label: string;
}

interface StaffProductTreeSidebarProps {
  products: Product[];
  categories: Category[];
  selectedNode: SelectedTreeNode;
  onSelectNode: (node: SelectedTreeNode) => void;
  onBatchToggleAvailability: (productIds: string[], isAvailable: boolean) => void;
  isPending?: boolean;
  onClose?: () => void;
}

export default function StaffProductTreeSidebar({
  products,
  categories,
  selectedNode,
  onSelectNode,
  onBatchToggleAvailability,
  isPending = false,
  onClose,
}: StaffProductTreeSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

  // Build the hierarchical tree
  const treeData = useMemo(() => {
    return buildTaxonomyTree(products, categories);
  }, [products, categories]);

  // Expand / collapse single folder
  const toggleFolder = (key: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Expand all folders
  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    treeData.forEach((cat) => {
      next[`cat-${cat.categoryId}`] = true;
      cat.subtypes.forEach((sub) => {
        next[`sub-${cat.categoryId}-${sub.name}`] = true;
      });
    });
    setExpandedFolders(next);
  };

  // Collapse all folders
  const handleCollapseAll = () => {
    setExpandedFolders({});
  };

  // Filter tree based on search query
  const filteredTree = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return treeData;

    return treeData
      .map((cat) => {
        const catMatches = cat.categoryName.toLowerCase().includes(q);
        const matchedSubtypes = cat.subtypes
          .map((sub) => {
            const subMatches = sub.name.toLowerCase().includes(q);
            const matchedTags = sub.tags.filter((t) => t.tag.toLowerCase().includes(q));
            const hasMatchedProducts = sub.products.some((p) => p.name.toLowerCase().includes(q));

            if (subMatches || matchedTags.length > 0 || hasMatchedProducts || catMatches) {
              return {
                ...sub,
                tags: subMatches || catMatches ? sub.tags : matchedTags,
              };
            }
            return null;
          })
          .filter(Boolean) as TreeSubtypeNode[];

        if (catMatches || matchedSubtypes.length > 0) {
          return {
            ...cat,
            subtypes: catMatches && matchedSubtypes.length === 0 ? cat.subtypes : matchedSubtypes,
          };
        }
        return null;
      })
      .filter(Boolean) as TreeCategoryNode[];
  }, [treeData, searchQuery]);

  const totalProducts = products.length;
  const availableProducts = products.filter((p) => p.isAvailable).length;

  return (
    <aside className="w-80 sm:w-84 shrink-0 bg-white border-l border-[#EADBC8] flex flex-col h-full select-none shadow-xs font-sans">
      {/* IDE Explorer Header */}
      <div className="p-3 bg-[#FAF8F5] border-b border-[#EADBC8] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#2B2523] text-[#D4A373] flex items-center justify-center shadow-2xs">
            <SlidersHorizontal className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-mono text-xs font-bold text-[#2B2523] uppercase tracking-wider">
              EXPLORADOR DE CARTA
            </h3>
            <span className="text-[10px] text-stone-500 font-medium">
              Estructura & Etiquetas IDE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleExpandAll}
            title="Expandir todo"
            className="p-1 rounded text-stone-500 hover:text-[#2B2523] hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <ChevronsDown className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={handleCollapseAll}
            title="Contraer todo"
            className="p-1 rounded text-stone-500 hover:text-[#2B2523] hover:bg-stone-200/60 transition-colors cursor-pointer"
          >
            <ChevronsUp className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Cerrar panel"
              className="p-1 rounded text-stone-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="p-2 border-b border-stone-100 bg-white shrink-0">
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-stone-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar carpetas o etiquetas..."
            className="w-full text-xs pl-8 pr-7 py-1.5 rounded-lg border border-stone-200 bg-[#FAF8F5] focus:bg-white focus:border-[#9E2A2B] focus:ring-1 focus:ring-[#9E2A2B] outline-none transition-all placeholder:text-stone-400 font-mono text-stone-800"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Global Root Button: "Todas las Categorías" */}
      <div className="p-2 border-b border-stone-100 bg-[#FAF8F5]/60 shrink-0">
        <button
          type="button"
          onClick={() =>
            onSelectNode({
              type: 'all',
              label: 'Todas las Categorías',
            })
          }
          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
            selectedNode.type === 'all'
              ? 'bg-[#9E2A2B] text-white shadow-2xs font-bold'
              : 'text-[#2B2523] hover:bg-stone-200/60'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <Layers className="w-3.5 h-3.5 shrink-0 opacity-80" />
            <span className="truncate">Todo el Catálogo</span>
          </div>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
              selectedNode.type === 'all'
                ? 'bg-white/20 text-white'
                : 'bg-stone-200 text-stone-600'
            }`}
          >
            {availableProducts}/{totalProducts}
          </span>
        </button>
      </div>

      {/* IDE Tree View (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-xs">
        {filteredTree.map((cat) => {
          const catKey = `cat-${cat.categoryId}`;
          const isCatExpanded = expandedFolders[catKey] ?? true;
          const isCatSelected =
            selectedNode.type === 'category' && selectedNode.categoryId === cat.categoryId;

          const allCatProductIds = cat.subtypes.flatMap((s) => s.products.map((p) => p.id));
          const isCatAllAvailable = cat.availableCount === cat.totalCount && cat.totalCount > 0;
          const isCatAllUnavailable = cat.availableCount === 0 && cat.totalCount > 0;

          return (
            <div key={cat.categoryId} className="space-y-0.5">
              {/* Level 1: Category Folder Node */}
              <div
                className={`group flex items-center justify-between px-1.5 py-1 rounded-md transition-colors ${
                  isCatSelected
                    ? 'bg-[#9E2A2B]/10 text-[#9E2A2B] font-bold border border-[#9E2A2B]/30'
                    : 'text-stone-800 hover:bg-stone-100'
                }`}
              >
                <div
                  className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    toggleFolder(catKey);
                    onSelectNode({
                      type: 'category',
                      categoryId: cat.categoryId,
                      label: cat.categoryName,
                    });
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFolder(catKey);
                    }}
                    className="p-0.5 text-stone-400 hover:text-stone-700"
                  >
                    {isCatExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <TaxonomyIcon
                    name={cat.categoryName}
                    categoryId={cat.categoryId}
                    className="w-3.5 h-3.5 shrink-0"
                  />

                  <span className="truncate text-xs font-medium font-sans">
                    {cat.categoryName}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 pl-1">
                  <span
                    className={`text-[9.5px] px-1 py-0.2 rounded font-mono ${
                      cat.availableCount === 0
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {cat.availableCount}/{cat.totalCount}
                  </span>

                  {/* Batch Availability Toggle for Category */}
                  <button
                    type="button"
                    disabled={isPending || allCatProductIds.length === 0}
                    onClick={() =>
                      onBatchToggleAvailability(allCatProductIds, !isCatAllAvailable)
                    }
                    title={
                      isCatAllAvailable
                        ? 'Pausar toda la categoría (Agotar lote)'
                        : 'Activar toda la categoría'
                    }
                    className={`p-1 rounded opacity-60 group-hover:opacity-100 transition-opacity cursor-pointer ${
                      isCatAllAvailable
                        ? 'text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800'
                        : 'text-rose-700 hover:bg-rose-100 hover:text-rose-800'
                    }`}
                  >
                    <Power className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Level 2: Subtypes (Inside Category) */}
              {isCatExpanded && (
                <div className="ml-3 pl-2 border-l border-stone-200/80 space-y-0.5">
                  {cat.subtypes.map((sub) => {
                    const subKey = `sub-${cat.categoryId}-${sub.name}`;
                    const isSubExpanded = expandedFolders[subKey] ?? true;
                    const isSubSelected =
                      selectedNode.type === 'subtype' &&
                      selectedNode.categoryId === cat.categoryId &&
                      selectedNode.subtypeName === sub.name;

                    const subProductIds = sub.products.map((p) => p.id);
                    const isSubAllAvailable =
                      sub.availableCount === sub.totalCount && sub.totalCount > 0;

                    return (
                      <div key={sub.id} className="space-y-0.5">
                        {/* Subtype Node */}
                        <div
                          className={`group flex items-center justify-between px-1.5 py-0.5 rounded transition-colors ${
                            isSubSelected
                              ? 'bg-[#9E2A2B] text-white font-semibold shadow-2xs'
                              : 'text-stone-700 hover:bg-stone-100/80'
                          }`}
                        >
                          <div
                            className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                            onClick={() => {
                              toggleFolder(subKey);
                              onSelectNode({
                                type: 'subtype',
                                categoryId: cat.categoryId,
                                subtypeName: sub.name,
                                label: `${cat.categoryName} > ${sub.name}`,
                              });
                            }}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFolder(subKey);
                              }}
                              className={`p-0.5 ${
                                isSubSelected
                                  ? 'text-white/80 hover:text-white'
                                  : 'text-stone-400 hover:text-stone-700'
                              }`}
                            >
                              {isSubExpanded ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronRight className="w-3 h-3" />
                              )}
                            </button>

                            <TaxonomyIcon
                              name={sub.name}
                              categoryId={cat.categoryId}
                              className="w-3.5 h-3.5 shrink-0"
                            />

                            <span className="truncate text-[11.5px] font-sans font-medium">
                              {sub.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0 pl-1">
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded font-mono ${
                                isSubSelected
                                  ? 'bg-white/20 text-white'
                                  : sub.availableCount === 0
                                  ? 'bg-rose-100 text-rose-700'
                                  : 'bg-stone-200/70 text-stone-600'
                              }`}
                            >
                              {sub.availableCount}/{sub.totalCount}
                            </span>

                            {/* Batch Availability Toggle for Subtype */}
                            <button
                              type="button"
                              disabled={isPending || subProductIds.length === 0}
                              onClick={() =>
                                onBatchToggleAvailability(subProductIds, !isSubAllAvailable)
                              }
                              title={
                                isSubAllAvailable
                                  ? `Pausar todo el subgrupo "${sub.name}" (Agotar lote)`
                                  : `Activar todo el subgrupo "${sub.name}"`
                              }
                              className={`p-1 rounded opacity-50 group-hover:opacity-100 transition-opacity cursor-pointer ${
                                isSubSelected
                                  ? 'text-white hover:bg-white/20'
                                  : isSubAllAvailable
                                  ? 'text-emerald-700 hover:bg-emerald-100'
                                  : 'text-rose-700 hover:bg-rose-100'
                              }`}
                            >
                              <Power className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>

                        {/* Level 3: Tags inside Subtype */}
                        {isSubExpanded && sub.tags.length > 0 && (
                          <div className="ml-3 pl-2 border-l border-stone-200/60 space-y-0.5">
                            {sub.tags.map((t) => {
                              const isTagSelected =
                                selectedNode.type === 'tag' &&
                                selectedNode.categoryId === cat.categoryId &&
                                selectedNode.subtypeName === sub.name &&
                                selectedNode.tag === t.tag;

                              const tagProductIds = t.products.map((p) => p.id);
                              const tagAvailCount = t.products.filter((p) => p.isAvailable).length;
                              const isTagAllAvailable =
                                tagAvailCount === t.products.length && t.products.length > 0;

                              return (
                                <div
                                  key={t.tag}
                                  className={`group flex items-center justify-between px-1.5 py-0.5 rounded transition-colors ${
                                    isTagSelected
                                      ? 'bg-[#421718] text-white font-medium shadow-2xs'
                                      : 'text-stone-600 hover:bg-stone-100/70'
                                  }`}
                                >
                                  <div
                                    className="flex items-center gap-1.5 min-w-0 flex-1 cursor-pointer"
                                    onClick={() =>
                                      onSelectNode({
                                        type: 'tag',
                                        categoryId: cat.categoryId,
                                        subtypeName: sub.name,
                                        tag: t.tag,
                                        label: `${sub.name} > #${t.tag}`,
                                      })
                                    }
                                  >
                                    <TaxonomyIcon
                                      name={t.tag}
                                      categoryId={cat.categoryId}
                                      className="w-3 h-3 shrink-0"
                                    />
                                    <span className="truncate text-[10.5px] font-sans">
                                      {t.tag}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0 pl-1">
                                    <span
                                      className={`text-[8.5px] px-1 py-0.2 rounded font-mono ${
                                        isTagSelected
                                          ? 'bg-white/20 text-white'
                                          : 'bg-stone-100 text-stone-500'
                                      }`}
                                    >
                                      {tagAvailCount}/{t.products.length}
                                    </span>

                                    {/* Batch Toggle for Tag */}
                                    <button
                                      type="button"
                                      disabled={isPending || tagProductIds.length === 0}
                                      onClick={() =>
                                        onBatchToggleAvailability(tagProductIds, !isTagAllAvailable)
                                      }
                                      title={
                                        isTagAllAvailable
                                          ? `Pausar etiqueta "${t.tag}"`
                                          : `Activar etiqueta "${t.tag}"`
                                      }
                                      className={`p-0.5 rounded opacity-40 group-hover:opacity-100 transition-opacity cursor-pointer ${
                                        isTagSelected
                                          ? 'text-white hover:bg-white/20'
                                          : isTagAllAvailable
                                          ? 'text-emerald-700 hover:bg-emerald-100'
                                          : 'text-rose-700 hover:bg-rose-100'
                                      }`}
                                    >
                                      <Power className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-[#FAF8F5] border-t border-[#EADBC8] text-[10px] text-stone-500 flex items-center justify-between shrink-0">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[#D4A373]" />
          <span>Filtro activo:</span>
        </span>
        <span className="font-semibold text-[#9E2A2B] truncate max-w-[140px]" title={selectedNode.label}>
          {selectedNode.label}
        </span>
      </div>
    </aside>
  );
}
