'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ==========================================
// 1. GESTIÓN DE PROVEEDORES
// ==========================================

export interface SupplierData {
  id: string;
  name: string;
  contactName?: string | null;
  phone: string;
  orderDays: string;
  deliveryDays?: string | null;
  defaultOrderText?: string | null;
  notes?: string | null;
  isActive: boolean;
  itemCount: number;
}

export async function getSuppliersAction(): Promise<{ success: boolean; suppliers: SupplierData[] }> {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { supplies: true },
        },
      },
    });

    return {
      success: true,
      suppliers: suppliers.map((s) => ({
        id: s.id,
        name: s.name,
        contactName: s.contactName,
        phone: s.phone,
        orderDays: s.orderDays,
        deliveryDays: s.deliveryDays,
        defaultOrderText: s.defaultOrderText,
        notes: s.notes,
        isActive: s.isActive,
        itemCount: s._count.supplies,
      })),
    };
  } catch (error) {
    console.error('Error al obtener proveedores:', error);
    return { success: false, suppliers: [] };
  }
}

export async function createSupplierAction(formData: {
  name: string;
  contactName?: string;
  phone: string;
  orderDays: string;
  deliveryDays?: string;
  defaultOrderText?: string;
  notes?: string;
}): Promise<{ success: boolean; supplier?: any; error?: string }> {
  try {
    const supplier = await prisma.supplier.create({
      data: {
        name: formData.name.trim(),
        contactName: formData.contactName?.trim() || null,
        phone: formData.phone.trim(),
        orderDays: formData.orderDays.trim(),
        deliveryDays: formData.deliveryDays?.trim() || null,
        defaultOrderText: formData.defaultOrderText?.trim() || null,
        notes: formData.notes?.trim() || null,
      },
    });

    revalidatePath('/staff');
    return { success: true, supplier };
  } catch (error) {
    console.error('Error al crear proveedor:', error);
    return { success: false, error: 'No se pudo crear el proveedor.' };
  }
}

export async function updateSupplierAction(
  id: string,
  formData: {
    name: string;
    contactName?: string;
    phone: string;
    orderDays: string;
    deliveryDays?: string;
    defaultOrderText?: string;
    notes?: string;
  }
): Promise<{ success: boolean; supplier?: any; error?: string }> {
  try {
    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: formData.name.trim(),
        contactName: formData.contactName?.trim() || null,
        phone: formData.phone.trim(),
        orderDays: formData.orderDays.trim(),
        deliveryDays: formData.deliveryDays?.trim() || null,
        defaultOrderText: formData.defaultOrderText?.trim() || null,
        notes: formData.notes?.trim() || null,
      },
    });

    revalidatePath('/staff');
    return { success: true, supplier: updated };
  } catch (error) {
    console.error('Error al actualizar proveedor:', error);
    return { success: false, error: 'No se pudo actualizar el proveedor.' };
  }
}

export async function deleteSupplierAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.supplier.delete({ where: { id } });
    revalidatePath('/staff');
    return { success: true };
  } catch (error) {
    console.error('Error al eliminar proveedor:', error);
    return { success: false, error: 'No se pudo eliminar el proveedor.' };
  }
}

// ==========================================
// 2. GESTIÓN DE INSUMOS & STOCK
// ==========================================

export interface SupplyItemData {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  currentPrice: number;
  primarySupplierId?: string | null;
  primarySupplierName?: string | null;
  primarySupplierPhone?: string | null;
  primarySupplierOrderDays?: string | null;
  primarySupplierDeliveryDays?: string | null;
  notes?: string | null;
  status: 'OPTIMAL' | 'LOW' | 'CRITICAL';
  healthScore: number; // 0 to 100
  healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EMPTY';
  totalWasteCost: number;
  totalWasteQuantity: number;
  wasteCount: number;
  wasteRecords: FoodWasteData[];
  recentMovements: {
    id: string;
    type: string;
    quantity: number;
    reason: string | null;
    loggedBy?: string | null;
    createdAt: string;
  }[];
  prices: {
    id: string;
    supplierId: string;
    supplierName: string;
    unitPrice: number;
    formatDescription?: string | null;
    isBestOffer: boolean;
  }[];
}

