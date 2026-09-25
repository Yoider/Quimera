import Header from '@/components/Header';
import Hero from '@/components/Hero';
import MenuCatalog from '@/components/MenuCatalog';
import Footer from '@/components/Footer';
import { getCategories, getProducts } from '@/lib/menuService';

export const revalidate = 60; // Revalidate every 60 seconds

export default async function HomePage() {
  const categories = await getCategories();
  const products = await getProducts();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Sticky Header with Brand and Category sub-nav */}
      <Header categories={categories} />

      {/* Hero Welcome & Atmosphere */}
      <Hero />

      {/* Main Interactive Menu with Filters */}
      <main className="flex-1">
        <MenuCatalog
          categories={categories}
          initialProducts={products}
        />
      </main>

      {/* Footer with schedules, location and links */}
      <Footer />
    </div>
  );
}
