import { Product, Category } from '@/types/menu';

export interface TaxonomySubtype {
  id: string;
  name: string;
  description?: string;
  defaultTags: string[];
}

export interface TaxonomyCategory {
  categoryId: string;
  categoryName: string;
  subtypes: TaxonomySubtype[];
}

/**
 * Predefined full hierarchical taxonomy for Taberna Quimera
 */
export const TAXONOMY_DEFINITIONS: TaxonomyCategory[] = [
  {
    categoryId: 'cat-bebidas',
    categoryName: 'Bebidas',
    subtypes: [
      {
        id: 'cervezas',
        name: 'Cervezas',
        description: 'Barril helado, tercios especiales y 0,0',
        defaultTags: ['Barril', 'Con Alcohol', 'Sin Alcohol (0,0)', 'Especial', 'Reserva'],
      },
      {
        id: 'vinos-tintos',
        name: 'Vinos Tintos',
        description: 'Riojas, Riberas y tintos de la tierra',
        defaultTags: ['Rioja', 'Ribera del Duero', 'Crianza', 'Roble', 'Con Alcohol'],
      },
      {
        id: 'vinos-blancos',
        name: 'Vinos Blancos & Generosos',
        description: 'Ruedas, blancos de Cádiz y Manzanilla',
        defaultTags: ['Verdejo / Rueda', 'Tierra de Cádiz', 'Manzanilla', 'Seco', 'Con Alcohol'],
      },
      {
        id: 'refrescos-aguas',
        name: 'Refrescos & Aguas',
        description: 'Bebidas sin alcohol, refrescos clásicos y zero',
        defaultTags: ['Normal', 'Zero', 'Zero Zero', 'Mineral', 'Sin Alcohol'],
      },
    ],
  },
  {
    categoryId: 'cat-papelones',
    categoryName: 'Papelones & Chacinas',
    subtypes: [
      {
        id: 'ibericos-bellota',
        name: 'Ibéricos de Bellota',
        description: 'Jamón 100%, caña de lomo y embutidos nobles',
        defaultTags: ['100% Bellota', 'Corte a Cuchillo', 'Curación Artesanal'],
      },
      {
        id: 'quesos-sierra',
        name: 'Quesos Puros de Sierra',
        description: 'Payoyo de Cádiz y Apolonio curado',
        defaultTags: ['Queso Payoyo', 'Queso Oveja', 'Curado', 'Viejo'],
      },
      {
        id: 'chicharrones-especiales',
        name: 'Chicharrones & Salazones',
        description: 'Chicharrón especial al corte con limón y sal',
        defaultTags: ['Estilo Cádiz', 'Al Corte', 'Tradición'],
      },
    ],
  },
  {
    categoryId: 'cat-entre-panes',
    categoryName: 'Entre Panes & Molletes',
    subtypes: [
      {
        id: 'molletes-calientes',
        name: 'Molletes Quimera (Calientes)',
        description: 'Pan de mollete artesano tostado y relleno selecto',
        defaultTags: ['Especialidad Quimera', 'Carne Mechada', 'Pringá Casera', 'Presa Ibérica'],
      },
      {
        id: 'montaditos-tostas',
        name: 'Montaditos & Tostas',
        description: 'Bocados crujientes tradicionales',
        defaultTags: ['Crujiente', 'Gourmet'],
      },
    ],
  },
  {
    categoryId: 'cat-huevos',
    categoryName: 'Huevos & Tortillas',
    subtypes: [
      {
        id: 'huevos-rotos',
        name: 'Huevos Rotos de Campo',
        description: 'Con patatas fritas al momento y guarnición ibérica',
        defaultTags: ['Con Jamón', 'Con Chistorra', 'Yema Melosa'],
      },
      {
        id: 'tortillas-salsas',
        name: 'Tortillas con Salsa',
        description: 'Tortillas jugosas bañadas en salsas de la casa',
        defaultTags: ['Al Whisky', 'Al Roquefort', 'Receta Quimera'],
      },
    ],
  },
  {
    categoryId: 'cat-guisos',
    categoryName: 'Guisos & Cuchareo',
    subtypes: [
      {
        id: 'cazuelas-ibericas',
        name: 'Cazuelas Ibéricas & Carnes',
        description: 'Carrillada al vino tinto y solomillo al whisky',
        defaultTags: ['A Fuego Lento', 'Salsa Reducida', 'Ibérico'],
      },
      {
        id: 'legumbres-tradicionales',
        name: 'Cuchareo Tradicional',
        description: 'Espinacas con garbanzos y potajes sevillanos',
        defaultTags: ['Receta Andaluza', 'Cuchara'],
      },
    ],
  },
  {
    categoryId: 'cat-al-fresquito',
    categoryName: 'Al Fresquito & Aliños',
    subtypes: [
      {
        id: 'ensaladillas-frias',
        name: 'Ensaladillas de la Casa',
        description: 'Ensaladilla clásica y papas aliñadas',
        defaultTags: ['Mayonesa Suave', 'Atún', 'Aliño de Sanlúcar'],
      },
      {
        id: 'salmorejo-gazpacho',
        name: 'Salmorejo & Sopas Frías',
        description: 'Salmorejo cordobés espeso con huevo y jamón',
        defaultTags: ['Tomate de Huerta', 'AOVE'],
      },
    ],
  },
  {
    categoryId: 'cat-pasarratos',
    categoryName: 'Pasarratos & Tapitas',
    subtypes: [
      {
        id: 'gildas-salazones',
        name: 'Gildas Marineras & Encurtidos',
        description: 'Banderillas vasco-andaluzas de anchoa y boquerón',
        defaultTags: ['Matrimonio', 'Picante Suave', 'Vinagre Fino'],
      },
    ],
  },
  {
    categoryId: 'cat-mar-sal',
    categoryName: 'Mar y Sal',
    subtypes: [
      {
        id: 'marisco-cocido',
        name: 'Marisco de Huelva Cocido',
        description: 'Gambas blancas y langostinos recién cocidos',
        defaultTags: ['Costa de Huelva', 'Al Punto de Sal'],
      },
      {
        id: 'mojama-pescados',
        name: 'Mojama & Salazones Finos',
        description: 'Mojama de almadraba con almendras fritas',
        defaultTags: ['Almadraba', 'Extra Tierna'],
      },
    ],
  },
  {
    categoryId: 'cat-croquetas',
    categoryName: 'Croquetas',
    subtypes: [
      {
        id: 'croquetas-caseras',
        name: 'Croquetas de la Abuela',
        description: 'Bechamel suave con jamón ibérico o gambas',
        defaultTags: ['Jamón Ibérico', 'Extra Cremosas', 'Rebozado Fino'],
      },
    ],
  },
  {
    categoryId: 'cat-la-despensa',
    categoryName: 'La Despensa',
    subtypes: [
      {
        id: 'conservas-selectas',
        name: 'Conservas del Sur en Aceite de Oliva',
        description: 'Melva canutera, berberechos y mejillones gigantes',
        defaultTags: ['AOVE', 'Lata Gourmet'],
      },
    ],
  },
];

