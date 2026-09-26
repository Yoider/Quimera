import { getCategories, getProducts } from '@/lib/menuService';
import { getWorkersAction } from '@/lib/schedule/actions';
import StaffClient from './StaffClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control de Barra, Plantilla y Horarios | Taberna Quimera',
  description: 'Panel interno de gestión de disponibilidad de carta, comandas, plantilla de trabajadores y cuadrante de horarios con IA.',
};

export const revalidate = 0; // Always fresh for staff

export default async function StaffPage() {
  const [categories, products, workers] = await Promise.all([
    getCategories(),
    getProducts(),
    getWorkersAction(),
  ]);

  return (
    <StaffClient
      initialCategories={categories}
      initialProducts={products}
      initialWorkers={workers}
    />
  );
}
