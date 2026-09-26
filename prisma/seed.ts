import { PrismaClient } from '@prisma/client';
import { CATEGORIES, PRODUCTS } from '../src/data/mockMenu';

const prisma = new PrismaClient();

const OFFICIAL_ALLERGENS = [
  { code: 'GLUTEN', name: 'Gluten', icon: 'Wheat', badgeColor: 'amber' },
  { code: 'CRUSTACEOS', name: 'Crustáceos', icon: 'Fish', badgeColor: 'rose' },
  { code: 'HUEVOS', name: 'Huevos', icon: 'Egg', badgeColor: 'yellow' },
  { code: 'PESCADO', name: 'Pescado', icon: 'Fish', badgeColor: 'sky' },
  { code: 'CACAHUETES', name: 'Cacahuetes', icon: 'Nut', badgeColor: 'orange' },
  { code: 'SOJA', name: 'Soja', icon: 'Sparkles', badgeColor: 'emerald' },
  { code: 'LACTEOS', name: 'Lácteos', icon: 'Milk', badgeColor: 'blue' },
  { code: 'FRUTOS_CASCARA', name: 'Frutos de cáscara', icon: 'Nut', badgeColor: 'amber' },
  { code: 'APIO', name: 'Apio', icon: 'Sparkles', badgeColor: 'green' },
  { code: 'MOSTAZA', name: 'Mostaza', icon: 'Sparkles', badgeColor: 'lime' },
  { code: 'SESAMO', name: 'Sésamo', icon: 'Sparkles', badgeColor: 'stone' },
  { code: 'SULFITOS', name: 'Sulfitos', icon: 'Wine', badgeColor: 'purple' },
  { code: 'ALTRAMUCES', name: 'Altramuces', icon: 'Sparkles', badgeColor: 'yellow' },
  { code: 'MOLUSCOS', name: 'Moluscos', icon: 'Fish', badgeColor: 'cyan' },
];

const ALLERGEN_NAME_TO_CODE: Record<string, string> = {
  Gluten: 'GLUTEN',
  Crustáceos: 'CRUSTACEOS',
  Huevos: 'HUEVOS',
  Pescado: 'PESCADO',
  Cacahuetes: 'CACAHUETES',
  Soja: 'SOJA',
  Lácteos: 'LACTEOS',
  'Frutos de cáscara': 'FRUTOS_CASCARA',
  Apio: 'APIO',
  Mostaza: 'MOSTAZA',
  Sésamo: 'SESAMO',
  Sulfitos: 'SULFITOS',
  Altramuces: 'ALTRAMUCES',
  Moluscos: 'MOLUSCOS',
};

async function main() {
  console.log('🌱 Iniciando volcado y seeding en PostgreSQL (Prisma Postgres)...');

  // 1. Poblar catálogo oficial de alérgenos
  console.log('📦 Creando catálogo de 14 alérgenos oficiales UE...');
  const allergenMap = new Map<string, string>(); // code -> id

  for (const item of OFFICIAL_ALLERGENS) {
    const allergen = await prisma.allergen.upsert({
      where: { code: item.code },
      update: { name: item.name, icon: item.icon, badgeColor: item.badgeColor },
      create: {
        code: item.code,
        name: item.name,
        icon: item.icon,
        badgeColor: item.badgeColor,
      },
    });
    allergenMap.set(item.code, allergen.id);
  }
  console.log(`✓ ${allergenMap.size} alérgenos listos.`);

  // 2. Poblar Categorías
  console.log('📂 Creando las 10 categorías operacionales...');
  for (const cat of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        icon: cat.icon,
        description: cat.description || null,
        orderIndex: cat.orderIndex,
      },
      create: {
        id: cat.id,
        slug: cat.slug,
        name: cat.name,
        icon: cat.icon,
        description: cat.description || null,
        orderIndex: cat.orderIndex,
      },
    });
  }
  console.log(`✓ 10 categorías creadas.`);

  // 3. Poblar Productos y Asociar Alérgenos
  console.log(`🍽️ Creando ${PRODUCTS.length} platos y bebidas con sus alérgenos...`);
  for (const p of PRODUCTS) {
    const product = await prisma.product.upsert({
      where: { id: p.id },
      update: {
        name: p.name,
        description: p.description,
        ingredients: JSON.stringify(p.ingredients),
        price: p.price,
        format: p.format,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
        rating: p.rating,
        totalReviews: p.totalReviews,
        isAvailable: p.isAvailable,
        badge: p.badge || null,
      },
      create: {
        id: p.id,
        name: p.name,
        description: p.description,
        ingredients: JSON.stringify(p.ingredients),
        price: p.price,
        format: p.format,
        categoryId: p.categoryId,
        imageUrl: p.imageUrl,
        rating: p.rating,
        totalReviews: p.totalReviews,
        isAvailable: p.isAvailable,
        badge: p.badge || null,
      },
    });

    // Limpiar alérgenos antiguos del producto y recrear relaciones N:M
    await prisma.productAllergen.deleteMany({
      where: { productId: product.id },
    });

    for (const allergenName of p.allergens) {
      const code = ALLERGEN_NAME_TO_CODE[allergenName];
      if (code) {
        const allergenId = allergenMap.get(code);
        if (allergenId) {
          await prisma.productAllergen.create({
            data: {
              productId: product.id,
              allergenId: allergenId,
            },
          });
        }
      }
    }
  }
  console.log(`✓ ${PRODUCTS.length} platos y alérgenos insertados correctamente.`);

  // 4. Poblar Personal inicial (Staff con PIN)
  console.log('👥 Creando usuarios iniciales del personal...');
  const staffMembers = [
    { name: 'Gerente General', pinHash: '1234', role: 'GERENTE' },
    { name: 'Barra y Sala', pinHash: '0000', role: 'CAMARERO' },
    { name: 'Jefe de Cocina', pinHash: '1111', role: 'COCINA' },
  ];

  for (const staff of staffMembers) {
    await prisma.staffUser.create({
      data: {
        name: staff.name,
        pinHash: staff.pinHash,
        role: staff.role,
        isActive: true,
      },
    });
  }
  console.log('✓ 3 usuarios de Staff creados (PINs: 1234, 0000, 1111).');

  console.log('🎉 ¡Base de datos en Prisma Cloud poblada y lista!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
