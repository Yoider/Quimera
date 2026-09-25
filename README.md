# Quimera

Aplicación web oficial y carta digital interactiva para **Taberna Quimera** (cervecería y taberna moderna en Sevilla). Incluye frontend de cliente con filtrado avanzado de alérgenos y buscador, panel interno para empleados (`/staff`) con control de disponibilidad de platos en vivo y gestión de comandas, además de empaquetado Docker multi-stage para despliegue en servidor.

---

## 🛠️ Stack Tecnológico

- **Framework:** Next.js 16 (App Router, Server Components y Server Actions)
- **Lenguaje:** TypeScript (`strict: true`)
- **Estilos:** Tailwind CSS v4 con paleta personalizada "Modern Tavern" (#9E2A2B, #D4A373, #FAF8F5)
- **Iconografía:** Lucide React
- **ORM / Base de Datos:** Prisma 6 con modelos tipados y capa mock desacoplada
- **Contenedores:** Dockerfile multi-stage (`output: 'standalone'`) y docker-compose.yml

---

## 📋 Características Principales

1. **Carta Digital de Clientes:**
   - 10 categorías estructuradas por orden operacional de hostelería: *Bebidas, Pasarratos, Mar y Sal, Al Fresquito, Papelones, Guisos, Huevos, Entre Panes, Croquetas y La Despensa*.
   - Sub-navegación sticky horizontal con scroll suave sincronizado.
   - Buscador por texto (nombre, descripción, ingredientes) en tiempo real.
   - Filtro de exclusión de alérgenos (*Sin Gluten, Sin Lactosa, Sin Pescado, Sin Frutos Secos, etc.*).
   - Modal interactivo con detalle de plato, ingredientes desglosados y aviso de alérgenos.

2. **Panel Staff & Barra (`/staff`):**
   - Control de disponibilidad instantáneo: botón para marcar platos como *Disponible* o *Agotado*.
   - Panel visual de comandas activas para barra y cocina (*Pendiente*, *En preparación*, *Servido*).

3. **Dockerizado para Producción:**
   - Construcción multi-stage ultra ligera en Node Alpine.

---

## 🚀 Puesta en Marcha

### Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Generar cliente Prisma
npm run prisma:generate

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abre en tu navegador:
- Carta clientes: [http://localhost:3000](http://localhost:3000)
- Panel de personal: [http://localhost:3000/staff](http://localhost:3000/staff)

### Despliegue con Docker

```bash
docker compose up -d --build
```
