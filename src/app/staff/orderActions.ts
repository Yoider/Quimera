'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

export interface RestaurantTableData {
  id: string;
  tableNumber: string;
  name: string;
  zone: string; // 'SALON' | 'BARRA' | 'TERRAZA' or custom zone code
  seats: number;
  posX: number; // percentage 0-100
  posY: number; // percentage 0-100
  shape: 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR_STOOL';
  color?: string | null;
  isActive: boolean;
}

export interface RestaurantZoneData {
  id: string;
  code: string;
  name: string;
  subtitle?: string | null;
  color: string;
  posX: number; // 0-100%
  posY: number; // 0-100%
  width: number; // 0-100%
  height: number; // 0-100%
  isActive: boolean;
}

export interface OrderItemData {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  notes?: string | null;
}

export interface ActiveOrderData {
  id: string;
  orderNumber: string;
  tableNumber: string;
  tableId?: string | null;
  pax: number;
  status: 'PENDING' | 'PREPARING' | 'SERVED' | 'PAID' | 'CANCELLED';
  notes?: string | null;
  totalAmount: number;
  createdAt: string;
  items: OrderItemData[];
}

const DEFAULT_SEEDED_TABLES: Omit<RestaurantTableData, 'id' | 'isActive'>[] = [
  // BARRA
  { tableNumber: 'Barra 1', name: 'Barra 1', zone: 'BARRA', seats: 1, posX: 16, posY: 22, shape: 'BAR_STOOL', color: '#D4A373' },
  { tableNumber: 'Barra 2', name: 'Barra 2', zone: 'BARRA', seats: 1, posX: 25, posY: 22, shape: 'BAR_STOOL', color: '#D4A373' },
  { tableNumber: 'Barra 3', name: 'Barra 3', zone: 'BARRA', seats: 1, posX: 34, posY: 22, shape: 'BAR_STOOL', color: '#D4A373' },
  { tableNumber: 'Barra 4', name: 'Barra 4', zone: 'BARRA', seats: 1, posX: 43, posY: 22, shape: 'BAR_STOOL', color: '#D4A373' },
  // SALÓN COMEDOR
  { tableNumber: 'Mesa 1', name: 'Mesa 1', zone: 'SALON', seats: 2, posX: 16, posY: 54, shape: 'SQUARE', color: '#9E2A2B' },
  { tableNumber: 'Mesa 2', name: 'Mesa 2', zone: 'SALON', seats: 4, posX: 30, posY: 54, shape: 'ROUND', color: '#9E2A2B' },
  { tableNumber: 'Mesa 3', name: 'Mesa 3', zone: 'SALON', seats: 6, posX: 46, posY: 54, shape: 'RECTANGLE', color: '#9E2A2B' },
  { tableNumber: 'Mesa 4', name: 'Mesa 4', zone: 'SALON', seats: 2, posX: 16, posY: 78, shape: 'SQUARE', color: '#9E2A2B' },
  { tableNumber: 'Mesa 5', name: 'Mesa 5', zone: 'SALON', seats: 4, posX: 32, posY: 80, shape: 'ROUND', color: '#9E2A2B' },
  // TERRAZA / VELADORES
  { tableNumber: 'Terraza 1', name: 'Terraza 1', zone: 'TERRAZA', seats: 4, posX: 68, posY: 30, shape: 'ROUND', color: '#2A9D8F' },
  { tableNumber: 'Terraza 2', name: 'Terraza 2', zone: 'TERRAZA', seats: 4, posX: 84, posY: 30, shape: 'ROUND', color: '#2A9D8F' },
  { tableNumber: 'Terraza 3', name: 'Terraza 3', zone: 'TERRAZA', seats: 4, posX: 68, posY: 58, shape: 'ROUND', color: '#2A9D8F' },
  { tableNumber: 'Terraza 4', name: 'Terraza 4', zone: 'TERRAZA', seats: 4, posX: 84, posY: 58, shape: 'ROUND', color: '#2A9D8F' },
  { tableNumber: 'Terraza 5', name: 'Terraza 5', zone: 'TERRAZA', seats: 6, posX: 76, posY: 82, shape: 'RECTANGLE', color: '#2A9D8F' },
];

