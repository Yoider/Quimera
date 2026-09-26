import React from 'react';
import Link from 'next/link';
import { MapPin, Clock, Phone, ShieldCheck, Heart } from 'lucide-react';
import InstagramIcon from './icons/InstagramIcon';

export default function Footer() {
  return (
    <footer id="informacion" className="bg-[#2B2523] text-stone-300 mt-20 border-t border-[#3A322E]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#9E2A2B] flex items-center justify-center text-amber-100 font-serif font-bold text-xl border border-[#D4A373]/50">
                Q
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-wider text-white uppercase block leading-none">
                  Taberna Quimera
                </span>
                <span className="text-[10px] tracking-[0.25em] text-[#D4A373] uppercase font-semibold">
                  Cervecería de Barrio · Sevilla
                </span>
              </div>
            </div>

            <p className="text-sm text-stone-400 max-w-md leading-relaxed">
              Cuidando el producto, el frío del barril y el calor de nuestra gente. Tu punto de encuentro en Sevilla para disfrutar de la buena mesa y el tapeo auténtico.
            </p>

            <div className="pt-2">
              <a
                href="https://instagram.com/tabernaquimera"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                <InstagramIcon className="w-4 h-4 text-[#D4A373]" />
                <span>Síguenos en @tabernaquimera</span>
              </a>
            </div>
          </div>

          {/* Horario */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#D4A373]" />
              Tabla de Horarios
            </h4>
            <div className="overflow-hidden rounded-lg border border-stone-800 bg-stone-900/60 text-xs">
              <table className="w-full text-left">
                <tbody className="divide-y divide-stone-800 text-[11px]">
                  <tr className="bg-red-950/40 text-rose-300 font-semibold">
                    <td className="py-1.5 px-2.5">Lunes</td>
                    <td className="py-1.5 px-2.5 text-right font-bold text-rose-400">CERRADO</td>
                  </tr>
                  <tr className="hover:bg-stone-800/50">
                    <td className="py-1.5 px-2.5 text-stone-300">Martes</td>
                    <td className="py-1.5 px-2.5 text-right text-stone-400">12:00-16:00 · 20:00-00:00</td>
                  </tr>
                  <tr className="hover:bg-stone-800/50">
                    <td className="py-1.5 px-2.5 text-stone-300">Miércoles</td>
                    <td className="py-1.5 px-2.5 text-right text-stone-400">12:00-16:00 · 20:00-00:00</td>
                  </tr>
                  <tr className="hover:bg-stone-800/50">
                    <td className="py-1.5 px-2.5 text-stone-300">Jueves</td>
                    <td className="py-1.5 px-2.5 text-right text-stone-400">12:00-16:00 · 20:00-00:00</td>
                  </tr>
                  <tr className="hover:bg-stone-800/50">
                    <td className="py-1.5 px-2.5 text-stone-300">Viernes</td>
                    <td className="py-1.5 px-2.5 text-right text-stone-400">12:00-16:00 · 20:00-00:00</td>
                  </tr>
                  <tr className="hover:bg-stone-800/50">
                    <td className="py-1.5 px-2.5 text-stone-300">Sábado</td>
                    <td className="py-1.5 px-2.5 text-right text-stone-400">12:00-16:00 · 20:00-00:00</td>
                  </tr>
                  <tr className="hover:bg-stone-800/50">
                    <td className="py-1.5 px-2.5 text-stone-300">Domingo</td>
                    <td className="py-1.5 px-2.5 text-right text-stone-400">12:00-16:00 · 20:00-00:00</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-stone-400">
              * Servicio en barra y mesas sin reserva previa.
            </p>
          </div>

          {/* Ubicación y Enlaces */}
          <div className="space-y-3">
            <h4 className="font-serif text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#D4A373]" />
              Localización
            </h4>
            <div className="text-xs text-stone-400 space-y-2">
              <p>Sevilla, España</p>
              <p className="flex items-center gap-2 text-stone-300">
                <Phone className="w-3.5 h-3.5 text-[#D4A373]" />
                Atención en local
              </p>
            </div>

            <div className="pt-3">
              <Link
                href="/staff"
                className="inline-flex items-center gap-1.5 text-xs text-[#D4A373] hover:text-white transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acceso Empleados / Barra</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-10 mt-10 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-4">
          <p>© {new Date().getFullYear()} Taberna Quimera. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Diseñado con <Heart className="w-3 h-3 text-[#9E2A2B] fill-[#9E2A2B]" /> para los amantes del buen tapeo
          </p>
        </div>
      </div>
    </footer>
  );
}