export async function getSupplyItemsAction(): Promise<{ success: boolean; items: SupplyItemData[] }> {
  try {
    const [items, allWastes] = await Promise.all([
      prisma.supplyItem.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
        include: {
          primarySupplier: {
            select: { name: true, phone: true, orderDays: true, deliveryDays: true },
          },
          movements: {
            take: 8,
            orderBy: { createdAt: 'desc' },
          },
          prices: {
            include: {
              supplier: {
                select: { name: true },
              },
            },
            orderBy: { unitPrice: 'asc' },
          },
        },
      }),
      prisma.foodWaste.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const formattedItems: SupplyItemData[] = items.map((it) => {
      // Find matching waste records by supplyItemId or itemName match
      const matchingWastes = allWastes.filter(
        (w) => w.supplyItemId === it.id || (!w.supplyItemId && w.itemName.toLowerCase() === it.name.toLowerCase())
      );

      const totalWasteCost = matchingWastes.reduce((acc, w) => acc + (w.estimatedCost || 0), 0);
      const totalWasteQuantity = matchingWastes.reduce((acc, w) => acc + (w.quantity || 0), 0);

      const wasteRecords: FoodWasteData[] = matchingWastes.map((w) => ({
        id: w.id,
        itemName: w.itemName,
        quantity: w.quantity,
        unit: w.unit,
        estimatedCost: w.estimatedCost,
        reason: w.reason,
        reasonLabel: WASTE_REASONS[w.reason] || w.reason,
        loggedBy: w.loggedBy,
        notes: w.notes,
        date: w.createdAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));

      // Gamification Health Score (0 - 100%)
      let healthScore = 100;
      let healthStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EMPTY' = 'HEALTHY';
      let status: 'OPTIMAL' | 'LOW' | 'CRITICAL' = 'OPTIMAL';

      if (it.currentStock <= 0) {
        healthScore = 0;
        healthStatus = 'EMPTY';
        status = 'CRITICAL';
      } else if (it.currentStock < it.minStock) {
        healthScore = Math.max(8, Math.min(48, Math.round((it.currentStock / Math.max(1, it.minStock)) * 50)));
        healthStatus = 'CRITICAL';
        status = 'LOW';
      } else if (it.currentStock < it.minStock * 1.5) {
        const extra = it.currentStock - it.minStock;
        const range = it.minStock * 0.5 || 1;
        healthScore = Math.min(84, 50 + Math.round((extra / range) * 34));
        healthStatus = 'WARNING';
        status = 'OPTIMAL';
      } else {
        const extra = it.currentStock - it.minStock * 1.5;
        const range = it.minStock * 0.5 || 1;
        healthScore = Math.min(100, 85 + Math.round((extra / range) * 15));
        healthStatus = 'HEALTHY';
        status = 'OPTIMAL';
      }

      return {
        id: it.id,
        name: it.name,
        category: it.category,
        currentStock: it.currentStock,
        minStock: it.minStock,
        unit: it.unit,
        currentPrice: it.currentPrice,
        primarySupplierId: it.primarySupplierId,
        primarySupplierName: it.primarySupplier?.name || null,
        primarySupplierPhone: it.primarySupplier?.phone || null,
        primarySupplierOrderDays: it.primarySupplier?.orderDays || null,
        primarySupplierDeliveryDays: it.primarySupplier?.deliveryDays || null,
        notes: it.notes,
        status,
        healthScore,
        healthStatus,
        totalWasteCost: Number(totalWasteCost.toFixed(2)),
        totalWasteQuantity: Number(totalWasteQuantity.toFixed(2)),
        wasteCount: matchingWastes.length,
        wasteRecords,
        recentMovements: it.movements.map((m) => ({
          id: m.id,
          type: m.type,
          quantity: m.quantity,
          reason: m.reason,
          loggedBy: m.loggedBy,
          createdAt: m.createdAt.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          }),
        })),
        prices: it.prices.map((p, idx) => ({
          id: p.id,
          supplierId: p.supplierId,
          supplierName: p.supplier.name,
          unitPrice: p.unitPrice,
          formatDescription: p.formatDescription,
          isBestOffer: idx === 0,
        })),
      };
    });

    return {
      success: true,
      items: formattedItems,
    };
  } catch (error) {
    console.error('Error al obtener insumos de stock enriquecidos:', error);
    return { success: false, items: [] };
  }
}