/**
 * Infer default subtype and tags for a product if not explicitly present
 */
export function enrichProductWithTaxonomy(product: Product): Product {
  if (product.subtype && product.tags && product.tags.length > 0) {
    return product;
  }

  const nameNorm = product.name.toLowerCase();
  const descNorm = (product.description || '').toLowerCase();
  const catId = product.categoryId || '';

  let subtype = product.subtype || 'General';
  const tags: Set<string> = new Set(product.tags || []);

  if (catId === 'cat-bebidas' || catId.includes('bebida')) {
    if (nameNorm.includes('cruzcampo') || nameNorm.includes('cerveza') || nameNorm.includes('caña') || nameNorm.includes('doble') || nameNorm.includes('tercio')) {
      subtype = 'Cervezas';
      if (nameNorm.includes('sin alcohol') || nameNorm.includes('0,0') || nameNorm.includes('cero')) {
        tags.add('Sin Alcohol (0,0)');
      } else {
        tags.add('Con Alcohol');
      }

      if (nameNorm.includes('caña') || nameNorm.includes('doble') || nameNorm.includes('cortada') || nameNorm.includes('barril')) {
        tags.add('Barril');
      } else if (nameNorm.includes('tercio') || nameNorm.includes('botell')) {
        tags.add('Tercio');
      }
      if (nameNorm.includes('reserva')) tags.add('Reserva');
      if (nameNorm.includes('especial')) tags.add('Especial');
    } else if (nameNorm.includes('rioja') || nameNorm.includes('ribera') || nameNorm.includes('tinto')) {
      subtype = 'Vinos Tintos';
      tags.add('Con Alcohol');
      if (nameNorm.includes('rioja')) tags.add('Rioja');
      if (nameNorm.includes('ribera')) tags.add('Ribera del Duero');
      if (nameNorm.includes('crianza')) tags.add('Crianza');
      if (nameNorm.includes('roble')) tags.add('Roble');
    } else if (nameNorm.includes('rueda') || nameNorm.includes('blanco') || nameNorm.includes('verdejo') || nameNorm.includes('cádiz') || nameNorm.includes('barbadillo') || nameNorm.includes('manzanilla')) {
      subtype = 'Vinos Blancos & Generosos';
      tags.add('Con Alcohol');
      if (nameNorm.includes('rueda') || nameNorm.includes('verdejo')) tags.add('Verdejo');
      if (nameNorm.includes('cádiz') || nameNorm.includes('barbadillo')) tags.add('Tierra de Cádiz');
      if (nameNorm.includes('manzanilla')) tags.add('Manzanilla');
    } else if (nameNorm.includes('refresco') || nameNorm.includes('coca') || nameNorm.includes('fanta') || nameNorm.includes('agua')) {
      subtype = 'Refrescos & Aguas';
      tags.add('Sin Alcohol');
      if (nameNorm.includes('agua')) tags.add('Mineral');
      if (descNorm.includes('zero') || nameNorm.includes('zero')) tags.add('Zero');
      else if (!nameNorm.includes('agua')) tags.add('Normal');
    }
  } else if (catId === 'cat-papelones') {
    if (nameNorm.includes('queso') || nameNorm.includes('payoyo') || nameNorm.includes('apolonio')) {
      subtype = 'Quesos Puros de Sierra';
      if (nameNorm.includes('payoyo')) tags.add('Queso Payoyo');
      if (nameNorm.includes('apolonio')) tags.add('Queso Apolonio');
      tags.add('Curado');
    } else if (nameNorm.includes('chicharron') || nameNorm.includes('chicharrón')) {
      subtype = 'Chicharrones & Salazones';
      tags.add('Al Corte');
      tags.add('Estilo Cádiz');
    } else {
      subtype = 'Ibéricos de Bellota';
      if (nameNorm.includes('jamon') || nameNorm.includes('jamón')) tags.add('100% Bellota');
      if (nameNorm.includes('lomo')) tags.add('Caña de Lomo');
      if (nameNorm.includes('chorizo') || nameNorm.includes('salchichon') || nameNorm.includes('salchichón')) tags.add('Embutido Noble');
    }
  } else if (catId === 'cat-entre-panes') {
    if (nameNorm.includes('mollete')) {
      subtype = 'Molletes Quimera (Calientes)';
      if (nameNorm.includes('quimera')) tags.add('Especialidad Quimera');
      if (nameNorm.includes('pring')) tags.add('Pringá Casera');
      if (nameNorm.includes('mecha')) tags.add('Carne Mechada');
      if (nameNorm.includes('presa')) tags.add('Presa Ibérica');
    } else {
      subtype = 'Montaditos & Tostas';
      tags.add('Crujiente');
    }
  } else if (catId === 'cat-huevos') {
    if (nameNorm.includes('tortilla')) {
      subtype = 'Tortillas con Salsa';
      if (nameNorm.includes('whisky')) tags.add('Al Whisky');
      if (nameNorm.includes('roque')) tags.add('Al Roquefort');
    } else {
      subtype = 'Huevos Rotos de Campo';
      tags.add('Yema Melosa');
    }
  } else if (catId === 'cat-guisos') {
    if (nameNorm.includes('carrillada') || nameNorm.includes('solomillo')) {
      subtype = 'Cazuelas Ibéricas & Carnes';
      tags.add('A Fuego Lento');
      tags.add('Ibérico');
    } else {
      subtype = 'Cuchareo Tradicional';
      tags.add('Receta Andaluza');
    }
  } else if (catId === 'cat-al-fresquito') {
    if (nameNorm.includes('salmorejo') || nameNorm.includes('gazpacho')) {
      subtype = 'Salmorejo & Sopas Frías';
      tags.add('AOVE');
    } else {
      subtype = 'Ensaladillas de la Casa';
      tags.add('Aliño Fresco');
    }
  } else if (catId === 'cat-pasarratos') {
    subtype = 'Gildas Marineras & Encurtidos';
    tags.add('Aperitivo');
  } else if (catId === 'cat-mar-sal') {
    if (nameNorm.includes('gamba') || nameNorm.includes('marisco') || nameNorm.includes('langostino')) {
      subtype = 'Marisco de Huelva Cocido';
      tags.add('Costa de Huelva');
    } else {
      subtype = 'Mojama & Salazones Finos';
      tags.add('Almadraba');
    }
  } else if (catId === 'cat-croquetas') {
    subtype = 'Croquetas de la Abuela';
    tags.add('Extra Cremosas');
  } else if (catId === 'cat-la-despensa') {
    subtype = 'Conservas del Sur en Aceite de Oliva';
    tags.add('Lata Gourmet');
  }

  return {
    ...product,
    subtype,
    tags: Array.from(tags),
  };
}

