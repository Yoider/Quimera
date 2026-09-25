import { getCategories, getProducts } from '@/lib/menuService';
import StaffClient from './StaffClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Control de Barra y Servicio | Taberna Quimera',
  description: 'Panel interno de gestión de disponibilidad de carta y comandas en directo.',
};

export const revalidate = 0; // Always fresh for staff

export default async function StaffPage() {
  const categories = await getCategories();
  const products = await getProducts();

  return (
    <StaffClient
      initialCategories={categories}
      initialProducts={products}
    />
  );
}