/**
 * Fetch all restaurant tables, auto-seeding if empty
 */
export async function getRestaurantTablesAction(): Promise<RestaurantTableData[]> {
  try {
    let tables = await prisma.restaurantTable.findMany({
      where: { isActive: true },
      orderBy: [{ zone: 'asc' }, { tableNumber: 'asc' }],
    });

    if (tables.length === 0) {
      // Seed default tables
      for (const t of DEFAULT_SEEDED_TABLES) {
        await prisma.restaurantTable.create({
          data: {
            tableNumber: t.tableNumber,
            name: t.name,
            zone: t.zone,
            seats: t.seats,
            posX: t.posX,
            posY: t.posY,
            shape: t.shape,
            color: t.color,
            isActive: true,
          },
        });
      }
      tables = await prisma.restaurantTable.findMany({
        where: { isActive: true },
        orderBy: [{ zone: 'asc' }, { tableNumber: 'asc' }],
      });
    }

    return tables.map((t) => ({
      id: t.id,
      tableNumber: t.tableNumber,
      name: t.name,
      zone: t.zone,
      seats: t.seats,
      posX: t.posX,
      posY: t.posY,
      shape: t.shape as 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR_STOOL',
      color: t.color,
      isActive: t.isActive,
    }));
  } catch (err) {
    console.error('Error fetching restaurant tables:', err);
    return [];
  }
}

/**
 * Save or update a restaurant table
 */
export async function saveRestaurantTableAction(data: {
  id?: string;
  tableNumber: string;
  name: string;
  zone: string;
  seats: number;
  posX: number;
  posY: number;
  shape: 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR_STOOL';
  color?: string;
}): Promise<{ success: boolean; table?: RestaurantTableData; error?: string }> {
  try {
    let table;
    if (data.id) {
      table = await prisma.restaurantTable.update({
        where: { id: data.id },
        data: {
          tableNumber: data.tableNumber,
          name: data.name,
          zone: data.zone,
          seats: data.seats,
          posX: data.posX,
          posY: data.posY,
          shape: data.shape,
          color: data.color || null,
        },
      });
    } else {
      table = await prisma.restaurantTable.create({
        data: {
          tableNumber: data.tableNumber,
          name: data.name,
          zone: data.zone,
          seats: data.seats,
          posX: data.posX,
          posY: data.posY,
          shape: data.shape,
          color: data.color || null,
          isActive: true,
        },
      });
    }

    revalidatePath('/staff');

    return {
      success: true,
      table: {
        id: table.id,
        tableNumber: table.tableNumber,
        name: table.name,
        zone: table.zone,
        seats: table.seats,
        posX: table.posX,
        posY: table.posY,
        shape: table.shape as 'ROUND' | 'SQUARE' | 'RECTANGLE' | 'BAR_STOOL',
        color: table.color,
        isActive: table.isActive,
      },
    };
  } catch (err) {
    console.error('Error saving restaurant table:', err);
    return { success: false, error: 'Error al guardar la mesa.' };
  }
}

/**
 * Delete a restaurant table
 */
export async function deleteRestaurantTableAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.restaurantTable.update({
      where: { id },
      data: { isActive: false },
    });
    revalidatePath('/staff');
    return { success: true };
  } catch (err) {
    console.error('Error deleting restaurant table:', err);
    return { success: false, error: 'Error al eliminar la mesa.' };
  }
}

const DEFAULT_SEEDED_ZONES: Omit<RestaurantZoneData, 'id' | 'isActive'>[] = [
  {
    code: 'BARRA',
    name: 'Zona 1: Barra de Tapeo & Bebidas',
    subtitle: 'Mostrador & Taburetes',
    color: '#D4A373',
    posX: 2.5,
    posY: 2.5,
    width: 47.5,
    height: 38,
  },
  {
    code: 'SALON',
    name: 'Zona 2: Salón Comedor Interior',
    subtitle: 'Mesas Bajas & Comedor',
    color: '#9E2A2B',
    posX: 2.5,
    posY: 43.5,
    width: 47.5,
    height: 54,
  },
  {
    code: 'TERRAZA',
    name: 'Zona 3: Terraza & Veladores (Exterior)',
    subtitle: 'Exterior Climatizado Camas',
    color: '#2A9D8F',
    posX: 52,
    posY: 2.5,
    width: 45.5,
    height: 95,
  },
];

