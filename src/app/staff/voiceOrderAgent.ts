export type DestinationStation = 'BEBIDAS' | 'CHACINAS' | 'COCINA';

export interface StationConfig {
  code: DestinationStation;
  name: string;
  iconName: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  description: string;
}

export const STATIONS: Record<DestinationStation, StationConfig> = {
  BEBIDAS: {
    code: 'BEBIDAS',
    name: 'Bebidas (Barra)',
    iconName: 'Beer',
    badgeColor: 'text-amber-800',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    description: 'Cervezas de barril, tercios, vinos, refrescos y copas',
  },
  CHACINAS: {
    code: 'CHACINAS',
    name: 'Chacinas & Fríos (Corte)',
    iconName: 'Ham',
    badgeColor: 'text-rose-800',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    description: 'Papelones ibéricos, quesos de la sierra, ensaladillas y salazones',
  },
  COCINA: {
    code: 'COCINA',
    name: 'Cocina & Calientes',
    iconName: 'ChefHat',
    badgeColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    description: 'Molletes calientes, guisos, huevos rotos, fritos y plancha',
  },
};

export interface ParsedVoiceItem {
  id: string;
  productId: string;
  productName: string;
  matchedAlias?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  station: DestinationStation;
  notes?: string;
}

export interface VoiceOrderResult {
  rawTranscript: string;
  detectedTableNumber: string | null;
  items: ParsedVoiceItem[];
  totalAmount: number;
  unmatchedPhrases: string[];
}

interface ProductLike {
  id: string;
  name: string;
  price: number;
  categoryId?: string | null;
  description?: string | null;
}

// Convert Spanish words to numbers
const SPANISH_NUMBERS: Record<string, number> = {
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12,
  trece: 13,
  catorce: 14,
  quince: 15,
  veinte: 20,
  'media docena': 6,
  docena: 12,
  'una docena': 12,
};

