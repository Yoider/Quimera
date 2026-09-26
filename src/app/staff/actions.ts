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

import fs from 'fs';
import path from 'path';

/**
 * Uploads a base64 encoded photo to public/uploads/products/
 */
export async function uploadProductImageAction(base64Data: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let extension = 'jpg';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('png')) extension = 'png';
      else if (mime.includes('webp')) extension = 'webp';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'products');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `foto-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/products/${filename}`;
    return { success: true, url: publicUrl };
  } catch (err) {
    console.error('Error saving uploaded product image:', err);
    // If saving to file fails, return base64 data URL as fallback
    if (base64Data.startsWith('data:image')) {
      return { success: true, url: base64Data };
    }
    return { success: false, error: 'No se pudo guardar la imagen.' };
  }
}


