import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando Proveedores, Insumos de Stock y Eventos de Camas/Sevilla...');

  // 1. Proveedores del Excel
  const suppliersData = [
    {
      name: 'Proveedor Camas Huevos',
      contactName: 'Reparto Camas',
      phone: '+34 667030994',
      orderDays: 'Lunes y Miércoles',
      deliveryDays: 'Martes y Jueves (Mañana)',
      defaultOrderText: '6 aceite garrafa 5L, 6 cartones huevos camperos (30 uds)',
      notes: 'Proveedor local directo en Camas (Km 0). Reparto matinal.',
    },
    {
      name: 'Frutas Mora',
      contactName: 'Mora',
      phone: '689 87 09 08',
      orderDays: 'Martes, Miércoles y Jueves',
      deliveryDays: 'Miércoles, Jueves y Viernes 8:00-8:15',
      defaultOrderText: '2 cajas romanilla, 4 kg cebolla blanca, 3 kg cebolla morada, 2 cajas tomates pintones, 49 sacos patatas 10kg',
      notes: 'Fruta fresca de huerta y patatas para freír.',
    },
    {
      name: 'José La Croqueta Coqueta',
      contactName: 'José',
      phone: '+34 605039408',
      orderDays: 'Miércoles',
      deliveryDays: 'Jueves',
      defaultOrderText: '1 caja cola toro, 1 caña lomo, 1 solomillo whisky, 1 carrillada, 1 mexicana',
      notes: 'Croquetas caseras artesanas sevillanas de alta calidad.',
    },
    {
      name: 'Álvaro La Fuente Quesos',
      contactName: 'Álvaro',
      phone: '+34 669158599',
      orderDays: 'Jueves',
      deliveryDays: 'Viernes',
      defaultOrderText: '5 cheddar, 2 gouda, 6 mix, 2 cabra payoyo, 1 ahumado, 1 parmesano cuña',
      notes: 'Especialista en quesos de la sierra y tablas.',
    },
    {
      name: 'Paco Rosa Carnes',
      contactName: 'Paco Rosa',
      phone: '+34 650021188',
      orderDays: 'Domingo y Miércoles',
      deliveryDays: 'Martes y Jueves',
      defaultOrderText: '180 kg carne picada mixta, secreto ibérico y carrilladas frescas',
      notes: 'Carnicería mayorista de confianza.',
    },
    {
      name: 'Joaquín Moreno Panadería',
      contactName: 'Joaquín',
      phone: '+34 652311945',
      orderDays: 'Lunes y Miércoles',
      deliveryDays: 'Martes y Jueves 7:30',
      defaultOrderText: '1 caja molletes sevillanos, 1 caja pan brioche artesano, 1 caja pastrami',
      notes: 'Pan artesano para montaditos y molletes.',
    },
    {
      name: 'Javier Pan Sin Gluten',
      contactName: 'Javier',
      phone: '+34 619036523',
      orderDays: 'Lunes y Jueves',
      deliveryDays: 'Martes y Sábado',
      defaultOrderText: '1 caja pan sin gluten envasado individual',
      notes: 'Certificado oficial FACE para celíacos.',
    },
    {
      name: 'Ilipa Congelado',
      contactName: 'Ilipa Aljarafe',
      phone: '+34 608242675',
      orderDays: 'Miércoles',
      deliveryDays: 'Jueves',
      defaultOrderText: '1 caja alitas, 1 caja fingers, 2 pulled pork, 3 cajas cheddar Bangor',
      notes: 'Distribución comarca del Aljarafe.',
    },
    {
      name: 'Fernando Bacon & Embutidos',
      contactName: 'Fernando',
      phone: '+34 605918318',
      orderDays: 'Martes',
      deliveryDays: 'Miércoles',
      defaultOrderText: '25 kg bacon loncha gruesa, paleta ibérica',
      notes: 'Chacinas y ahumados.',
    },
    {
      name: 'Nerón Hostelería & Limpieza',
      contactName: 'Nerón',
      phone: '+34 623372098',
      orderDays: 'Martes',
      deliveryDays: 'Miércoles',
      defaultOrderText: 'Cajas de papelones antigrasa, servilletas barra, lavavajillas industrial',
      notes: 'Detergentes y consumibles de barra.',
    },
    {
      name: 'Cruzcampo & Bebidas Aljarafe',
      contactName: 'Distribuidor Cerveza',
      phone: '+34 654000111',
      orderDays: 'Lunes y Jueves',
      deliveryDays: 'Martes y Viernes mañana',
      defaultOrderText: '4 barriles Cruzcampo Glaciar 50L, 5 cajas tercios sin gluten, 3 cajas agua 50cl',
      notes: 'Barriles cerveza glaciar y refrescos.',
    },
  ];

  const createdSuppliers: Record<string, string> = {};

  for (const s of suppliersData) {
    const existing = await prisma.supplier.findFirst({ where: { name: s.name } });
    if (!existing) {
      const created = await prisma.supplier.create({ data: s });
      createdSuppliers[s.name] = created.id;
    } else {
      createdSuppliers[s.name] = existing.id;
    }
  }

  console.log(`✅ ${Object.keys(createdSuppliers).length} Proveedores listos.`);

  // 2. Insumos de Stock de Taberna Quimera
  const supplyItemsData = [
    {
      name: 'Jamón Ibérico de Bellota 100%',
      category: 'CARNES',
      currentStock: 4.5,
      minStock: 2.0,
      unit: 'kg',
      currentPrice: 58.0,
      supplierName: 'Fernando Bacon & Embutidos',
      notes: 'Piezas con DO Jabugo cortadas a cuchillo en barra.',
    },
    {
      name: 'Queso Payoyo Curado de Cabra',
      category: 'QUESOS',
      currentStock: 3.2,
      minStock: 1.5,
      unit: 'kg',
      currentPrice: 24.5,
      supplierName: 'Álvaro La Fuente Quesos',
      notes: 'Sierra de Grazalema.',
    },
    {
      name: 'Huevos Frescos Camperos (Clase L)',
      category: 'FRUTAS_VERDURAS',
      currentStock: 12.0,
      minStock: 4.0,
      unit: 'cartones (30u)',
      currentPrice: 4.8,
      supplierName: 'Proveedor Camas Huevos',
      notes: 'Huevos de granja local en Camas para tortillas y fritos.',
    },
    {
      name: 'Aceite de Oliva Virgen Extra (AOVE)',
      category: 'ACEITES_SALSAS',
      currentStock: 8.0,
      minStock: 3.0,
      unit: 'garrafas (5L)',
      currentPrice: 38.0,
      supplierName: 'Proveedor Camas Huevos',
      notes: 'Para tostadas, ensaladas y cocina.',
    },
    {
      name: 'Barriles Cruzcampo Glaciar 50L',
      category: 'BEBIDAS',
      currentStock: 3.0,
      minStock: 2.0,
      unit: 'barriles',
      currentPrice: 115.0,
      supplierName: 'Cruzcampo & Bebidas Aljarafe',
      notes: 'Columna glaciar a -2ºC en barra.',
    },
    {
      name: 'Pan Mollete Sevillano Clásico',
      category: 'PANADERIA',
      currentStock: 4.0,
      minStock: 2.0,
      unit: 'cajas (50u)',
      currentPrice: 16.0,
      supplierName: 'Joaquín Moreno Panadería',
      notes: 'Para molletitos calientes y desayunos.',
    },
    {
      name: 'Pan sin Gluten Certificado',
      category: 'PANADERIA',
      currentStock: 2.0,
      minStock: 1.0,
      unit: 'cajas (20u)',
      currentPrice: 18.0,
      supplierName: 'Javier Pan Sin Gluten',
      notes: 'Envasado individual hermético.',
    },
    {
      name: 'Patata Agria Especial Fritura',
      category: 'FRUTAS_VERDURAS',
      currentStock: 15.0,
      minStock: 6.0,
      unit: 'sacos (10kg)',
      currentPrice: 9.5,
      supplierName: 'Frutas Mora',
      notes: 'Crujientes y doradas sin absorber aceite en exceso.',
    },
    {
      name: 'Tomate Pintón de Los Palacios',
      category: 'FRUTAS_VERDURAS',
      currentStock: 3.0,
      minStock: 2.0,
      unit: 'cajas (10kg)',
      currentPrice: 14.0,
      supplierName: 'Frutas Mora',
      notes: 'Para aliños con melva y ensaladas.',
    },
    {
      name: 'Croquetas de Cola de Toro',
      category: 'CARNES',
      currentStock: 2.0,
      minStock: 1.0,
      unit: 'cajas (100u)',
      currentPrice: 34.0,
      supplierName: 'José La Croqueta Coqueta',
      notes: 'Rebozado crujiente y bechamel muy cremosa.',
    },
    {
      name: 'Croquetas de Carrillada Ibérica',
      category: 'CARNES',
      currentStock: 1.0,
      minStock: 1.0,
      unit: 'cajas (100u)',
      currentPrice: 34.0,
      supplierName: 'José La Croqueta Coqueta',
      notes: 'Guiso tradicional al vino tinto.',
    },
    {
      name: 'Papelones Antigrasa & Servilletas',
      category: 'ENVASES_LIMPIEZA',
      currentStock: 5.0,
      minStock: 2.0,
      unit: 'cajas',
      currentPrice: 22.0,
      supplierName: 'Nerón Hostelería & Limpieza',
      notes: 'Papel manila y servilletas de barra.',
    },
  ];

  for (const it of supplyItemsData) {
    const existing = await prisma.supplyItem.findFirst({ where: { name: it.name } });
    if (!existing) {
      const supplierId = createdSuppliers[it.supplierName] || null;
      await prisma.supplyItem.create({
        data: {
          name: it.name,
          category: it.category,
          currentStock: it.currentStock,
          minStock: it.minStock,
          unit: it.unit,
          currentPrice: it.currentPrice,
          primarySupplierId: supplierId,
          notes: it.notes,
        },
      });
    }
  }

  console.log('✅ Insumos de stock creados.');

  // 3. Eventos y Festividades de Camas & Sevilla
  const eventsData = [
    {
      title: 'Feria y Fiestas Patronales de Camas',
      description: 'Fiestas Mayores en honor a la Virgen de los Dolores en el recinto ferial de Camas. Máxima afluencia local de vecinos y familias.',
      location: 'Camas (Recinto Ferial y Casco Urbano)',
      startDate: new Date('2026-09-10T00:00:00Z'),
      endDate: new Date('2026-09-15T23:59:59Z'),
      eventType: 'FERIA_CAMAS',
      demandMultiplier: 2.2, // +120%
      recommendedFocus: 'Refuerzo crítico en barriles de cerveza, montaditos, carne mechada, chacinas y hielo.',
    },
    {
      title: 'Paso de las Hermandades del Rocío por Camas',
      description: 'Camas es paso obligado de decenas de hermandades del Rocío hacia Almonte. Parada masiva de peregrinos, carretas y caballistas.',
      location: 'Camas (Calles principales y cruce del Aljarafe)',
      startDate: new Date('2026-05-20T00:00:00Z'),
      endDate: new Date('2026-05-24T23:59:59Z'),
      eventType: 'ROCIO_PASO',
      demandMultiplier: 1.8, // +80%
      recommendedFocus: 'Tapas frías, botellines de Cruzcampo, queso payoyo, jamón al corte y desayunos con mollete.',
    },
    {
      title: 'Semana Santa de Sevilla & Camas',
      description: 'Semana grande de cofradías con salida de la Hermandad de la Humillación y Gran Poder de Camas, más la conexión continua con Triana y centro de Sevilla.',
      location: 'Camas / Sevilla Capital',
      startDate: new Date('2026-03-29T00:00:00Z'),
      endDate: new Date('2026-04-05T23:59:59Z'),
      eventType: 'SEMANA_SANTA',
      demandMultiplier: 2.0, // +100%
      recommendedFocus: 'Bacalao frito, torrijas caseras, espinacas con garbanzos y vino fino/manzanilla.',
    },
    {
      title: 'Feria de Abril de Sevilla',
      description: 'Gran afluencia de clientes en tránsito desde Camas y el Aljarafe hacia el Real de Los Remedios. Picos en aperitivos de mediodía y cenas de regreso.',
      location: 'Sevilla (Los Remedios / Conexión Camas)',
      startDate: new Date('2026-04-20T00:00:00Z'),
      endDate: new Date('2026-04-26T23:59:59Z'),
      eventType: 'FERIA_ABRIL',
      demandMultiplier: 2.5, // +150%
      recommendedFocus: 'Manzanilla de Sanlúcar, Jamón Ibérico, Gambas al ajillo, Pimientos fritos y montaditos.',
    },
    {
      title: 'El Gran Derbi Sevillano (Sevilla FC vs Real Betis)',
      description: 'Jornada de máxima rivalidad y seguimiento en el bar. Lleno total para ver el partido en directo.',
      location: 'Camas / Sevilla',
      startDate: new Date('2026-11-08T18:00:00Z'),
      endDate: new Date('2026-11-08T23:59:59Z'),
      eventType: 'FUTBOL_DERBI',
      demandMultiplier: 1.8, // +80%
      recommendedFocus: 'Doble de cerveza Cruzcampo, croquetas variadas, patatas bravas y papelones de chacinas.',
    },
    {
      title: 'Ola de Calor Aljarafeña (>40ºC)',
      description: 'Altas temperaturas extremas en Sevilla. Desciende el consumo de guisos calientes y se dispara la cerveza helada.',
      location: 'Camas / Sevilla Metropolitana',
      startDate: new Date('2026-07-15T00:00:00Z'),
      endDate: new Date('2026-07-25T23:59:59Z'),
      eventType: 'CALOR',
      demandMultiplier: 1.4, // +40%
      recommendedFocus: 'Cerveza glaciar a -2ºC, aliños frescos, ensaladilla rusa, gazpacho y hielo picado.',
    },
  ];

  for (const ev of eventsData) {
    const existing = await prisma.localEvent.findFirst({ where: { title: ev.title } });
    if (!existing) {
      await prisma.localEvent.create({ data: ev });
    }
  }

  console.log('✅ Eventos y festividades de Camas/Sevilla precargados con éxito.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Error sembrando stock:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