// Common Andalusian tapas and drinks alias catalog mapping to product keywords
const PRODUCT_ALIASES: Array<{
  alias: string;
  targetKeywords: string[];
  station: DestinationStation;
}> = [
  // BEBIDAS
  { alias: 'cortada', targetKeywords: ['caña', 'cortada', 'cruzcampo'], station: 'BEBIDAS' },
  { alias: 'cortadas', targetKeywords: ['caña', 'cortada', 'cruzcampo'], station: 'BEBIDAS' },
  { alias: 'caña', targetKeywords: ['caña', 'cortada', 'cruzcampo'], station: 'BEBIDAS' },
  { alias: 'cañas', targetKeywords: ['caña', 'cortada', 'cruzcampo'], station: 'BEBIDAS' },
  { alias: 'doble', targetKeywords: ['doble', 'entera', 'cruzcampo'], station: 'BEBIDAS' },
  { alias: 'dobles', targetKeywords: ['doble', 'entera', 'cruzcampo'], station: 'BEBIDAS' },
  { alias: 'entera', targetKeywords: ['doble', 'entera', 'cruzcampo'], station: 'BEBIDAS' },
  { alias: 'tercio', targetKeywords: ['tercio', 'especial'], station: 'BEBIDAS' },
  { alias: 'tercios', targetKeywords: ['tercio', 'especial'], station: 'BEBIDAS' },
  { alias: 'tercio reserva', targetKeywords: ['tercio', 'gran', 'reserva'], station: 'BEBIDAS' },
  { alias: 'gran reserva', targetKeywords: ['tercio', 'gran', 'reserva'], station: 'BEBIDAS' },
  { alias: 'sin alcohol', targetKeywords: ['cerveza', 'sin', 'alcohol'], station: 'BEBIDAS' },
  { alias: 'cero cero', targetKeywords: ['cerveza', 'sin', 'alcohol'], station: 'BEBIDAS' },
  { alias: 'rioja', targetKeywords: ['tinto', 'rioja'], station: 'BEBIDAS' },
  { alias: 'vino tinto', targetKeywords: ['tinto', 'rioja'], station: 'BEBIDAS' },
  { alias: 'ribera', targetKeywords: ['tinto', 'ribera'], station: 'BEBIDAS' },
  { alias: 'rueda', targetKeywords: ['blanco', 'rueda'], station: 'BEBIDAS' },
  { alias: 'verdejo', targetKeywords: ['blanco', 'rueda', 'verdejo'], station: 'BEBIDAS' },
  { alias: 'vino blanco', targetKeywords: ['blanco', 'rueda'], station: 'BEBIDAS' },
  { alias: 'barbadillo', targetKeywords: ['tierra', 'cadiz', 'barbadillo'], station: 'BEBIDAS' },
  { alias: 'manzanilla', targetKeywords: ['manzanilla', 'sanlucar'], station: 'BEBIDAS' },
  { alias: 'coca cola', targetKeywords: ['refrescos', 'variados'], station: 'BEBIDAS' },
  { alias: 'refresco', targetKeywords: ['refrescos', 'variados'], station: 'BEBIDAS' },
  { alias: 'fanta', targetKeywords: ['refrescos', 'variados'], station: 'BEBIDAS' },
  { alias: 'agua', targetKeywords: ['agua', 'mineral'], station: 'BEBIDAS' },

  // CHACINAS & FRÍOS
  { alias: 'queso payoyo', targetKeywords: ['queso', 'payoyo'], station: 'CHACINAS' },
  { alias: 'payoyo', targetKeywords: ['queso', 'payoyo'], station: 'CHACINAS' },
  { alias: 'quesos payoyo', targetKeywords: ['queso', 'payoyo'], station: 'CHACINAS' },
  { alias: 'apolonio', targetKeywords: ['queso', 'apolonio'], station: 'CHACINAS' },
  { alias: 'queso viejo', targetKeywords: ['queso', 'apolonio'], station: 'CHACINAS' },
  { alias: 'jamon', targetKeywords: ['jamon', 'bellota'], station: 'CHACINAS' },
  { alias: 'jamón', targetKeywords: ['jamon', 'bellota'], station: 'CHACINAS' },
  { alias: 'jamon iberico', targetKeywords: ['jamon', 'bellota', '100'], station: 'CHACINAS' },
  { alias: 'jamón ibérico', targetKeywords: ['jamon', 'bellota', '100'], station: 'CHACINAS' },
  { alias: 'papelon de jamon', targetKeywords: ['jamon', 'bellota'], station: 'CHACINAS' },
  { alias: 'taquitos de jamon', targetKeywords: ['taquitos', 'jamon'], station: 'CHACINAS' },
  { alias: 'salchichon', targetKeywords: ['salchichon', 'taquitos'], station: 'CHACINAS' },
  { alias: 'chorizo', targetKeywords: ['chorizo', 'iberico'], station: 'CHACINAS' },
  { alias: 'chicharron especial', targetKeywords: ['chicharron', 'especial', 'cadiz'], station: 'CHACINAS' },
  { alias: 'caña de lomo', targetKeywords: ['caña', 'lomo'], station: 'CHACINAS' },
  { alias: 'lomo', targetKeywords: ['caña', 'lomo'], station: 'CHACINAS' },
  { alias: 'lomito', targetKeywords: ['lomito', 'iberico'], station: 'CHACINAS' },
  { alias: 'ensaladilla', targetKeywords: ['ensaladilla', 'clasica'], station: 'CHACINAS' },
  { alias: 'ensaladilla rusa', targetKeywords: ['ensaladilla', 'clasica'], station: 'CHACINAS' },
  { alias: 'papas aliñas', targetKeywords: ['papas', 'aliñas'], station: 'CHACINAS' },
  { alias: 'papas aliñadas', targetKeywords: ['papas', 'aliñas'], station: 'CHACINAS' },
  { alias: 'salmorejo', targetKeywords: ['salmorejo', 'cordobes'], station: 'CHACINAS' },
  { alias: 'gildas', targetKeywords: ['gilda', 'matrimonio'], station: 'CHACINAS' },
  { alias: 'gilda', targetKeywords: ['gilda', 'matrimonio'], station: 'CHACINAS' },

  // COCINA & CALIENTES
  { alias: 'mollete quimera', targetKeywords: ['molletito', 'quimera'], station: 'COCINA' },
  { alias: 'molletes quimera', targetKeywords: ['molletito', 'quimera'], station: 'COCINA' },
  { alias: 'molletito quimera', targetKeywords: ['molletito', 'quimera'], station: 'COCINA' },
  { alias: 'molletitos quimera', targetKeywords: ['molletito', 'quimera'], station: 'COCINA' },
  { alias: 'quimera', targetKeywords: ['molletito', 'quimera'], station: 'COCINA' },
  { alias: 'mollete pringa', targetKeywords: ['mollete', 'pringa'], station: 'COCINA' },
  { alias: 'molletes pringa', targetKeywords: ['mollete', 'pringa'], station: 'COCINA' },
  { alias: 'pringa', targetKeywords: ['mollete', 'pringa'], station: 'COCINA' },
  { alias: 'pringá', targetKeywords: ['mollete', 'pringa'], station: 'COCINA' },
  { alias: 'mollete presa', targetKeywords: ['mollete', 'presa'], station: 'COCINA' },
  { alias: 'mollete carne mecha', targetKeywords: ['mollete', 'carne', 'mecha'], station: 'COCINA' },
  { alias: 'carne mecha', targetKeywords: ['mollete', 'carne', 'mecha'], station: 'COCINA' },
  { alias: 'croquetas', targetKeywords: ['croquetas', 'jamon'], station: 'COCINA' },
  { alias: 'croqueta', targetKeywords: ['croquetas', 'jamon'], station: 'COCINA' },
  { alias: 'huevos rotos', targetKeywords: ['huevos', 'rotos'], station: 'COCINA' },
  { alias: 'tortilla whisky', targetKeywords: ['tortilla', 'whisky'], station: 'COCINA' },
  { alias: 'tortilla al whisky', targetKeywords: ['tortilla', 'whisky'], station: 'COCINA' },
  { alias: 'tortilla roque', targetKeywords: ['tortilla', 'roque'], station: 'COCINA' },
  { alias: 'carrillada', targetKeywords: ['carrillada', 'iberica'], station: 'COCINA' },
  { alias: 'espinacas', targetKeywords: ['espinacas', 'garbanzos'], station: 'COCINA' },
  { alias: 'solomillo al whisky', targetKeywords: ['solomillo', 'whisky'], station: 'COCINA' },
  { alias: 'solomillo', targetKeywords: ['solomillo', 'whisky'], station: 'COCINA' },
  { alias: 'chicharron frito', targetKeywords: ['chicharron', 'frito'], station: 'COCINA' },
];