export interface TreeSubtypeNode {
  id: string;
  name: string;
  products: Product[];
  totalCount: number;
  availableCount: number;
  tags: {
    tag: string;
    products: Product[];
  }[];
}

export interface TreeCategoryNode {
  categoryId: string;
  categoryName: string;
  totalCount: number;
  availableCount: number;
  subtypes: TreeSubtypeNode[];
}

/**
 * Build the full hierarchical tree for the IDE sidebar
 */
export function buildTaxonomyTree(
  products: Product[],
  categories: Category[]
): TreeCategoryNode[] {
  const enrichedProducts = products.map(enrichProductWithTaxonomy);

  return categories.map((cat) => {
    const catProducts = enrichedProducts.filter((p) => p.categoryId === cat.id);

    // Group by subtype
    const subtypeMap = new Map<string, Product[]>();
    for (const prod of catProducts) {
      const sub = prod.subtype || 'General';
      if (!subtypeMap.has(sub)) subtypeMap.set(sub, []);
      subtypeMap.get(sub)!.push(prod);
    }

    const subtypeNodes: TreeSubtypeNode[] = Array.from(subtypeMap.entries()).map(
      ([subName, prods]) => {
        // Collect all unique tags in this subtype
        const tagMap = new Map<string, Product[]>();
        for (const p of prods) {
          const pTags = p.tags || [];
          for (const t of pTags) {
            if (!tagMap.has(t)) tagMap.set(t, []);
            tagMap.get(t)!.push(p);
          }
        }

        const tagsList = Array.from(tagMap.entries()).map(([tag, tagProds]) => ({
          tag,
          products: tagProds,
        }));

        return {
          id: `${cat.id}-${subName.toLowerCase().replace(/\s+/g, '-')}`,
          name: subName,
          products: prods,
          totalCount: prods.length,
          availableCount: prods.filter((p) => p.isAvailable).length,
          tags: tagsList,
        };
      }
    );

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      totalCount: catProducts.length,
      availableCount: catProducts.filter((p) => p.isAvailable).length,
      subtypes: subtypeNodes,
    };
  });
}

