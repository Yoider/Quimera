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
 * Toggle availability for multiple products in batch (subtypes/folders)
 */
export async function toggleBatchProductAvailability(ids: string[], isAvailable: boolean): Promise<boolean> {
  try {
    await prisma.product.updateMany({
      where: { id: { in: ids } },
      data: { isAvailable },
    });
    return true;
  } catch (err) {
    console.error('❌ Error al actualizar disponibilidad por lote en PostgreSQL:', err);
    return false;
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

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  format?: string;
  categoryId?: string;
  imageUrl?: string;
  ingredients?: string[];
  allergens?: AllergenType[];
  badge?: string | null;
  isAvailable?: boolean;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  format: string;
  categoryId: string;
  imageUrl?: string;
  ingredients?: string[];
  allergens?: AllergenType[];
  badge?: string;
  isAvailable?: boolean;
}

/**
 * Update an existing product in PostgreSQL
 */
export async function updateProduct(id: string, data: UpdateProductInput): Promise<Product | null> {
  try {
    const updatePayload: Record<string, unknown> = {};
    if (data.name !== undefined) updatePayload.name = data.name.trim();
    if (data.description !== undefined) updatePayload.description = data.description.trim();
    if (data.price !== undefined) updatePayload.price = Number(data.price);
    if (data.format !== undefined) updatePayload.format = data.format.trim();
    if (data.categoryId !== undefined) updatePayload.categoryId = data.categoryId;
    if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl.trim();
    if (data.badge !== undefined) updatePayload.badge = data.badge ? data.badge.trim() : null;
    if (data.isAvailable !== undefined) updatePayload.isAvailable = data.isAvailable;
    if (data.ingredients !== undefined) {
      updatePayload.ingredients = JSON.stringify(data.ingredients);
    }

    if (data.allergens !== undefined) {
      const dbAllergens = await prisma.allergen.findMany({
        where: { name: { in: data.allergens } },
      });

      await prisma.productAllergen.deleteMany({
        where: { productId: id },
      });

      if (dbAllergens.length > 0) {
        await prisma.productAllergen.createMany({
          data: dbAllergens.map((a) => ({
            productId: id,
            allergenId: a.id,
          })),
        });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: updatePayload,
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
    console.error('❌ Error al actualizar producto en PostgreSQL:', err);
    return null;
  }
}

/**
 * Delete a product from PostgreSQL
 */
export async function deleteProduct(id: string): Promise<boolean> {
  try {
    await prisma.product.delete({
      where: { id },
    });
    return true;
  } catch (err) {
    console.error('❌ Error al eliminar producto en PostgreSQL:', err);
    return false;
  }
}

/**
 * Create a new product in PostgreSQL
 */
export async function createProduct(data: CreateProductInput): Promise<Product | null> {
  try {
    const fallbackImage =
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80';
    const ingredientsJson = JSON.stringify(data.ingredients || [data.name]);

    const created = await prisma.product.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        price: Number(data.price),
        format: data.format.trim() || 'Ración',
        categoryId: data.categoryId,
        imageUrl: data.imageUrl?.trim() || fallbackImage,
        ingredients: ingredientsJson,
        badge: data.badge ? data.badge.trim() : null,
        isAvailable: data.isAvailable ?? true,
        rating: 5.0,
        totalReviews: 1,
      },
    });

    if (data.allergens && data.allergens.length > 0) {
      const dbAllergens = await prisma.allergen.findMany({
        where: { name: { in: data.allergens } },
      });
      if (dbAllergens.length > 0) {
        await prisma.productAllergen.createMany({
          data: dbAllergens.map((a) => ({
            productId: created.id,
            allergenId: a.id,
          })),
        });
      }
    }

    const fetched = await prisma.product.findUnique({
      where: { id: created.id },
      include: {
        allergens: {
          include: {
            allergen: true,
          },
        },
      },
    });

    if (!fetched) return null;

    let parsedIngredients: string[] = [];
    try {
      parsedIngredients = JSON.parse(fetched.ingredients);
    } catch {
      parsedIngredients = [fetched.ingredients];
    }

    return {
      id: fetched.id,
      name: fetched.name,
      description: fetched.description,
      ingredients: parsedIngredients,
      price: fetched.price,
      format: fetched.format,
      categoryId: fetched.categoryId,
      imageUrl: fetched.imageUrl,
      allergens: fetched.allergens.map((pa) => pa.allergen.name as AllergenType),
      rating: fetched.rating,
      totalReviews: fetched.totalReviews,
      isAvailable: fetched.isAvailable,
      badge: fetched.badge || undefined,
    };
  } catch (err) {
    console.error('❌ Error al crear producto en PostgreSQL:', err);
    return null;
  }
}