/**
 * Determine station based on category slug or item keywords
 */
export function resolveItemStation(categorySlugOrId?: string, productName = ''): DestinationStation {
  const norm = (categorySlugOrId || '').toLowerCase();
  const prodNorm = productName.toLowerCase();

  if (norm.includes('bebidas') || norm.includes('cat-bebidas')) return 'BEBIDAS';
  if (norm.includes('papelones') || norm.includes('pasarratos') || norm.includes('mar-sal') || norm.includes('al-fresquito')) {
    return 'CHACINAS';
  }
  if (norm.includes('entre-panes') || norm.includes('guisos') || norm.includes('huevos') || norm.includes('croquetas') || norm.includes('despensa')) {
    return 'COCINA';
  }

  // Keyword fallbacks
  if (/\b(caña|cortada|doble|tercio|cerveza|vino|tinto|blanco|copa|agua|refresco|manzanilla)\b/i.test(prodNorm)) {
    return 'BEBIDAS';
  }
  if (/\b(jamon|jamón|payoyo|queso|salchichon|chorizo|lomo|chicharron especial|gilda|ensaladilla|mojama)\b/i.test(prodNorm)) {
    return 'CHACINAS';
  }
  return 'COCINA';
}

/**
 * Normalizes text removing accents
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Main NLP Voice Parser
 * Analyzes speech transcripts like:
 * "mesa 110, 4 cortadas, 2 molletes quimera, 1 queso payoyo"
 */