/**
 * Fetch all restaurant zones, auto-seeding if empty
 */
export async function getRestaurantZonesAction(): Promise<RestaurantZoneData[]> {
  try {
    let zones = await prisma.restaurantZone.findMany({
      where: { isActive: true },
      orderBy: { posX: 'asc' },
    });

    if (zones.length === 0) {
      for (const z of DEFAULT_SEEDED_ZONES) {
        await prisma.restaurantZone.create({
          data: {
            ...z,
            isActive: true,
          },
        });
      }
      zones = await prisma.restaurantZone.findMany({
        where: { isActive: true },
        orderBy: { posX: 'asc' },
      });
    }

    return zones.map((z) => ({
      id: z.id,
      code: z.code,
      name: z.name,
      subtitle: z.subtitle,
      color: z.color,
      posX: z.posX,
      posY: z.posY,
      width: z.width,
      height: z.height,
      isActive: z.isActive,
    }));
  } catch (err) {
    console.error('Error fetching restaurant zones:', err);
    return DEFAULT_SEEDED_ZONES.map((z, idx) => ({
      id: `default-${idx}`,
      ...z,
      isActive: true,
    }));
  }
}

/**
 * Save or update a restaurant zone
 */
export async function saveRestaurantZoneAction(data: {
  id?: string;
  code: string;
  name: string;
  subtitle?: string | null;
  color?: string;
  posX: number;
  posY: number;
  width: number;
  height: number;
}): Promise<{ success: boolean; zone?: RestaurantZoneData; error?: string }> {
  try {
    const color = data.color || '#D4A373';
    let zone;
    if (data.id && !data.id.startsWith('default-')) {
      zone = await prisma.restaurantZone.update({
        where: { id: data.id },
        data: {
          code: data.code,
          name: data.name,
          subtitle: data.subtitle,
          color,
          posX: data.posX,
          posY: data.posY,
          width: data.width,
          height: data.height,
        },
      });
    } else {
      zone = await prisma.restaurantZone.upsert({
        where: { code: data.code },
        update: {
          name: data.name,
          subtitle: data.subtitle,
          color,
          posX: data.posX,
          posY: data.posY,
          width: data.width,
          height: data.height,
          isActive: true,
        },
        create: {
          code: data.code,
          name: data.name,
          subtitle: data.subtitle,
          color,
          posX: data.posX,
          posY: data.posY,
          width: data.width,
          height: data.height,
          isActive: true,
        },
      });
    }

    revalidatePath('/staff');
    return {
      success: true,
      zone: {
        id: zone.id,
        code: zone.code,
        name: zone.name,
        subtitle: zone.subtitle,
        color: zone.color,
        posX: zone.posX,
        posY: zone.posY,
        width: zone.width,
        height: zone.height,
        isActive: zone.isActive,
      },
    };
  } catch (err: any) {
    console.error('Error saving restaurant zone:', err);
    return { success: false, error: err.message || 'Error al guardar la zona.' };
  }
}

/**
 * Delete a restaurant zone
 */
export async function deleteRestaurantZoneAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id.startsWith('default-')) {
      await prisma.restaurantZone.update({
        where: { id },
        data: { isActive: false },
      });
      revalidatePath('/staff');
    }
    return { success: true };
  } catch (err: any) {
    console.error('Error deleting restaurant zone:', err);
    return { success: false, error: err.message || 'Error al eliminar la zona.' };
  }
}

/**
 * Fetch all active orders (PENDING, PREPARING, SERVED)
 */
