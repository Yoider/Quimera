'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Beer,
  UtensilsCrossed,
  Fish,
  Salad,
  Ham,
  Flame,
  Egg,
  Sandwich,
  Sparkles,
  Package,
  MapPin,
  Clock,
  ShieldCheck,
  Menu as MenuIcon,
  X,
} from 'lucide-react';
import InstagramIcon from './icons/InstagramIcon';
import { Category } from '@/types/menu';

interface HeaderProps {
  categories: Category[];
  activeCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Beer,
  UtensilsCrossed,
  Fish,
  Salad,
  Ham,
  Flame,
  Egg,
  Sandwich,
  Sparkles,
  Package,
};

export default function Header({
  categories,
  activeCategoryId,
  onSelectCategory,
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryClick = (categoryId: string, slug: string) => {
    if (onSelectCategory) {
      onSelectCategory(categoryId);
    }
    const element = document.getElementById(`seccion-${slug}`);
    if (element) {
      const yOffset = -130;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EADBC8]/70 transition-all duration-300">
      {/* Top Banner with Quick Info */}
      <div className="bg-[#9E2A2B] text-amber-100 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between font-medium">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#D4A373]" />
              Sevilla, España
            </span>
            <span className="hidden sm:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
              Abierto todos los días: 12:30h - 00:00h
            </span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href="https://instagram.com/tabernaquimera"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>@tabernaquimera</span>
            </a>
            <Link
              href="/staff"
              className="flex items-center gap-1 text-amber-200/80 hover:text-white transition-colors border-l border-red-800 pl-3"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Zona Staff</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Brand Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#9E2A2B] flex items-center justify-center text-amber-100 font-serif font-bold text-xl shadow-sm border border-[#D4A373]/40 group-hover:scale-105 transition-transform">
            Q
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl sm:text-3xl font-extrabold tracking-wider text-[#9E2A2B] uppercase leading-none">
              Quimera
            </span>
            <span className="text-[10px] tracking-[0.25em] text-[#6E6259] font-medium uppercase mt-0.5">
              Taberna & Cervecería · Sevilla
            </span>
          </div>
        </Link>

        {/* Desktop Quick Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#2B2523]">
          <a
            href="#carta"
            className="hover:text-[#9E2A2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#9E2A2B]"
          >
            Carta Completa
          </a>
          <a
            href="#informacion"
            className="hover:text-[#9E2A2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#9E2A2B]"
          >
            Horario & Ubicación
          </a>
          <Link
            href="/staff"
            className="px-3.5 py-1.5 rounded-full bg-[#9E2A2B]/10 text-[#9E2A2B] hover:bg-[#9E2A2B] hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 border border-[#9E2A2B]/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Control de Barra
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-[#2B2523] hover:bg-[#EADBC8]/40 transition-colors"
          aria-label="Abrir menú"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EADBC8] bg-[#FAF8F5] px-4 pt-3 pb-4 space-y-2">
          <a
            href="#carta"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#2B2523] hover:bg-[#EADBC8]/40"
          >
            Carta Completa
          </a>
          <a
            href="#informacion"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#2B2523] hover:bg-[#EADBC8]/40"
          >
            Horarios & Localización
          </a>
          <Link
            href="/staff"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#9E2A2B] bg-[#9E2A2B]/10"
          >
            Zona Staff / Barra
          </Link>
        </div>
      )}

      {/* Sticky Horizontal Sub-Navigation for Categories */}
      <div className="w-full bg-[#FAF8F5] border-t border-[#EADBC8]/70 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 overflow-x-auto py-2.5 no-scrollbar scroll-smooth">
            {categories.map((cat) => {
              const IconComponent = ICON_MAP[cat.icon] || UtensilsCrossed;
              const isActive = activeCategoryId === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id, cat.slug)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'bg-[#9E2A2B] text-white border-[#9E2A2B] shadow-sm scale-[1.02]'
                      : 'bg-white text-[#2B2523] border-[#EADBC8] hover:border-[#D4A373] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <IconComponent
                    className={`w-3.5 h-3.5 ${
                      isActive ? 'text-[#D4A373]' : 'text-[#9E2A2B]'
                    }`}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
