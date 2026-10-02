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

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface DynamicFieldDefinition {
  name: string;
  type: string;
  isId?: boolean;
  isUnique?: boolean;
  isForeignKey?: boolean;
  foreignTable?: string;
  isNullable?: boolean;
  defaultValue?: string;
  description?: string;
}

export interface DynamicModelDefinition {
  name: string;
  sqlTable: string;
  module: 'catalog' | 'staff' | 'orders' | 'general';
  moduleLabel: string;
  description: string;
  accentColor: string;
  fields: DynamicFieldDefinition[];
  indexes: string[];
  count: number;
}

export interface DynamicRelationDefinition {
  id: string;
  sourceTable: string;
  sourceField: string;
  targetTable: string;
  targetField: string;
  type: '1:N' | 'N:M' | 'N:1' | '1:1';
  onDelete: string;
  description: string;
  module: 'catalog' | 'staff' | 'orders' | 'general';
}

export interface DynamicSchemaResponse {
  success: boolean;
  models: DynamicModelDefinition[];
  relations: DynamicRelationDefinition[];
  totalRecords: number;
  totalModels: number;
  totalRelations: number;
}

function getModuleForModel(name: string): {
  module: 'catalog' | 'staff' | 'orders' | 'general';
  label: string;
  color: string;
} {
  const lower = name.toLowerCase();
  if (
    lower.includes('category') ||
    lower.includes('product') ||
    lower.includes('allergen') ||
    lower.includes('menu') ||
    lower.includes('dish') ||
    lower.includes('carta')
  ) {
    return { module: 'catalog', label: 'Catálogo & Carta', color: '#9E2A2B' };
  }
  if (
    lower.includes('user') ||
    lower.includes('staff') ||
    lower.includes('schedule') ||
    lower.includes('shift') ||
    lower.includes('worker') ||
    lower.includes('employee') ||
    lower.includes('horario')
  ) {
    return { module: 'staff', label: 'Personal & Horarios', color: '#2563EB' };
  }
  if (
    lower.includes('order') ||
    lower.includes('ticket') ||
    lower.includes('item') ||
    lower.includes('invoice') ||
    lower.includes('table') ||
    lower.includes('mesa') ||
    lower.includes('comanda') ||
    lower.includes('bill')
  ) {
    return { module: 'orders', label: 'Comandas & Pedidos', color: '#059669' };
  }
  return { module: 'general', label: 'General & Sistema', color: '#7C3AED' };
}

function getModelDescription(name: string): string {
  const descriptions: Record<string, string> = {
    Category: 'Familias de la carta (Pasarratos, Guisos, Croquetas, Vinos, etc.) con orden visual.',
    Product: 'Platos, tapas, raciones y bebidas de Taberna Quimera con precios y alérgenos.',
    Allergen: 'Catálogo de los 14 alérgenos alimentarios oficiales según el Reglamento UE 1169/2011.',
    ProductAllergen: 'Tabla puente N:M para relacionar cada plato con sus alérgenos presentes.',
    User: 'Cuentas de usuarios y personal (ADMIN, GERENTE, CAMARERO, COCINA, CLIENTE).',
    StaffUser: 'Usuarios rápidos de barra y TPV mediante código PIN para turnos de servicio.',
    WeeklySchedule: 'Cuadrante semanal de la taberna con configuración de demanda y afluencia por día.',
    ShiftAssignment: 'Asignación de turno diario por trabajador generada por IA o ajustada manualmente.',
    Order: 'Comanda de mesa o barra con estado de preparación y total acumulado.',
    OrderItem: 'Línea de detalle de comanda indicando plato, cantidad, precio unitario y notas.',
  };
  return descriptions[name] || `Entidad de datos "${name}" gestionada automáticamente en PostgreSQL.`;
}

/**
 * Introspects Prisma DMMF in real-time, reading models, fields, types, relations,
 * indexes, and live table counts dynamically.
 */
