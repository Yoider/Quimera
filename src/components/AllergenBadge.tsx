import React from 'react';
import { AllergenType } from '@/types/menu';
import {
  Wheat,
  Milk,
  Fish,
  Egg,
  Nut,
  Wine,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

interface AllergenBadgeProps {
  allergen: AllergenType;
  showLabel?: boolean;
}

const ALLERGEN_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  Gluten: { label: 'Gluten', icon: Wheat, color: 'bg-amber-50 text-amber-800 border-amber-200' },
  Lácteos: { label: 'Lácteos', icon: Milk, color: 'bg-blue-50 text-blue-800 border-blue-200' },
  Moluscos: { label: 'Moluscos', icon: Fish, color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  Pescado: { label: 'Pescado', icon: Fish, color: 'bg-sky-50 text-sky-800 border-sky-200' },
  Crustáceos: { label: 'Crustáceos', icon: Fish, color: 'bg-rose-50 text-rose-800 border-rose-200' },
  Huevos: { label: 'Huevos', icon: Egg, color: 'bg-yellow-50 text-yellow-800 border-yellow-200' },
  'Frutos de cáscara': { label: 'Frutos Secos', icon: Nut, color: 'bg-amber-100 text-amber-900 border-amber-300' },
  Sulfitos: { label: 'Sulfitos', icon: Wine, color: 'bg-purple-50 text-purple-800 border-purple-200' },
  Mostaza: { label: 'Mostaza', icon: Sparkles, color: 'bg-lime-50 text-lime-800 border-lime-200' },
  Sésamo: { label: 'Sésamo', icon: Sparkles, color: 'bg-stone-50 text-stone-700 border-stone-200' },
  Soja: { label: 'Soja', icon: Sparkles, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};

export default function AllergenBadge({
  allergen,
  showLabel = true,
}: AllergenBadgeProps) {
  const config = ALLERGEN_CONFIG[allergen] || {
    label: allergen,
    icon: AlertCircle,
    color: 'bg-stone-50 text-stone-700 border-stone-200',
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase border ${config.color}`}
      title={`Contiene ${allergen}`}
    >
      <Icon className="w-2.5 h-2.5 shrink-0" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}
