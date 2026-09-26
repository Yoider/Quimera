import React from 'react';
import Link from 'next/link';
import RegisterForm from './RegisterForm';
import { ArrowLeft } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crear Cuenta | Taberna Quimera',
  description: 'Regístrate en Taberna Quimera para disfrutar de ventajas exclusivas y guardar tus platos favoritos.',
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background Ornaments */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#D4A373]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#9E2A2B]/5 blur-3xl pointer-events-none" />

      {/* Top Navigation */}
      <div className="max-w-md mx-auto w-full flex items-center justify-between z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6E6259] hover:text-[#9E2A2B] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a la carta</span>
        </Link>
      </div>

      {/* Main Card */}
      <main className="my-auto py-6 flex items-center justify-center z-10">
        <RegisterForm />
      </main>

      {/* Subtle Footer */}
      <footer className="text-center text-xs text-[#6E6259]/80 py-4 z-10">
        Taberna Quimera · Cervecería & Tapeo en Sevilla
      </footer>
    </div>
  );
}
