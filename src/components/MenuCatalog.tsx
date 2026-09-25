'use client';

import React, { useState, useMemo } from 'react';
import { Category, Product, AllergenType } from '@/types/menu';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import MenuFilterBar from './MenuFilterBar';
import { Utensils, AlertCircle } from 'lucide-react';

interface MenuCatalogProps {
  categories: Category[];
  initialProducts: Product[];
}

export default function MenuCatalog({
  categories,
  initialProducts,
}: MenuCatalogProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [excludedAllergens, setExcludedAllergens] = useState<AllergenType[]>([]);
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  // Toggle exclusion of an allergen (e.g. "Sin Gluten")
  const handleToggleExcludeAllergen = (allergen: AllergenType) => {
    setExcludedAllergens((prev) =>
      prev.includes(allergen)
        ? prev.filter((a) => a !== allergen)
        : [...prev, allergen]
    );
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setExcludedAllergens([]);
    setOnlyAvailable(false);
  };

  // Filter products based on search query, excluded allergens, and availability
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      // 1. Only available filter
      if (onlyAvailable && !product.isAvailable) {
        return false;
      }

      // 2. Allergen exclusion filter: if user wants "Sin Gluten", product must NOT contain Gluten
      if (excludedAllergens.length > 0) {
        const containsExcluded = excludedAllergens.some((allergen) =>
          product.allergens.includes(allergen)
        );
        if (containsExcluded) {
          return false;
        }
      }

      // 3. Search query (matches name, description or ingredients)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesDesc = product.description.toLowerCase().includes(query);
        const matchesIng = product.ingredients.some((ing) =>
          ing.toLowerCase().includes(query)
        );
        const matchesBadge = product.badge
          ? product.badge.toLowerCase().includes(query)
          : false;

        return matchesName || matchesDesc || matchesIng || matchesBadge;
      }

      return true;
    });
  }, [initialProducts, searchQuery, excludedAllergens, onlyAvailable]);

  // Group filtered products by category
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const cat of categories) {
      map.set(cat.id, []);
    }
    for (const product of filteredProducts) {
      const list = map.get(product.categoryId);
      if (list) {
        list.push(product);
      }
    }
    return map;
  }, [categories, filteredProducts]);

  return (
    <section id="carta" className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Section Header */}
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="font-serif text-3xl sm:text-4xl font-extrabold text-[#2B2523] uppercase tracking-wider">
          Nuestra Carta
        </h2>
        <div className="w-16 h-1 bg-[#9E2A2B] mx-auto rounded-full" />
        <p className="text-sm sm:text-base text-[#6E6259]">
          Selección artesanal de aperitivos, chacinas, mariscos, guisos tradicionales y molletes recién horneados.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <MenuFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        excludedAllergens={excludedAllergens}
        onToggleExcludeAllergen={handleToggleExcludeAllergen}
        onlyAvailable={onlyAvailable}
        onToggleOnlyAvailable={() => setOnlyAvailable(!onlyAvailable)}
        onResetFilters={handleResetFilters}
        totalFilteredCount={filteredProducts.length}
        totalCount={initialProducts.length}
      />

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-2xl border border-[#EADBC8] p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 rounded-full bg-amber-50 text-[#9E2A2B] flex items-center justify-center mx-auto border border-amber-200">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#2B2523]">
            No encontramos platos con esos criterios
          </h3>
          <p className="text-xs text-[#6E6259]">
            Prueba a eliminar algún filtro de alérgenos o modificar el término de búsqueda.
          </p>
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 rounded-full bg-[#9E2A2B] text-white text-xs font-semibold hover:bg-[#832223] transition-colors"
          >
            Restablecer todos los filtros
          </button>
        </div>
      )}

      {/* Category Sections */}
      <div className="space-y-12">
        {categories.map((category) => {
          const categoryProducts = productsByCategory.get(category.id) || [];
          if (categoryProducts.length === 0) return null;

          return (
            <div
              key={category.id}
              id={`seccion-${category.slug}`}
              className="scroll-mt-36 space-y-4 pt-2"
            >
              {/* Category Header */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-[#EADBC8] pb-3 gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[#D4A373]">
                      Categoría 0{category.orderIndex}
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#9E2A2B] uppercase tracking-wider">
                    {category.name}
                  </h3>
                </div>
                {category.description && (
                  <p className="text-xs sm:text-sm text-[#6E6259] italic max-w-md">
                    {category.description}
                  </p>
                )}
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {categoryProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpenModal={setSelectedProduct}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </section>
  );
}
