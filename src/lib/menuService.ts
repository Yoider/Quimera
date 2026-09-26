import { prisma } from './prisma';
import { CATEGORIES, PRODUCTS } from '@/data/mockMenu';
import { Category, Product, AllergenType } from '@/types/menu';

/**
 * Fetch all categories from PostgreSQL database with fallback to mock data
 */
export async function getCategories(): Promise<Category[]> {
  try {
    const dbCategories = await prisma.category.findMany({
      orderBy: { orderIndex: 'asc' },
    });

    if (dbCategories && dbCategories.length > 0) {
      return dbCategories.map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        icon: c.icon,
        description: c.description || undefined,
        orderIndex: c.orderIndex,
      }));
    }
  } catch (err) {
    console.warn('⚠️ No se pudo conectar a PostgreSQL para getCategories, usando datos mock:', err);
  }

  return [...CATEGORIES].sort((a, b) => a.orderIndex - b.orderIndex);
}

/**
 * Fetch all products or products by category from PostgreSQL
 */
export async function getProducts(categoryId?: string): Promise<Product[]> {
  try {
    const dbProducts = await prisma.product.findMany({
      where: categoryId ? { categoryId } : undefined,
      include: {
        allergens: {
          include: {
            allergen: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (dbProducts && dbProducts.length > 0) {
      return dbProducts.map((p) => {
        let parsedIngredients: string[] = [];
        try {
          parsedIngredients = JSON.parse(p.ingredients);
        } catch {
          parsedIngredients = [p.ingredients];
        }

        const allergensList: AllergenType[] = p.allergens.map(
          (pa) => pa.allergen.name as AllergenType
        );

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          ingredients: parsedIngredients,
          price: p.price,
          format: p.format,
          categoryId: p.categoryId,
          imageUrl: p.imageUrl,
          allergens: allergensList,
          rating: p.rating,
          totalReviews: p.totalReviews,
          isAvailable: p.isAvailable,
          badge: p.badge || undefined,
        };
      });
    }
  } catch (err) {
    console.warn('⚠️ No se pudo conectar a PostgreSQL para getProducts, usando datos mock:', err);
  }

  if (categoryId) {
    return PRODUCTS.filter((p) => p.categoryId === categoryId);
  }
  return [...PRODUCTS];
}

/**
 * Fetch a single product by ID
 */
export async function getProductById(id: string): Promise<Product | undefined> {
  const allProducts = await getProducts();
  return allProducts.find((p) => p.id === id);
}

/**
 * Toggle product availability in PostgreSQL database
 */
export async function toggleProductAvailability(id: string, isAvailable: boolean): Promise<Product | null> {
  try {
    const updated = await prisma.product.update({
      where: { id },
      data: { isAvailable },
      include: {
        allergens: {
          include: {
            allergen: true,
          },
        },
      },
    });

    let parsedIngredients: string[] = [];
    try {
      parsedIngredients = JSON.parse(updated.ingredients);
    } catch {
      parsedIngredients = [updated.ingredients];
    }

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      ingredients: parsedIngredients,
      price: updated.price,
      format: updated.format,
      categoryId: updated.categoryId,
      imageUrl: updated.imageUrl,
      allergens: updated.allergens.map((pa) => pa.allergen.name as AllergenType),
      rating: updated.rating,
      totalReviews: updated.totalReviews,
      isAvailable: updated.isAvailable,
      badge: updated.badge || undefined,
    };
  } catch (err) {
    console.error('❌ Error al actualizar disponibilidad en PostgreSQL:', err);
    return null;
  }
}

/**
 * Reset all products availability to true
 */
export async function resetCatalog(): Promise<void> {
  try {
    await prisma.product.updateMany({
      data: { isAvailable: true },
    });
  } catch (err) {
    console.error('❌ Error al restablecer catálogo en PostgreSQL:', err);
  }
}