export async function getActiveOrdersAction(): Promise<ActiveOrderData[]> {
  try {
    const orders = await prisma.order.findMany({
      where: {
        status: {
          in: ['PENDING', 'PREPARING', 'SERVED'],
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      tableNumber: o.tableNumber,
      tableId: o.tableId,
      pax: o.pax,
      status: o.status as 'PENDING' | 'PREPARING' | 'SERVED' | 'PAID' | 'CANCELLED',
      notes: o.notes,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      items: o.items.map((it) => ({
        id: it.id,
        productId: it.productId,
        productName: it.product.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        notes: it.notes,
      })),
    }));
  } catch (err) {
    console.error('Error fetching active orders:', err);
    return [];
  }
}

/**
 * Create or append to a table's active order from the waiter PDA
 */
export async function createOrUpdateTableOrderAction(data: {
  tableNumber: string;
  tableId?: string;
  pax: number;
  items: { productId: string; quantity: number; notes?: string }[];
  generalNotes?: string;
}): Promise<{ success: boolean; orderId?: string; error?: string }> {
  try {
    // Check if table already has an active order
    const existingOrder = await prisma.order.findFirst({
      where: {
        tableNumber: data.tableNumber,
        status: { in: ['PENDING', 'PREPARING', 'SERVED'] },
      },
      include: { items: true },
    });

    // Fetch product prices
    const productIds = data.items.map((it) => it.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const priceMap = new Map(products.map((p) => [p.id, p.price]));

    let targetOrderId: string;

    if (existingOrder) {
      targetOrderId = existingOrder.id;

      // Append new items
      for (const it of data.items) {
        const price = priceMap.get(it.productId) || 0;
        await prisma.orderItem.create({
          data: {
            orderId: targetOrderId,
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: price,
            notes: it.notes || null,
          },
        });
      }

      // Recalculate total
      const allItems = await prisma.orderItem.findMany({
        where: { orderId: targetOrderId },
      });
      const newTotal = allItems.reduce((acc, i) => acc + i.unitPrice * i.quantity, 0);

      await prisma.order.update({
        where: { id: targetOrderId },
        data: {
          totalAmount: newTotal,
          pax: data.pax,
          status: 'PREPARING', // Set to preparing if new items added
          notes: data.generalNotes || existingOrder.notes,
        },
      });
    } else {
      // Create new order
      const orderNumber = `Q-${Math.floor(100 + Math.random() * 900)}`;
      const totalAmount = data.items.reduce((acc, it) => {
        const price = priceMap.get(it.productId) || 0;
        return acc + price * it.quantity;
      }, 0);

      const newOrder = await prisma.order.create({
        data: {
          orderNumber,
          tableNumber: data.tableNumber,
          tableId: data.tableId || null,
          pax: data.pax,
          status: 'PENDING',
          notes: data.generalNotes || null,
          totalAmount,
          items: {
            create: data.items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: priceMap.get(it.productId) || 0,
              notes: it.notes || null,
            })),
          },
        },
      });
      targetOrderId = newOrder.id;
    }

    revalidatePath('/staff');
    return { success: true, orderId: targetOrderId };
  } catch (err) {
    console.error('Error creating or updating table order:', err);
    return { success: false, error: 'Error al procesar la comanda de la mesa.' };
  }
}

/**
 * Advance order status in Kanban (PENDING -> PREPARING -> SERVED -> PAID)
 */
export async function advanceOrderStatusAction(
  orderId: string,
  newStatus: 'PENDING' | 'PREPARING' | 'SERVED' | 'PAID'
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
    });
    revalidatePath('/staff');
    return { success: true };
  } catch (err) {
    console.error('Error advancing order status:', err);
    return { success: false, error: 'Error al cambiar estado de la comanda.' };
  }
}

/**
 * Close and pay order, freeing the table
 */
export async function closeAndPayTableOrderAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' },
    });
    revalidatePath('/staff');
    return { success: true };
  } catch (err) {
    console.error('Error closing and paying table order:', err);
    return { success: false, error: 'Error al cobrar y cerrar la mesa.' };
  }
}
