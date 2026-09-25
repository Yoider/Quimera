'use client';

import React, { useState } from 'react';
import { Product } from '@/types/menu';
import AllergenBadge from './AllergenBadge';
import { Star, Utensils, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export default function ProductCard({ product, onOpenModal }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(product.price);

  return (
    <article
      onClick={() => onOpenModal(product)}
      className={`group relative flex flex-col justify-between rounded-xl bg-white border transition-all duration-300 overflow-hidden cursor-pointer ${
        product.isAvailable
          ? 'border-[#EADBC8] hover:border-[#D4A373] hover:shadow-lg hover:-translate-y-1'
          : 'border-stone-200 opacity-70 bg-stone-50'
      }`}
    >
      <div>
        {/* Image Container with Fallback */}
        <div className="relative h-44 sm:h-48 w-full bg-[#F4EBE1] overflow-hidden">
          {!imageError ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              onError={() => setImageError(true)}
              loading="lazy"
              className={`w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
                !product.isAvailable ? 'grayscale' : ''
              }`}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-[#6E6259]/60 bg-[#F4EBE1]">
              <Utensils className="w-10 h-10 mb-1 stroke-1" />
              <span className="text-xs font-serif italic">Taberna Quimera</span>
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

          {/* Format Pill (top right) */}
          <div className="absolute top-2.5 right-2.5">
            <span className="inline-block px-2.5 py-1 rounded-md bg-white/95 backdrop-blur-xs text-[11px] font-semibold tracking-wider text-[#2B2523] uppercase shadow-xs border border-[#EADBC8]">
              {product.format}
            </span>
          </div>

          {/* Special Feature Badge (top left) */}
          {product.badge && product.isAvailable && (
            <div className="absolute top-2.5 left-2.5">
              <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-[#9E2A2B] text-amber-100 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                {product.badge}
              </span>
            </div>
          )}

          {/* Out of Stock Overlay Badge */}
          {!product.isAvailable && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-red-600 text-white text-xs font-bold uppercase tracking-widest shadow-md">
                Agotado por hoy
              </span>
            </div>
          )}

          {/* Hover View Detail Overlay */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FAF8F5]/90 text-[#9E2A2B] text-xs font-medium shadow-sm">
              <Eye className="w-3.5 h-3.5" />
              <span>Ver detalle</span>
            </span>
          </div>
        </div>

        {/* Product Information */}
        <div className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-serif text-lg font-bold text-[#2B2523] leading-snug group-hover:text-[#9E2A2B] transition-colors">
              {product.name}
            </h3>
            <span className="font-sans text-lg font-extrabold text-[#9E2A2B] shrink-0">
              {formattedPrice}
            </span>
          </div>

          <p className="text-xs text-[#6E6259] line-clamp-2 leading-relaxed">
            {product.description}
          </p>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5 pt-1">
            <div className="flex items-center text-[#D4A373]">
              <Star className="w-3.5 h-3.5 fill-[#D4A373] text-[#D4A373]" />
              <span className="ml-1 text-xs font-bold text-[#2B2523]">
                {product.rating.toFixed(1)}
              </span>
            </div>
            <span className="text-[11px] text-[#6E6259]/80">
              ({product.totalReviews} opiniones)
            </span>
          </div>
        </div>
      </div>

      {/* Allergens Footer Bar */}
      <div className="px-4 pb-3.5 pt-2 border-t border-[#EADBC8]/60 flex flex-wrap gap-1.5 items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {product.allergens.length > 0 ? (
            product.allergens.slice(0, 3).map((allergen) => (
              <AllergenBadge key={allergen} allergen={allergen} showLabel={false} />
            ))
          ) : (
            <span className="text-[10px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Libre de alérgenos comunes
            </span>
          )}
          {product.allergens.length > 3 && (
            <span className="text-[10px] text-[#6E6259] bg-[#F4EBE1] px-1.5 py-0.5 rounded-full font-semibold">
              +{product.allergens.length - 3}
            </span>
          )}
        </div>

        <span className="text-[11px] text-[#9E2A2B] font-semibold group-hover:underline">
          Detalles →
        </span>
      </div>
    </article>
  );
}
