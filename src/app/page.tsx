import Header from '@/components/Header';
import Hero from '@/components/Hero';
import MenuCatalog from '@/components/MenuCatalog';
import ScheduleTable from '@/components/ScheduleTable';
import Footer from '@/components/Footer';
import { getCategories, getProducts } from '@/lib/menuService';
import { getSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const categories = await getCategories();
  const products = await getProducts();
  const currentUser = await getSession();

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      {/* Sticky Header with Brand, Category sub-nav, and User Session state */}
      <Header categories={categories} currentUser={currentUser} />

      {/* Hero Welcome & Atmosphere */}
      <Hero />

      {/* Main Interactive Menu with Filters */}
      <main className="flex-1">
        <MenuCatalog
          categories={categories}
          initialProducts={products}
        />

        {/* Horarios de Servicio Section */}
        <section id="horario" className="py-16 bg-[#F4EBE1]/40 border-t border-[#EADBC8]">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="text-center space-y-2">
              <h2 className="font-serif text-3xl font-extrabold text-[#2B2523] uppercase tracking-wider">
                Horario de Servicio
              </h2>
              <div className="w-12 h-1 bg-[#9E2A2B] mx-auto rounded-full" />
              <p className="text-sm text-[#6E6259]">
                Abierto de martes a domingo para almuerzos y cenas. Lunes cerrado por descanso del personal.
              </p>
            </div>
            <ScheduleTable />
          </div>
        </section>
      </main>

      {/* Footer with schedules, location and links */}
      <Footer />
    </div>
  );
}
