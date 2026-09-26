'use client';

import React, { useState, useEffect, useTransition } from 'react';
import { Product, Category, AllergenType } from '@/types/menu';
import { updateProductAction, createProductAction } from '@/app/staff/actions';
import {
  X,
  Image as ImageIcon,
  DollarSign,
  Utensils,
  Tag,
  AlertCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';

interface StaffProductModalProps {
  isOpen: boolean;
  mode: 'edit' | 'create';
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (product: Product) => void;
  onRequestDelete?: (product: Product) => void;
}

const ALL_ALLERGENS: AllergenType[] = [
  'Gluten',
  'Lácteos',
  'Huevos',
  'Pescado',
  'Crustáceos',
  'Moluscos',
  'Frutos de cáscara',
  'Cacahuetes',
  'Soja',
  'Apio',
  'Mostaza',
  'Sésamo',
  'Sulfitos',
  'Altramuces',
];

const COMMON_FORMATS = ['Tapa', 'Media Ración', 'Ración', 'Unidad', '100grs', 'Copa', 'Caña', 'Botella', 'Mollete'];

export default function StaffProductModal({
  isOpen,
  mode,
  product,
  categories,
  onClose,
  onSave,
  onRequestDelete,
}: StaffProductModalProps) {
  const [isPending, startTransition] = useTransition();

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | string>(4.5);
  const [format, setFormat] = useState('Ración');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientsStr, setIngredientsStr] = useState('');
  const [badge, setBadge] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [selectedAllergens, setSelectedAllergens] = useState<AllergenType[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      if (mode === 'edit' && product) {
        setName(product.name);
        setDescription(product.description);
        setPrice(product.price);
        setFormat(product.format);
        setCategoryId(product.categoryId);
        setImageUrl(product.imageUrl);
        setIngredientsStr(product.ingredients.join(', '));
        setBadge(product.badge || '');
        setIsAvailable(product.isAvailable);
        setSelectedAllergens(product.allergens || []);
      } else {
        setName('');
        setDescription('');
        setPrice(4.5);
        setFormat('Ración');
        setCategoryId(categories[0]?.id || '');
        setImageUrl('https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80');
        setIngredientsStr('');
        setBadge('');
        setIsAvailable(true);
        setSelectedAllergens([]);
      }
    }
  }, [isOpen, mode, product, categories]);

  if (!isOpen) return null;

  const toggleAllergen = (allergen: AllergenType) => {
    setSelectedAllergens((prev) =>
      prev.includes(allergen) ? prev.filter((a) => a !== allergen) : [...prev, allergen]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del producto es obligatorio.');
      return;
    }
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setErrorMsg('Introduce un precio válido en euros.');
      return;
    }

    const ingredientsList = ingredientsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    startTransition(async () => {
      if (mode === 'edit' && product) {
        const res = await updateProductAction(product.id, {
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          format: format.trim() || 'Ración',
          categoryId: categoryId || categories[0]?.id,
          imageUrl: imageUrl.trim(),
          ingredients: ingredientsList.length > 0 ? ingredientsList : [name.trim()],
          allergens: selectedAllergens,
          badge: badge.trim() || null,
          isAvailable,
        });

        if (res.success && res.product) {
          onSave(res.product);
          onClose();
        } else {
          setErrorMsg('Error al guardar los cambios del producto.');
        }
      } else {
        const res = await createProductAction({
          name: name.trim(),
          description: description.trim(),
          price: numPrice,
          format: format.trim() || 'Ración',
          categoryId: categoryId || categories[0]?.id,
          imageUrl: imageUrl.trim(),
          ingredients: ingredientsList.length > 0 ? ingredientsList : [name.trim()],
          allergens: selectedAllergens,
          badge: badge.trim() || undefined,
          isAvailable,
        });

        if (res.success && res.product) {
          onSave(res.product);
          onClose();
        } else {
          setErrorMsg('Error al crear el nuevo plato.');
        }
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={() => !isPending && onClose()}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl border border-[#D4A373]/40 shadow-2xl overflow-hidden my-6 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#2B2523] text-white flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#9E2A2B] flex items-center justify-center text-amber-200 shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">
                {mode === 'edit' ? `Modificar Plato: ${product?.name}` : 'Añadir Nuevo Plato a la Carta'}
              </h3>
              <p className="text-xs text-[#D4A373]">
                {mode === 'edit'
                  ? 'Actualiza los datos, foto, precio o formato del plato'
                  : 'Registra un nuevo plato disponible en la carta digital'}
              </p>
            </div>
          </div>

          <button
            onClick={() => !isPending && onClose()}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto bg-[#FAF8F5]">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Row 1: Image URL and Preview */}
          <div className="p-4 bg-white rounded-2xl border border-[#EADBC8] space-y-3">
            <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider">
              Fotografía del Plato
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative shadow-inner">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80'}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
                  }}
                />
              </div>

              <div className="flex-1 w-full space-y-1.5">
                <div className="relative">
                  <ImageIcon className="w-4 h-4 text-[#6E6259] absolute left-3 top-3" />
                  <input
                    type="url"
                    required
                    placeholder="URL de la imagen (ej: https://images.unsplash.com/...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                  />
                </div>
                <p className="text-[11px] text-[#6E6259]">
                  Pega un enlace web directo a la fotografía en alta calidad del plato.
                </p>
              </div>
            </div>
          </div>

          {/* Row 2: Name and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Nombre del Plato *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Carrillada Ibérica al Pedro Ximénez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EADBC8] text-sm text-[#2B2523] font-semibold focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Categoría en Carta *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-[#EADBC8] text-xs font-semibold text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon} {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Price and Quantity / Format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Precio (€) *
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-[#9E2A2B] absolute left-3 top-3" />
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-sm font-bold text-[#9E2A2B] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Cantidad / Formato *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Tapa, Ración, 100grs, Unidad, Copa"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-xs font-semibold text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {COMMON_FORMATS.slice(0, 5).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFormat(f)}
                    className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors ${
                      format === f
                        ? 'bg-[#9E2A2B] text-white border-[#9E2A2B]'
                        : 'bg-white text-[#6E6259] border-stone-200 hover:border-[#D4A373]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Description */}
          <div>
            <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
              Descripción del Plato
            </label>
            <textarea
              rows={2}
              required
              placeholder="Describe los sabores, cocción y presentación tradicional sevillana..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
            />
          </div>

          {/* Row 5: Ingredients and Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Ingredientes (separados por coma)
              </label>
              <input
                type="text"
                placeholder="Ej. Carrillada, vino tinto, cebolla caramelizada, patatas"
                value={ingredientsStr}
                onChange={(e) => setIngredientsStr(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider mb-1">
                Distintivo o Etiqueta (opcional)
              </label>
              <div className="relative">
                <Tag className="w-4 h-4 text-[#D4A373] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ej. Especialidad, 100% Bellota, Más Pedido"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-[#EADBC8] text-xs text-[#2B2523] focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20"
                />
              </div>
            </div>
          </div>

          {/* Row 6: Availability Status */}
          <div className="p-4 bg-white rounded-2xl border border-[#EADBC8] flex items-center justify-between gap-4">
            <div>
              <span className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider">
                Disponibilidad en la Carta
              </span>
              <p className="text-[11px] text-[#6E6259]">
                Los clientes no podrán pedir este plato si está marcado como agotado.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAvailable(!isAvailable)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs cursor-pointer ${
                isAvailable
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isAvailable ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Disponible</span>
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4" />
                  <span>Agotado</span>
                </>
              )}
            </button>
          </div>

          {/* Row 7: Allergens Selector */}
          <div className="p-4 bg-white rounded-2xl border border-[#EADBC8] space-y-2">
            <label className="block text-xs font-bold text-[#2B2523] uppercase tracking-wider">
              Alérgenos e Intolerancias (Normativa UE)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_ALLERGENS.map((allergen) => {
                const isSelected = selectedAllergens.includes(allergen);
                return (
                  <button
                    key={allergen}
                    type="button"
                    onClick={() => toggleAllergen(allergen)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#9E2A2B] text-white border-[#9E2A2B] shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#6E6259] border-[#EADBC8] hover:border-[#D4A373]'
                    }`}
                  >
                    {isSelected ? '✓ ' : ''}{allergen}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-[#EADBC8] flex items-center justify-between gap-3">
            <div>
              {mode === 'edit' && product && onRequestDelete && (
                <button
                  type="button"
                  onClick={() => onRequestDelete(product)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar plato</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-[#EADBC8] text-xs font-semibold text-[#6E6259] hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isPending
                    ? 'Guardando...'
                    : mode === 'edit'
                    ? 'Guardar Cambios'
                    : 'Crear Plato'}
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
