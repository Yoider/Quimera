export type AllergenType =
  | 'Gluten'
  | 'Lácteos'
  | 'Moluscos'
  | 'Pescado'
  | 'Huevos'
  | 'Frutos de cáscara'
  | 'Sulfitos'
  | 'Mostaza'
  | 'Sésamo'
  | 'Soja'
  | 'Altramuces'
  | 'Apio'
  | 'Crustáceos'
  | 'Cacahuetes';

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description?: string;
  orderIndex: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  price: number;
  format: string; // e.g. "100grs", "Unidad", "Copa", "Caña", "Tapa"
  categoryId: string;
  imageUrl: string;
  allergens: AllergenType[];
  rating: number; // 0 - 5 float
  totalReviews: number;
  isAvailable: boolean;
  badge?: string; // e.g. "Especialidad de la casa", "Top Ventas"
  subtype?: string; // e.g. "Cervezas", "Vinos Tintos", "Refrescos"
  tags?: string[]; // e.g. ["Barril", "Con Alcohol", "Zero", "100% Bellota"]
}

export interface FilterState {
  searchQuery: string;
  selectedCategoryId: string | null;
  excludedAllergens: AllergenType[];
  onlyAvailable: boolean;
}
