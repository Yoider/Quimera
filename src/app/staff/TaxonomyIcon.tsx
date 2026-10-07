'use client';

import React from 'react';
import {
  Beer,
  Wine,
  CupSoda,
  GlassWater,
  Ham,
  Sandwich,
  EggFried,
  CookingPot,
  Fish,
  Salad,
  Package,
  UtensilsCrossed,
  Sparkles,
  Milk,
  Tag,
  FolderOpen,
} from 'lucide-react';
import {
  TaxonomyIconType,
  getTaxonomyIconConfig,
} from '@/data/taxonomyMenu';

interface TaxonomyIconProps {
  name: string;
  categoryId?: string;
  overrideType?: TaxonomyIconType;
  className?: string;
}

export default function TaxonomyIcon({
  name,
  categoryId,
  overrideType,
  className = 'w-3.5 h-3.5',
}: TaxonomyIconProps) {
  const config = getTaxonomyIconConfig(name, categoryId);
  const type = overrideType || config.iconType;

  switch (type) {
    case 'soda':
      return <CupSoda className={`${className} text-sky-500`} />;
    case 'water':
      return <GlassWater className={`${className} text-blue-500`} />;
    case 'wine-red':
      return <Wine className={`${className} text-[#9E2A2B]`} />;
    case 'wine-white':
      return <Wine className={`${className} text-amber-500`} />;
    case 'wine-frizante':
      return <Sparkles className={`${className} text-purple-500`} />;
    case 'beer':
      return <Beer className={`${className} text-amber-600`} />;
    case 'croquette':
      return <Sparkles className={`${className} text-amber-700`} />;
    case 'tapas':
      return <UtensilsCrossed className={`${className} text-emerald-600`} />;
    case 'cheese':
      return <Milk className={`${className} text-yellow-600`} />;
    case 'ham':
      return <Ham className={`${className} text-rose-700`} />;
    case 'sandwich':
      return <Sandwich className={`${className} text-orange-700`} />;
    case 'egg':
      return <EggFried className={`${className} text-amber-600`} />;
    case 'pot':
      return <CookingPot className={`${className} text-orange-800`} />;
    case 'fish':
      return <Fish className={`${className} text-cyan-600`} />;
    case 'salad':
      return <Salad className={`${className} text-emerald-700`} />;
    case 'canned':
      return <Package className={`${className} text-stone-600`} />;
    case 'folder':
      return <FolderOpen className={`${className} text-amber-600`} />;
    default:
      return <Tag className={`${className} text-stone-400`} />;
  }
}
