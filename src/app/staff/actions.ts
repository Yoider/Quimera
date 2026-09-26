'use server';

import {
  toggleProductAvailability,
  resetCatalog,
  getProducts,
  updateProduct,
  deleteProduct,
  createProduct,
  UpdateProductInput,
  CreateProductInput,
} from '@/lib/menuService';
import { revalidatePath } from 'next/cache';

export async function updateProductAvailabilityAction(id: string, isAvailable: boolean) {
  const updated = await toggleProductAvailability(id, isAvailable);
  revalidatePath('/');
  revalidatePath('/staff');
  return { success: !!updated, product: updated };
}

export async function updateProductAction(id: string, data: UpdateProductInput) {
  const updated = await updateProduct(id, data);
  revalidatePath('/');
  revalidatePath('/staff');
  return { success: !!updated, product: updated };
}

export async function deleteProductAction(id: string) {
  const success = await deleteProduct(id);
  revalidatePath('/');
  revalidatePath('/staff');
  return { success };
}

export async function createProductAction(data: CreateProductInput) {
  const created = await createProduct(data);
  revalidatePath('/');
  revalidatePath('/staff');
  return { success: !!created, product: created };
}

export async function resetCatalogAction() {
  await resetCatalog();
  revalidatePath('/');
  revalidatePath('/staff');
  return { success: true };
}

export async function fetchCurrentProductsAction() {
  return await getProducts();
}