export async function updateStockQuantityAction(
  id: string,
  newQuantity: number,
  reason?: string
): Promise<{ success: boolean; item?: any; error?: string }> {
  try {
    const existing = await prisma.supplyItem.findUnique({ where: { id } });
    if (!existing) return { success: false, error: 'Insumo no encontrado.' };

    const diff = newQuantity - existing.currentStock;
    const movementType = diff > 0 ? 'IN' : 'ADJUSTMENT';

    const [updated] = await prisma.$transaction([
      prisma.supplyItem.update({
        where: { id },
        data: { currentStock: Math.max(0, newQuantity) },
      }),
      prisma.stockMovement.create({
        data: {
          supplyItemId: id,
          type: movementType,
          quantity: diff,
          reason: reason || 'Ajuste manual de stock',
        },
      }),
    ]);

    revalidatePath('/staff');
    return { success: true, item: updated };
  } catch (error) {
    console.error('Error al ajustar stock:', error);
    return { success: false, error: 'Error al ajustar existencias.' };
  }
}

export async function createSupplyItemAction(data: {
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  unit: string;
  currentPrice: number;
  primarySupplierId?: string;
  notes?: string;
}): Promise<{ success: boolean; item?: any; error?: string }> {
  try {
    const created = await prisma.supplyItem.create({
      data: {
        name: data.name.trim(),
        category: data.category,
        currentStock: Number(data.currentStock) || 0,
        minStock: Number(data.minStock) || 0,
        unit: data.unit.trim(),
        currentPrice: Number(data.currentPrice) || 0,
        primarySupplierId: data.primarySupplierId || null,
        notes: data.notes?.trim() || null,
      },
    });

    revalidatePath('/staff');
    return { success: true, item: created };
  } catch (error) {
    console.error('Error al crear insumo:', error);
    return { success: false, error: 'No se pudo crear el insumo.' };
  }
}

// ==========================================
// 3. COMPARADOR DE PRECIOS ENTRE PROVEEDORES
// ==========================================

export interface SupplierPriceData {
  id: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  formatDescription?: string | null;
  isBestOffer: boolean;
  lastUpdated: string;
}

export async function getPricesForSupplyItemAction(
  supplyItemId: string
): Promise<{ success: boolean; prices: SupplierPriceData[] }> {
  try {
    const prices = await prisma.supplierPrice.findMany({
      where: { supplyItemId },
      include: {
        supplier: {
          select: { name: true },
        },
      },
      orderBy: { unitPrice: 'asc' },
    });

    return {
      success: true,
      prices: prices.map((p, idx) => ({
        id: p.id,
        supplierId: p.supplierId,
        supplierName: p.supplier.name,
        unitPrice: p.unitPrice,
        formatDescription: p.formatDescription,
        isBestOffer: idx === 0, // El más barato
        lastUpdated: p.lastUpdated.toLocaleDateString('es-ES'),
      })),
    };
  } catch (error) {
    console.error('Error al obtener cotizaciones:', error);
    return { success: false, prices: [] };
  }
}

export async function addOrUpdateSupplierPriceAction(data: {
  supplyItemId: string;
  supplierId: string;
  unitPrice: number;
  formatDescription?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.supplierPrice.upsert({
      where: {
        supplyItemId_supplierId: {
          supplyItemId: data.supplyItemId,
          supplierId: data.supplierId,
        },
      },
      update: {
        unitPrice: Number(data.unitPrice),
        formatDescription: data.formatDescription?.trim() || null,
        lastUpdated: new Date(),
      },
      create: {
        supplyItemId: data.supplyItemId,
        supplierId: data.supplierId,
        unitPrice: Number(data.unitPrice),
        formatDescription: data.formatDescription?.trim() || null,
      },
    });

    revalidatePath('/staff');
    return { success: true };
  } catch (error) {
    console.error('Error al guardar cotización:', error);
    return { success: false, error: 'No se pudo guardar la cotización.' };
  }
}

