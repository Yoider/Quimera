'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { loginUserAction } from '@/lib/auth/actions';
import GoogleIcon from '@/components/icons/GoogleIcon';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';

export default function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const err = params.get('error');
      if (err === 'google_cancelled') {
        setError('Inicio de sesión con Google cancelado.');
      } else if (err === 'token_exchange_failed' || err === 'user_info_failed') {
        setError('Error al conectar con Google. Por favor, inténtalo de nuevo.');
      } else if (err === 'server_configuration') {
        setError('Configuración del servidor de Google incompleta.');
      } else if (err) {
        setError('No se pudo completar el inicio de sesión con Google.');
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const res = await loginUserAction({
        identifier,
        password,
      });

      if (!res.success) {
        setError(res.error || 'Credenciales incorrectas.');
      } else {
        router.push('/');
        router.refresh();
      }
    });
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl border border-[#EADBC8] shadow-xl overflow-hidden p-6 sm:p-8 space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-[#9E2A2B] flex items-center justify-center text-amber-100 font-serif font-bold text-xl shadow-xs group-hover:scale-105 transition-transform">
            Q
          </div>
          <span className="font-serif text-2xl font-extrabold tracking-wider text-[#9E2A2B] uppercase">
            Quimera
          </span>
        </Link>

        <h1 className="font-serif text-2xl font-bold text-[#2B2523]">
          Iniciar Sesión
        </h1>
        <p className="text-xs text-[#6E6259]">
          Accede a tu cuenta de Taberna Quimera con tu usuario o email.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Identifier (Username or Email) */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2523] uppercase tracking-wider mb-1.5">
            Usuario o Correo Electrónico *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#6E6259] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="tu_usuario o tu@correo.com"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm text-[#2B2523] placeholder-[#6E6259]/60 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B] transition-all"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2523] uppercase tracking-wider mb-1.5">
            Contraseña *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#6E6259] absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Introduce tu contraseña"
              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm text-[#2B2523] placeholder-[#6E6259]/60 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B] transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-[#6E6259] hover:text-[#2B2523] transition-colors"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-4 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <span>Iniciando sesión...</span>
          ) : (
            <>
              <span>Entrar a mi Cuenta</span>
              <ArrowRight className="w-4 h-4 text-amber-200" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="border-t border-[#EADBC8] w-full" />
        <span className="bg-white px-3 text-[11px] font-semibold text-[#6E6259] uppercase tracking-wider">
          O continúa con
        </span>
      </div>

      {/* Google OAuth */}
      <div className="relative">
        <a
          href="/api/auth/google"
          className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#EADBC8] hover:border-[#D4A373] hover:bg-stone-50 text-[#2B2523] font-medium text-xs flex items-center justify-center gap-3 transition-all shadow-2xs group cursor-pointer"
        >
          <GoogleIcon className="w-4 h-4 shrink-0" />
          <span className="font-semibold">Continuar con Google</span>
        </a>
      </div>

      {/* Footer link to Register */}
      <div className="pt-2 text-center text-xs text-[#6E6259]">
        ¿Aún no tienes cuenta?{' '}
        <Link
          href="/registro"
          className="font-bold text-[#9E2A2B] hover:underline"
        >
          Regístrate gratis aquí
        </Link>
      </div>
    </div>
  );
}