export async function getDynamicDatabaseSchemaAction(): Promise<DynamicSchemaResponse> {
  try {
    const rawModels = Prisma.dmmf.datamodel.models;
    const dynamicModels: DynamicModelDefinition[] = [];
    const dynamicRelations: DynamicRelationDefinition[] = [];
    let totalRecords = 0;

    for (const m of rawModels) {
      const moduleMeta = getModuleForModel(m.name);

      // Collect relation fields to mark foreign keys
      const objectFields = m.fields.filter((f) => f.kind === 'object');
      const fkMap = new Map<string, { foreignTable: string; onDelete?: string; toField?: string }>();

      for (const objField of objectFields) {
        if (objField.relationFromFields && objField.relationFromFields.length > 0) {
          const fromField = objField.relationFromFields[0];
          const toField =
            objField.relationToFields && objField.relationToFields.length > 0
              ? objField.relationToFields[0]
              : 'id';
          fkMap.set(fromField, {
            foreignTable: objField.type,
            onDelete: (objField as any).relationOnDelete || 'Cascade',
            toField,
          });

          dynamicRelations.push({
            id: `rel-${m.name}-${fromField}-${objField.type}`,
            sourceTable: m.name,
            sourceField: fromField,
            targetTable: objField.type,
            targetField: toField,
            type: objField.isList ? 'N:M' : '1:N',
            onDelete: (objField as any).relationOnDelete || 'Cascade',
            description: `Relación entre ${m.name} (${fromField}) y ${objField.type} (${toField}).`,
            module: moduleMeta.module,
          });
        }
      }

      // Map scalar fields
      const scalarFields = m.fields.filter((f) => f.kind === 'scalar' || f.kind === 'enum');
      const fields: DynamicFieldDefinition[] = scalarFields.map((f) => {
        const isFk = fkMap.has(f.name);
        const fkInfo = fkMap.get(f.name);

        let defaultStr: string | undefined = undefined;
        if (f.default !== undefined && f.default !== null) {
          if (typeof f.default === 'object' && 'name' in f.default) {
            defaultStr = `${(f.default as any).name}()`;
          } else {
            defaultStr = String(f.default);
          }
        }

        return {
          name: f.name,
          type: f.type,
          isId: f.isId,
          isUnique: f.isUnique,
          isForeignKey: isFk,
          foreignTable: fkInfo?.foreignTable,
          isNullable: !f.isRequired,
          defaultValue: defaultStr,
          description: f.isId ? 'Identificador único' : isFk ? `FK -> ${fkInfo?.foreignTable}` : undefined,
        };
      });

      // Count records dynamically from PostgreSQL
      const delegateName = m.name.charAt(0).toLowerCase() + m.name.slice(1);
      let count = 0;
      try {
        if ((prisma as any)[delegateName]?.count) {
          count = await (prisma as any)[delegateName].count();
        }
      } catch (err) {
        console.warn(`Could not count records for model ${m.name}:`, err);
      }
      totalRecords += count;

      // Extract indexes
      const indexes: string[] = [];
      if (m.uniqueIndexes && m.uniqueIndexes.length > 0) {
        m.uniqueIndexes.forEach((idx) => {
          indexes.push(`@@unique([${idx.fields.join(', ')}])`);
        });
      }

      dynamicModels.push({
        name: m.name,
        sqlTable: m.dbName || m.name,
        module: moduleMeta.module,
        moduleLabel: moduleMeta.label,
        description: getModelDescription(m.name),
        accentColor: moduleMeta.color,
        fields,
        indexes,
        count,
      });
    }

    return {
      success: true,
      models: dynamicModels,
      relations: dynamicRelations,
      totalRecords,
      totalModels: dynamicModels.length,
      totalRelations: dynamicRelations.length,
    };
  } catch (error) {
    console.error('Error generating dynamic database schema:', error);
    return {
      success: false,
      models: [],
      relations: [],
      totalRecords: 0,
      totalModels: 0,
      totalRelations: 0,
    };
  }
}

export interface DatabaseModelStats {
  User: number;
  StaffUser: number;
  Category: number;
  Product: number;
  Allergen: number;
  ProductAllergen: number;
  Order: number;
  OrderItem: number;
  WeeklySchedule: number;
  ShiftAssignment: number;
}

export async function getDatabaseModelStatsAction(): Promise<{
  success: boolean;
  stats: DatabaseModelStats;
  totalRecords: number;
}> {
  const schemaRes = await getDynamicDatabaseSchemaAction();
  if (schemaRes.success) {
    const stats: any = {};
    schemaRes.models.forEach((m) => {
      stats[m.name] = m.count;
    });
    return {
      success: true,
      stats,
      totalRecords: schemaRes.totalRecords,
    };
  }
  return {
    success: false,
    stats: {
      User: 0,
      StaffUser: 0,
      Category: 0,
      Product: 0,
      Allergen: 0,
      ProductAllergen: 0,
      Order: 0,
      OrderItem: 0,
      WeeklySchedule: 0,
      ShiftAssignment: 0,
    },
    totalRecords: 0,
  };
}