export type TaxonomyIconType =
  | 'beer'
  | 'wine-red'
  | 'wine-white'
  | 'wine-frizante'
  | 'soda'
  | 'water'
  | 'ham'
  | 'cheese'
  | 'sandwich'
  | 'egg'
  | 'pot'
  | 'fish'
  | 'croquette'
  | 'tapas'
  | 'salad'
  | 'canned'
  | 'tag'
  | 'folder';

export interface TaxonomyIconConfig {
  iconType: TaxonomyIconType;
  label: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Resolves tailored icon, color, and badge styles matching exact item semantics:
 * refrescos, vinos blancos, vinos tintos, vinos frizantes, cervezas, croquetas, pasaratos, quesos, etc.
 */
export function getTaxonomyIconConfig(name: string, categoryId = ''): TaxonomyIconConfig {
  const norm = (name || '').toLowerCase();
  const catNorm = (categoryId || '').toLowerCase();

  // 1. Refrescos & Sodas
  if (
    norm.includes('refresco') ||
    norm.includes('coca') ||
    norm.includes('fanta') ||
    norm.includes('zero') ||
    norm.includes('soda') ||
    norm.includes('aquarius') ||
    norm.includes('nestea')
  ) {
    return {
      iconType: 'soda',
      label: 'Refresco',
      textColor: 'text-sky-600',
      bgColor: 'bg-sky-50',
      borderColor: 'border-sky-200',
    };
  }

  // 2. Agua Mineral
  if (norm.includes('agua') || norm.includes('mineral')) {
    return {
      iconType: 'water',
      label: 'Agua',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    };
  }

  // 3. Vinos Frizantes / Espumosos / Cava / Semidulce / Aguja
  if (
    norm.includes('frizante') ||
    norm.includes('frizzante') ||
    norm.includes('espumoso') ||
    norm.includes('cava') ||
    norm.includes('semidulce') ||
    norm.includes('burbuja') ||
    norm.includes('aguja')
  ) {
    return {
      iconType: 'wine-frizante',
      label: 'Vino Frizante',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
    };
  }

  // 4. Vinos Tintos / Rioja / Ribera
  if (
    norm.includes('tinto') ||
    norm.includes('rioja') ||
    norm.includes('ribera') ||
    norm.includes('roble') ||
    norm.includes('crianza')
  ) {
    return {
      iconType: 'wine-red',
      label: 'Vino Tinto',
      textColor: 'text-[#9E2A2B]',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    };
  }

  // 5. Vinos Blancos & Generosos / Manzanilla / Verdejo / Rueda / Cádiz
  if (
    norm.includes('blanco') ||
    norm.includes('verdejo') ||
    norm.includes('rueda') ||
    norm.includes('cádiz') ||
    norm.includes('cadiz') ||
    norm.includes('barbadillo') ||
    norm.includes('manzanilla') ||
    norm.includes('seco')
  ) {
    return {
      iconType: 'wine-white',
      label: 'Vino Blanco',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  }

  // 6. Cervezas (Barril, Cortada, Doble, Tercios, Gran Reserva, 0,0)
  if (
    norm.includes('cerveza') ||
    norm.includes('cruzcampo') ||
    norm.includes('caña') ||
    norm.includes('doble') ||
    norm.includes('cortada') ||
    norm.includes('barril') ||
    norm.includes('tercio') ||
    norm.includes('especial') ||
    norm.includes('reserva') ||
    norm.includes('0,0') ||
    norm.includes('sin alcohol')
  ) {
    return {
      iconType: 'beer',
      label: 'Cerveza',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  }

  // 7. Croquetas
  if (norm.includes('croqueta')) {
    return {
      iconType: 'croquette',
      label: 'Croquetas',
      textColor: 'text-amber-800',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  }

  // 8. Pasarratos / Gildas / Aperitivos / Matrimonio / Encurtidos
  if (
    norm.includes('gilda') ||
    norm.includes('pasarrato') ||
    norm.includes('aperitivo') ||
    norm.includes('matrimonio') ||
    norm.includes('encurtido') ||
    catNorm.includes('pasarratos')
  ) {
    return {
      iconType: 'tapas',
      label: 'Pasarratos',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    };
  }

  // 9. Quesos (Payoyo, Apolonio, Curado, Oveja)
  if (
    norm.includes('queso') ||
    norm.includes('payoyo') ||
    norm.includes('apolonio') ||
    norm.includes('oveja') ||
    norm.includes('cabra')
  ) {
    return {
      iconType: 'cheese',
      label: 'Queso',
      textColor: 'text-yellow-700',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    };
  }

  // 10. Chacinas / Ibéricos / Jamón / Bellota / Lomo / Embutido
  if (
    norm.includes('jamon') ||
    norm.includes('jamón') ||
    norm.includes('bellota') ||
    norm.includes('lomo') ||
    norm.includes('chacina') ||
    norm.includes('embutido') ||
    norm.includes('salchichon') ||
    norm.includes('chorizo') ||
    norm.includes('papelon') ||
    catNorm.includes('papelones')
  ) {
    return {
      iconType: 'ham',
      label: 'Ibéricos & Chacinas',
      textColor: 'text-rose-800',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
    };
  }

  // 11. Entre Panes / Molletes / Montaditos / Tostas / Pringá / Mechada
  if (
    norm.includes('mollete') ||
    norm.includes('pan') ||
    norm.includes('montadito') ||
    norm.includes('tosta') ||
    norm.includes('pringa') ||
    norm.includes('pringá') ||
    norm.includes('mecha') ||
    norm.includes('presa') ||
    catNorm.includes('entre-panes')
  ) {
    return {
      iconType: 'sandwich',
      label: 'Entre Panes',
      textColor: 'text-orange-800',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    };
  }

  // 12. Huevos & Tortillas
  if (
    norm.includes('huevo') ||
    norm.includes('tortilla') ||
    norm.includes('yema') ||
    norm.includes('roto') ||
    catNorm.includes('huevos')
  ) {
    return {
      iconType: 'egg',
      label: 'Huevos & Tortillas',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  }

  // 13. Guisos & Cazuelas / Cuchareo
  if (
    norm.includes('guiso') ||
    norm.includes('cazuela') ||
    norm.includes('carrillada') ||
    norm.includes('solomillo') ||
    norm.includes('cuchara') ||
    norm.includes('espinaca') ||
    catNorm.includes('guisos')
  ) {
    return {
      iconType: 'pot',
      label: 'Guisos & Cuchareo',
      textColor: 'text-orange-900',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
    };
  }

  // 14. Mar y Sal / Mariscos / Gambas / Mojama
  if (
    norm.includes('mar') ||
    norm.includes('marisco') ||
    norm.includes('gamba') ||
    norm.includes('langostino') ||
    norm.includes('mojama') ||
    norm.includes('pescado') ||
    catNorm.includes('mar-sal')
  ) {
    return {
      iconType: 'fish',
      label: 'Mar y Sal',
      textColor: 'text-cyan-800',
      bgColor: 'bg-cyan-50',
      borderColor: 'border-cyan-200',
    };
  }

  // 15. Al Fresquito / Ensaladillas / Salmorejo
  if (
    norm.includes('ensalada') ||
    norm.includes('ensaladilla') ||
    norm.includes('salmorejo') ||
    norm.includes('fresquito') ||
    norm.includes('aliño') ||
    catNorm.includes('al-fresquito')
  ) {
    return {
      iconType: 'salad',
      label: 'Al Fresquito',
      textColor: 'text-emerald-800',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
    };
  }

  // 16. La Despensa / Conservas
  if (
    norm.includes('despensa') ||
    norm.includes('conserva') ||
    norm.includes('lata') ||
    catNorm.includes('la-despensa')
  ) {
    return {
      iconType: 'canned',
      label: 'Conservas',
      textColor: 'text-stone-700',
      bgColor: 'bg-stone-50',
      borderColor: 'border-stone-200',
    };
  }

  // 17. Fallback
  return {
    iconType: 'tag',
    label: name,
    textColor: 'text-stone-600',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-200',
  };
}