// ==========================================
// 4. REGISTRO & CONTROL DE MERMAS (FOOD WASTE)
// ==========================================

export interface FoodWasteData {
  id: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  reason: string;
  reasonLabel: string;
  loggedBy?: string | null;
  notes?: string | null;
  date: string;
}

const WASTE_REASONS: Record<string, string> = {
  EXPIRED: 'Fecha de caducidad superada',
  SPOILED: 'Deterioro de producto fresco (fruta/verdura)',
  COOKING_ERROR: 'Error de cocina o plato quemado',
  LEFTOVER: 'Sobrante no recuperable de fin de servicio',
  OTHER: 'Otra incidencia / Rotura de envase',
};

export async function getFoodWasteRecordsAction(): Promise<{
  success: boolean;
  records: FoodWasteData[];
  totalCostLost: number;
  topWastedItems: { name: string; cost: number; count: number }[];
}> {
  try {
    const records = await prisma.foodWaste.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    let totalCostLost = 0;
    const itemMap = new Map<string, { cost: number; count: number }>();

    const formatted: FoodWasteData[] = records.map((r) => {
      totalCostLost += r.estimatedCost;

      const current = itemMap.get(r.itemName) || { cost: 0, count: 0 };
      itemMap.set(r.itemName, {
        cost: current.cost + r.estimatedCost,
        count: current.count + 1,
      });

      return {
        id: r.id,
        itemName: r.itemName,
        quantity: r.quantity,
        unit: r.unit,
        estimatedCost: r.estimatedCost,
        reason: r.reason,
        reasonLabel: WASTE_REASONS[r.reason] || r.reason,
        loggedBy: r.loggedBy,
        notes: r.notes,
        date: r.createdAt.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };
    });

    const topWastedItems = Array.from(itemMap.entries())
      .map(([name, stat]) => ({ name, cost: stat.cost, count: stat.count }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);

    return {
      success: true,
      records: formatted,
      totalCostLost: Number(totalCostLost.toFixed(2)),
      topWastedItems,
    };
  } catch (error) {
    console.error('Error al obtener mermas:', error);
    return { success: false, records: [], totalCostLost: 0, topWastedItems: [] };
  }
}

export async function logFoodWasteAction(data: {
  supplyItemId?: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedCost: number;
  reason: string;
  notes?: string;
  loggedBy?: string;
}): Promise<{ success: boolean; record?: any; error?: string }> {
  try {
    const waste = await prisma.foodWaste.create({
      data: {
        supplyItemId: data.supplyItemId || null,
        itemName: data.itemName.trim(),
        quantity: Number(data.quantity),
        unit: data.unit.trim(),
        estimatedCost: Number(data.estimatedCost) || 0,
        reason: data.reason,
        notes: data.notes?.trim() || null,
        loggedBy: data.loggedBy?.trim() || 'Cocina Quimera',
      },
    });

    // If supplyItemId is provided, automatically deduct from current stock
    if (data.supplyItemId) {
      await prisma.supplyItem.update({
        where: { id: data.supplyItemId },
        data: {
          currentStock: {
            decrement: Number(data.quantity),
          },
        },
      });

      await prisma.stockMovement.create({
        data: {
          supplyItemId: data.supplyItemId,
          type: 'WASTE',
          quantity: -Number(data.quantity),
          reason: `Merma registrada: ${WASTE_REASONS[data.reason] || data.reason}`,
          loggedBy: data.loggedBy || 'Cocina',
        },
      });
    }

    revalidatePath('/staff');
    return { success: true, record: waste };
  } catch (error) {
    console.error('Error al registrar merma:', error);
    return { success: false, error: 'No se pudo registrar la merma.' };
  }
}

// ==========================================
// 5. EVENTOS LOCALES & DEMANDA CAMAS / SEVILLA
// ==========================================

export interface LocalEventData {
  id: string;
  title: string;
  description?: string | null;
  location: string;
  startDate: string;
  endDate: string;
  eventType: string;
  demandMultiplier: number;
  recommendedFocus?: string | null;
  isActive: boolean;
}

export async function getLocalEventsAction(): Promise<{ success: boolean; events: LocalEventData[] }> {
  try {
    const events = await prisma.localEvent.findMany({
      orderBy: { startDate: 'asc' },
    });

    return {
      success: true,
      events: events.map((ev) => ({
        id: ev.id,
        title: ev.title,
        description: ev.description,
        location: ev.location,
        startDate: ev.startDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        endDate: ev.endDate.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }),
        eventType: ev.eventType,
        demandMultiplier: ev.demandMultiplier,
        recommendedFocus: ev.recommendedFocus,
        isActive: ev.isActive,
      })),
    };
  } catch (error) {
    console.error('Error al obtener eventos locales:', error);
    return { success: false, events: [] };
  }
}