export function parseVoiceOrder(
  transcript: string,
  availableProducts: ProductLike[],
  knownTables: { tableNumber: string; name: string }[] = []
): VoiceOrderResult {
  const normalized = normalizeText(transcript);
  let workingText = normalized;

  // 1. Detect Destination Table
  // Examples: "mesa 110", "mesa t2", "la 110", "barra 1", "terraza 3", "mesa 2"
  let detectedTableNumber: string | null = null;

  const tableRegexes = [
    /\b(?:para\s+la\s+|en\s+la\s+|mesa\s+|mesas\s+|la\s+mesa\s+)([a-z0-9_-]+)\b/i,
    /\b(?:barra\s+|la\s+barra\s+)([0-9]+)\b/i,
    /\b(?:terraza\s+|la\s+terraza\s+)([0-9]+)\b/i,
    /\b(?:mesa)\s*([0-9]+)\b/i,
  ];

  for (const regex of tableRegexes) {
    const match = workingText.match(regex);
    if (match) {
      const rawNum = match[1];
      if (/^barra/i.test(match[0])) {
        detectedTableNumber = `Barra ${rawNum}`;
      } else if (/^terraza/i.test(match[0])) {
        detectedTableNumber = `Terraza ${rawNum}`;
      } else {
        // Look up in knownTables if there is a match like "Mesa 110" or "T110"
        const existing = knownTables.find(
          (t) =>
            normalizeText(t.tableNumber) === `mesa ${rawNum}` ||
            normalizeText(t.name) === `mesa ${rawNum}` ||
            normalizeText(t.tableNumber) === rawNum
        );
        detectedTableNumber = existing ? existing.tableNumber : `Mesa ${rawNum.toUpperCase()}`;
      }
      // Remove table part from working text to prevent confusing items
      workingText = workingText.replace(match[0], ' ');
      break;
    }
  }

  // 2. Pre-process text to insert boundary delimiters before numbers or quantity words
  let preparedText = workingText
    // Insert delimiter before digits followed by words (e.g., "cortadas 2 molletes" -> "cortadas | 2 molletes")
    .replace(/([a-zñáéíóú])\s+(\d+\s+[a-zñáéíóú])/gi, '$1 | $2')
    // Insert delimiter before Spanish number words
    .replace(
      /([a-zñáéíóú])\s+((?:un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|media docena|docena)\s+[a-zñáéíóú])/gi,
      '$1 | $2'
    );

  // Split by "|", commas, semicolons, conjunctions ("y", "e", "con", "ademas")
  const segments = preparedText
    .split(/\s*(?:\||[,;\n]+|\s+(?:y|e|ademas|tambien|con)\s+)\s*/i)
    .map((s) => s.trim().replace(/^[,;.]+|[,;.]+$/g, ''))
    .filter(Boolean);

  const parsedItems: ParsedVoiceItem[] = [];
  const unmatchedPhrases: string[] = [];

  for (const seg of segments) {
    let cleanSeg = seg.trim();
    if (!cleanSeg) continue;

    // Detect quantity in segment (digit or Spanish word)
    let quantity = 1;
    let textAfterQty = cleanSeg;

    // Number word or digits at the beginning
    const qtyMatch = cleanSeg.match(/^(\d+|un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|media docena|docena)\s+(.+)$/i);
    if (qtyMatch) {
      const qToken = qtyMatch[1].toLowerCase();
      if (/^\d+$/.test(qToken)) {
        quantity = parseInt(qToken, 10);
      } else if (SPANISH_NUMBERS[qToken]) {
        quantity = SPANISH_NUMBERS[qToken];
      }
      textAfterQty = qtyMatch[2].trim();
    } else {
      // Check if ends with number or has embedded quantity
      const altQtyMatch = cleanSeg.match(/(.+?)\s+(\d+)$/i);
      if (altQtyMatch) {
        textAfterQty = altQtyMatch[1].trim();
        quantity = parseInt(altQtyMatch[2], 10);
      }
    }

    const normItemText = normalizeText(textAfterQty);

    // 3. Match against PRODUCT_ALIASES first (high-precision bar vocabulary)
    let matchedProduct: ProductLike | null = null;
    let matchedAliasName = '';
    let matchedStation: DestinationStation = 'COCINA';

    // Sort aliases by length descending so "queso payoyo" matches before "queso"
    const sortedAliases = [...PRODUCT_ALIASES].sort((a, b) => b.alias.length - a.alias.length);

    for (const rule of sortedAliases) {
      const normAlias = normalizeText(rule.alias);
      if (normItemText.includes(normAlias)) {
        matchedAliasName = rule.alias;
        matchedStation = rule.station;

        // Find candidate product that contains rule keywords
        matchedProduct =
          availableProducts.find((p) => {
            const pNorm = normalizeText(p.name);
            return rule.targetKeywords.every((kw) => pNorm.includes(normalizeText(kw)));
          }) || null;

        if (matchedProduct) break;
      }
    }

    // 4. Fallback: Direct keyword match against product names in database
    if (!matchedProduct) {
      for (const prod of availableProducts) {
        const prodNorm = normalizeText(prod.name);
        // Direct inclusion
        if (normItemText.includes(prodNorm) || prodNorm.includes(normItemText)) {
          matchedProduct = prod;
          matchedStation = resolveItemStation(prod.categoryId || undefined, prod.name);
          break;
        }
      }
    }

    // 5. Fallback 2: Token overlap score
    if (!matchedProduct) {
      const tokens = normItemText.split(' ').filter((t) => t.length > 2);
      let bestScore = 0;
      let candidate: ProductLike | null = null;

      for (const prod of availableProducts) {
        const prodNorm = normalizeText(prod.name);
        let score = 0;
        for (const token of tokens) {
          if (prodNorm.includes(token)) score += token.length;
        }
        if (score > bestScore && score >= 4) {
          bestScore = score;
          candidate = prod;
        }
      }

      if (candidate) {
        matchedProduct = candidate;
        matchedStation = resolveItemStation(candidate.categoryId || undefined, candidate.name);
      }
    }

    if (matchedProduct) {
      const unitPrice = matchedProduct.price || 0;
      parsedItems.push({
        id: `voice-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: matchedProduct.id,
        productName: matchedProduct.name,
        matchedAlias: matchedAliasName || undefined,
        quantity: Math.max(1, quantity),
        unitPrice,
        totalPrice: Math.round(unitPrice * Math.max(1, quantity) * 100) / 100,
        station: matchedStation,
      });
    } else {
      unmatchedPhrases.push(cleanSeg);
    }
  }

  const totalAmount = parsedItems.reduce((acc, it) => acc + it.totalPrice, 0);

  return {
    rawTranscript: transcript,
    detectedTableNumber,
    items: parsedItems,
    totalAmount: Math.round(totalAmount * 100) / 100,
    unmatchedPhrases,
  };
}
