'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  User,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import InstagramIcon from './icons/InstagramIcon';
import ScheduleModal from './ScheduleModal';
import { Category } from '@/types/menu';
import { SessionUser } from '@/lib/auth/session';
import { logoutUserAction } from '@/lib/auth/actions';

interface HeaderProps {
  categories: Category[];
  activeCategoryId?: string;
  onSelectCategory?: (categoryId: string) => void;
  currentUser?: SessionUser | null;
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
  currentUser,
}: HeaderProps) {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logoutUserAction();
    router.refresh();
  };

  const isStaff = currentUser && ['ADMIN', 'GERENTE', 'CAMARERO', 'COCINA'].includes(currentUser.role);

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
            <button
              onClick={() => setScheduleModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 hover:text-white cursor-pointer transition-colors text-left"
              title="Ver tabla completa de horarios"
            >
              <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>Mar-Dom: 12:00-16:00 · 20:00-00:00 (Lunes cerrado)</span>
              <span className="text-[10px] text-amber-300 underline underline-offset-2 ml-1 font-semibold">Ver tabla</span>
            </button>
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

            {/* Auth Top Indicator */}
            {currentUser ? (
              <Link
                href="/perfil"
                className="flex items-center gap-1 text-amber-200 hover:text-white transition-colors border-l border-red-800 pl-3 font-semibold"
              >
                <User className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="hidden sm:inline">Hola, {currentUser.name?.split(' ')[0] || currentUser.username}</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 text-amber-200/90 hover:text-white transition-colors border-l border-red-800 pl-3"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Acceso Clientes</span>
              </Link>
            )}

            <Link
              href="/staff"
              className="hidden md:flex items-center gap-1 text-amber-200/80 hover:text-white transition-colors border-l border-red-800 pl-3"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Zona Staff</span>
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
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium text-[#2B2523]">
          <a
            href="#carta"
            className="hover:text-[#9E2A2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#9E2A2B]"
          >
            Carta Completa
          </a>
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="hover:text-[#9E2A2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#9E2A2B] cursor-pointer"
          >
            Horario
          </button>
          <a
            href="#informacion"
            className="hover:text-[#9E2A2B] transition-colors py-1 border-b-2 border-transparent hover:border-[#9E2A2B]"
          >
            Localización
          </a>

          {/* User Profile / Auth Button */}
          {currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#EADBC8] hover:border-[#D4A373] text-[#2B2523] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-full bg-[#9E2A2B] text-amber-100 flex items-center justify-center text-xs font-serif font-bold">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate">{currentUser.name || currentUser.username}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#6E6259]" />
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-[#EADBC8] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-[#EADBC8]/70">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6E6259] block">
                      Cuenta ({currentUser.role})
                    </span>
                    <span className="text-xs font-bold text-[#2B2523] truncate block">
                      @{currentUser.username}
                    </span>
                  </div>

                  <Link
                    href="/perfil"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-[#2B2523] hover:bg-[#FAF8F5] transition-colors"
                  >
                    <User className="w-3.5 h-3.5 text-[#9E2A2B]" />
                    <span>Mi Perfil de Cliente</span>
                  </Link>

                  {isStaff && (
                    <Link
                      href="/staff"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#9E2A2B] font-semibold hover:bg-red-50 transition-colors"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Panel de Barra / Staff</span>
                    </Link>
                  )}

                  <div className="border-t border-[#EADBC8]/70 mt-1 pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#2B2523] hover:text-[#9E2A2B] transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/registro"
                className="px-3.5 py-1.5 rounded-full bg-[#9E2A2B] text-white hover:bg-[#832223] transition-all text-xs font-semibold shadow-xs"
              >
                Registrarme
              </Link>
            </div>
          )}

          <Link
            href="/staff"
            className="px-3.5 py-1.5 rounded-full bg-[#9E2A2B]/10 text-[#9E2A2B] hover:bg-[#9E2A2B] hover:text-white transition-all text-xs font-semibold flex items-center gap-1.5 border border-[#9E2A2B]/20"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Control Barra
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
          {/* User status in mobile */}
          {currentUser ? (
            <div className="p-3 rounded-xl bg-white border border-[#EADBC8] mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#9E2A2B] text-amber-100 flex items-center justify-center text-xs font-serif font-bold">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : currentUser.username[0].toUpperCase()}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2B2523] block leading-none">
                    {currentUser.name || currentUser.username}
                  </span>
                  <span className="text-[10px] text-[#6E6259]">@{currentUser.username}</span>
                </div>
              </div>
              <Link
                href="/perfil"
                onClick={() => setMobileMenuOpen(false)}
                className="text-xs font-bold text-[#9E2A2B] bg-[#9E2A2B]/10 px-2.5 py-1 rounded-lg"
              >
                Perfil
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 mb-3">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-center text-xs font-bold text-[#2B2523] bg-white border border-[#EADBC8] rounded-xl"
              >
                Iniciar Sesión
              </Link>
              <Link
                href="/registro"
                onClick={() => setMobileMenuOpen(false)}
                className="py-2 text-center text-xs font-bold text-white bg-[#9E2A2B] rounded-xl"
              >
                Registrarme
              </Link>
            </div>
          )}

          <a
            href="#carta"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#2B2523] hover:bg-[#EADBC8]/40"
          >
            Carta Completa
          </a>
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              setScheduleModalOpen(true);
            }}
            className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-[#2B2523] hover:bg-[#EADBC8]/40 cursor-pointer"
          >
            Horario Semanal (Lunes cerrado)
          </button>
          <a
            href="#informacion"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#2B2523] hover:bg-[#EADBC8]/40"
          >
            Localización
          </a>
          <Link
            href="/staff"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-[#9E2A2B] bg-[#9E2A2B]/10"
          >
            Zona Staff / Barra
          </Link>

          {currentUser && (
            <button
              onClick={handleLogout}
              className="w-full text-left block px-3 py-2 rounded-md text-sm font-semibold text-red-700 hover:bg-red-50"
            >
              Cerrar Sesión
            </button>
          )}
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200 border cursor-pointer ${
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

      {/* Schedule Modal */}
      <ScheduleModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
      />
    </header>
  );
}
