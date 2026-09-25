import { CATEGORIES, PRODUCTS } from '@/data/mockMenu';
import { Category, Product } from '@/types/menu';

// In-memory store initialized with the mock catalog
// Can be backed by Prisma when a live database is configured
let currentProducts: Product[] = [...PRODUCTS];

export async function getCategories(): Promise<Category[]> {
  return [...CATEGORIES].sort((a, b) => a.orderIndex - b.orderIndex);
}

export async function getProducts(categoryId?: string): Promise<Product[]> {
  if (categoryId) {
    return currentProducts.filter((p) => p.categoryId === categoryId);
  }
  return [...currentProducts];
}

export async function getProductById(id: string): Promise<Product | undefined> {
  return currentProducts.find((p) => p.id === id);
}

export async function toggleProductAvailability(id: string, isAvailable: boolean): Promise<Product | null> {
  const index = currentProducts.findIndex((p) => p.id === id);
  if (index === -1) return null;
  currentProducts[index] = {
    ...currentProducts[index],
    isAvailable,
  };
  return currentProducts[index];
}

export async function resetCatalog(): Promise<void> {
  currentProducts = [...PRODUCTS];
}
