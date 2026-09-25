'use client';

import React, { useEffect } from 'react';
import { Product } from '@/types/menu';
import AllergenBadge from './AllergenBadge';
import { X, Star, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (product) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(product.price);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#EADBC8] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Image Header */}
        <div className="relative h-64 sm:h-72 w-full bg-[#F4EBE1] shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {/* Badges on Image */}
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white">
            <div>
              {product.badge && (
                <span className="inline-block px-2.5 py-1 rounded-md bg-[#9E2A2B] text-amber-100 text-xs font-bold uppercase tracking-wider mb-2">
                  {product.badge}
                </span>
              )}
              <h2
                id="modal-title"
                className="font-serif text-2xl sm:text-3xl font-extrabold text-white leading-tight drop-shadow-xs"
              >
                {product.name}
              </h2>
            </div>
            <div className="text-right">
              <span className="text-xs uppercase tracking-wider text-amber-200 font-semibold block">
                {product.format}
              </span>
              <span className="font-sans text-2xl sm:text-3xl font-black text-amber-300">
                {formattedPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Availability & Rating Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#EADBC8]">
            <div className="flex items-center gap-2">
              {product.isAvailable ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Disponible ahora en barra y sala
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-semibold">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  Agotado temporalmente por servicio
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[#D4A373]">
              <Star className="w-4 h-4 fill-[#D4A373] text-[#D4A373]" />
              <span className="font-bold text-sm text-[#2B2523] ml-1">
                {product.rating.toFixed(1)} / 5.0
              </span>
              <span className="text-xs text-[#6E6259]">
                ({product.totalReviews} clientes satisfechos)
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9E2A2B]">
              Sobre este plato
            </h4>
            <p className="text-sm text-[#2B2523] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Ingredients */}
          {product.ingredients.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#9E2A2B]">
                Ingredientes Principales
              </h4>
              <div className="flex flex-wrap gap-2">
                {product.ingredients.map((ing, idx) => (
                  <span
                    key={idx}
                    className="inline-block px-3 py-1 rounded-lg bg-[#FAF8F5] text-xs font-medium text-[#2B2523] border border-[#EADBC8]"
                  >
                    • {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Allergens Information */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#9E2A2B]">
              Información de Alérgenos
            </h4>
            {product.allergens.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.allergens.map((allergen) => (
                  <AllergenBadge key={allergen} allergen={allergen} showLabel={true} />
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-800 bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                ✓ Esta elaboración no contiene alérgenos de declaración obligatoria según el Reglamento Europeo 1169/2011.
              </p>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs mt-3">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p>
                <strong>Aviso de intolerancias:</strong> Aunque cuidamos al máximo la manipulación, en nuestra cocina se elaboran productos con gluten, pescado y lácteos, por lo que no podemos garantizar la ausencia total de trazas.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF8F5] border-t border-[#EADBC8] flex items-center justify-between">
          <span className="text-xs text-[#6E6259]">
            Taberna Quimera · Carta Digital
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-[#9E2A2B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#832223] transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>
      </div>
    </div>
  );
}