// ==========================================
// 6. ASISTENTE INTELIGENTE DE PEDIDOS WHATSAPP
// ==========================================

export interface SuggestedOrderItem {
  itemId: string;
  name: string;
  currentStock: number;
  minStock: number;
  unit: string;
  orderQuantity: number;
}

export interface SupplierOrderProposal {
  supplierId: string;
  supplierName: string;
  phone: string;
  orderDays: string;
  isTodayOrderDay: boolean;
  items: SuggestedOrderItem[];
  whatsappUrl: string;
}

export async function getSupplierOrderProposalsAction(): Promise<{
  success: boolean;
  proposals: SupplierOrderProposal[];
}> {
  try {
    const suppliers = await prisma.supplier.findMany({
      where: { isActive: true },
      include: {
        supplies: true,
      },
    });

    // Detect today's day in Spanish
    const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const todayName = daysOfWeek[new Date().getDay()];

    const proposals: SupplierOrderProposal[] = [];

    for (const sup of suppliers) {
      const isTodayOrderDay = sup.orderDays.toLowerCase().includes(todayName.toLowerCase());

      const neededItems: SuggestedOrderItem[] = [];

      for (const item of sup.supplies) {
        // Recommend order if stock is at or below minimum
        if (item.currentStock <= item.minStock) {
          const shortage = Math.max(1, Math.ceil(item.minStock * 2 - item.currentStock));
          neededItems.push({
            itemId: item.id,
            name: item.name,
            currentStock: item.currentStock,
            minStock: item.minStock,
            unit: item.unit,
            orderQuantity: shortage,
          });
        }
      }

      // Generate WhatsApp text
      let text = `¡Hola ${sup.contactName || sup.name}! Te escribo de *Taberna Quimera (Camas, Sevilla)* para pasarte el pedido de hoy:\n\n`;

      if (neededItems.length > 0) {
        neededItems.forEach((it) => {
          text += `▪️ *${it.orderQuantity} ${it.unit}* de ${it.name}\n`;
        });
      } else if (sup.defaultOrderText) {
        text += `Según nuestro pedido habitual:\n${sup.defaultOrderText}\n`;
      } else {
        text += `Por favor indícanos disponibilidad para confirmar pedido de reposición.\n`;
      }

      text += `\n📍 Entrega: Taberna Quimera, Camas (Sevilla).\n¡Muchas gracias!`;

      // Format phone for wa.me
      const cleanPhone = sup.phone.replace(/[^0-9]/g, '');
      const fullPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`;
      const whatsappUrl = `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`;

      proposals.push({
        supplierId: sup.id,
        supplierName: sup.name,
        phone: sup.phone,
        orderDays: sup.orderDays,
        isTodayOrderDay,
        items: neededItems,
        whatsappUrl,
      });
    }

    return { success: true, proposals };
  } catch (error) {
    console.error('Error al generar propuestas de pedido:', error);
    return { success: false, proposals: [] };
  }
}
