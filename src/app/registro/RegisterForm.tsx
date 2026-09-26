'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { registerUserAction } from '@/lib/auth/actions';
import GoogleIcon from '@/components/icons/GoogleIcon';
import {
  User,
  AtSign,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export default function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    startTransition(async () => {
      const res = await registerUserAction({
        name,
        username,
        email: email.trim() || undefined,
        password,
        confirmPassword,
      });

      if (!res.success) {
        setError(res.error || 'Ocurrió un error al registrar la cuenta.');
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
          Crea tu Cuenta
        </h1>
        <p className="text-xs text-[#6E6259]">
          Disfruta del tapeo sevillano, guarda tus platos favoritos y accede a ventajas en la taberna.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2523] uppercase tracking-wider mb-1.5">
            Nombre Completo *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-[#6E6259] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Carmen Navarro"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm text-[#2B2523] placeholder-[#6E6259]/60 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B] transition-all"
            />
          </div>
        </div>

        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2523] uppercase tracking-wider mb-1.5">
            Nombre de Usuario *
          </label>
          <div className="relative">
            <AtSign className="w-4 h-4 text-[#6E6259] absolute left-3.5 top-3" />
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="carmen_sevilla"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm text-[#2B2523] placeholder-[#6E6259]/60 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B] transition-all"
            />
          </div>
          <span className="text-[10px] text-[#6E6259] mt-0.5 block">
            Lo usarás para iniciar sesión en cualquier momento.
          </span>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2523] uppercase tracking-wider mb-1.5">
            Correo Electrónico <span className="text-[#6E6259] font-normal lowercase">(opcional)</span>
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-[#6E6259] absolute left-3.5 top-3" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
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
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
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

        {/* Confirm Password */}
        <div>
          <label className="block text-xs font-semibold text-[#2B2523] uppercase tracking-wider mb-1.5">
            Confirmar Contraseña *
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-[#6E6259] absolute left-3.5 top-3" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FAF8F5] border border-[#EADBC8] text-sm text-[#2B2523] placeholder-[#6E6259]/60 focus:outline-none focus:ring-2 focus:ring-[#9E2A2B]/20 focus:border-[#9E2A2B] transition-all"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-4 rounded-xl bg-[#9E2A2B] hover:bg-[#832223] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <span>Creando cuenta segura...</span>
          ) : (
            <>
              <span>Registrarme en Taberna Quimera</span>
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

      {/* Google OAuth (Prepared for next step) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => alert('La integración directa con Google OAuth estará disponible en la próxima actualización.')}
          className="w-full py-2.5 px-4 rounded-xl bg-white border border-[#EADBC8] hover:border-[#D4A373] text-[#2B2523] font-medium text-xs flex items-center justify-center gap-3 transition-colors shadow-2xs group cursor-pointer"
        >
          <GoogleIcon className="w-4 h-4" />
          <span>Continuar con Google</span>
          <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ml-1">
            Próximamente
          </span>
        </button>
      </div>

      {/* Footer link to Login */}
      <div className="pt-2 text-center text-xs text-[#6E6259]">
        ¿Ya tienes una cuenta?{' '}
        <Link
          href="/login"
          className="font-bold text-[#9E2A2B] hover:underline"
        >
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
}
