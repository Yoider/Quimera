'use server';

import { toggleProductAvailability, resetCatalog, getProducts } from '@/lib/menuService';
import { revalidatePath } from 'next/cache';

export async function updateProductAvailabilityAction(id: string, isAvailable: boolean) {
  const updated = await toggleProductAvailability(id, isAvailable);
  revalidatePath('/');
  revalidatePath('/staff');
  return { success: !!updated, product: updated };
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
