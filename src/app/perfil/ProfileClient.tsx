'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { logoutUserAction } from '@/lib/auth/actions';
import {
  User,
  AtSign,
  Mail,
  ShieldCheck,
  Calendar,
  LogOut,
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';

interface ProfileClientProps {
  user: {
    id: string;
    name: string | null;
    username: string | null;
    email: string | null;
    role: string;
    createdAt: Date | string;
    ordersCount: number;
  };
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logoutUserAction();
      router.push('/');
      router.refresh();
    });
  };

  const memberSince = new Date(user.createdAt).toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
  });

  const isStaffOrAdmin = ['ADMIN', 'GERENTE', 'CAMARERO', 'COCINA'].includes(user.role);

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#D4A373]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#9E2A2B]/5 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-2xl mx-auto w-full flex items-center justify-between z-10 pb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6259] hover:text-[#9E2A2B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la carta</span>
        </Link>

        <button
          onClick={handleLogout}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{isPending ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
        </button>
      </div>

      {/* Profile Card */}
      <main className="my-auto max-w-2xl mx-auto w-full z-10 space-y-6">
        <div className="bg-white rounded-2xl border border-[#EADBC8] shadow-lg p-6 sm:p-8 space-y-6">
          {/* Avatar & Main Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 pb-6 border-b border-[#EADBC8]">
            <div className="w-20 h-20 rounded-full bg-[#9E2A2B] flex items-center justify-center text-amber-100 font-serif font-extrabold text-3xl shadow-md border-2 border-[#D4A373]">
              {user.name ? user.name[0].toUpperCase() : user.username ? user.username[0].toUpperCase() : 'Q'}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="font-serif text-2xl font-bold text-[#2B2523]">
                  {user.name || 'Cliente Quimera'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-[#6E6259] font-medium flex items-center justify-center sm:justify-start gap-1">
                <AtSign className="w-3 h-3 text-[#D4A373]" />
                <span>{user.username}</span>
              </p>
              {user.email && (
                <p className="text-xs text-[#6E6259] flex items-center justify-center sm:justify-start gap-1">
                  <Mail className="w-3 h-3 text-[#D4A373]" />
                  <span>{user.email}</span>
                </p>
              )}
            </div>
          </div>

          {/* Account Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#9E2A2B] flex items-center justify-center border border-amber-200">
                <Calendar className="w-5 h-5 text-[#9E2A2B]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6E6259] tracking-wider block">
                  Miembro desde
                </span>
                <span className="text-sm font-semibold text-[#2B2523] capitalize">
                  {memberSince}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 text-[#9E2A2B] flex items-center justify-center border border-amber-200">
                <ShoppingBag className="w-5 h-5 text-[#9E2A2B]" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6E6259] tracking-wider block">
                  Comandas Realizadas
                </span>
                <span className="text-sm font-semibold text-[#2B2523]">
                  {user.ordersCount} pedidos
                </span>
              </div>
            </div>
          </div>

          {/* Staff Direct Access if applicable */}
          {isStaffOrAdmin && (
            <div className="p-4 rounded-xl bg-[#9E2A2B]/10 border border-[#9E2A2B]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-6 h-6 text-[#9E2A2B]" />
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#9E2A2B]">
                    Permisos de Personal / Sala
                  </h3>
                  <p className="text-xs text-[#6E6259]">
                    Tienes acceso para cambiar disponibilidad de platos y gestionar comandas.
                  </p>
                </div>
              </div>
              <Link
                href="/staff"
                className="px-4 py-2 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
              >
                Ir a Staff →
              </Link>
            </div>
          )}

          {/* Quick Shortcuts */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href="/#carta"
              className="flex-1 py-3 px-4 rounded-xl bg-[#9E2A2B] text-white text-xs font-bold uppercase tracking-wider text-center hover:bg-[#832223] transition-colors"
            >
              Ver Carta y Platos
            </Link>
            <Link
              href="/#horario"
              className="flex-1 py-3 px-4 rounded-xl bg-white border border-[#EADBC8] text-[#2B2523] text-xs font-bold uppercase tracking-wider text-center hover:border-[#D4A373] transition-colors"
            >
              Consultar Horarios
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-[#6E6259]/80 py-4 z-10">
        Taberna Quimera · Sevilla
      </footer>
    </div>
  );
}
