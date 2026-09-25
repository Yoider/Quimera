import React from 'react';
import { ArrowDown, Beer, Award, Sparkles, MapPin } from 'lucide-react';
import InstagramIcon from './icons/InstagramIcon';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] via-[#F4EBE1]/40 to-[#FAF8F5] py-12 md:py-20 border-b border-[#EADBC8]">
      {/* Background Subtle Ornamental Elements */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-[#D4A373]/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#9E2A2B]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Main Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#9E2A2B]/10 border border-[#9E2A2B]/20 text-[#9E2A2B] text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>Cervecería & Taberna · Sevilla</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#2B2523] tracking-tight leading-tight">
              La esencia del tapeo sevillano en{' '}
              <span className="text-[#9E2A2B] relative inline-block">
                Taberna Quimera
                <svg
                  className="absolute left-0 -bottom-2 w-full h-2 text-[#D4A373]/60"
                  viewBox="0 0 200 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 5.5C50 2 150 2 199 5.5"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h1>

            <p className="text-base sm:text-lg text-[#6E6259] max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Cerveza Cruzcampo tirada a temperatura glaciar, marisco noble de Huelva, papelones de ibéricos cortados al instante y molletes crujientes con recetas de autor.
            </p>

            {/* Quick Feature Badges */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2.5 pt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-[#EADBC8] text-xs font-medium text-[#2B2523] shadow-2xs">
                <Beer className="w-3.5 h-3.5 text-[#9E2A2B]" />
                Cruzcampo Glaciar
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-[#EADBC8] text-xs font-medium text-[#2B2523] shadow-2xs">
                <Award className="w-3.5 h-3.5 text-[#D4A373]" />
                100% Bellota
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white border border-[#EADBC8] text-xs font-medium text-[#2B2523] shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-[#9E2A2B]" />
                Corazón de Sevilla
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-4">
              <a
                href="#carta"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#9E2A2B] text-white font-medium hover:bg-[#832223] transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
              >
                <span>Explorar la Carta</span>
                <ArrowDown className="w-4 h-4 text-amber-200" />
              </a>

              <a
                href="https://instagram.com/tabernaquimera"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-white text-[#2B2523] border border-[#EADBC8] hover:border-[#D4A373] hover:bg-[#FAF8F5] transition-all font-medium shadow-2xs"
              >
                <InstagramIcon className="w-4 h-4 text-[#9E2A2B]" />
                <span>@tabernaquimera</span>
              </a>
            </div>
          </div>

          {/* Tavern Visual Card */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md rounded-2xl overflow-hidden shadow-xl border border-[#EADBC8] bg-white group">
              <div className="relative h-64 sm:h-80 w-full overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=900&q=80"
                  alt="Ambiente de Taberna Quimera"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-xs font-semibold tracking-wider uppercase text-amber-300">
                    Cervecería de Barrio · Identidad Propia
                  </div>
                  <div className="text-lg font-serif font-bold text-white mt-0.5">
                    El placer del buen tapeo sevillano
                  </div>
                  <div className="text-xs text-white/80 mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Cocina y grifos en servicio
                  </div>
                </div>
              </div>

              {/* Card Footer Bar */}
              <div className="p-4 bg-white flex items-center justify-between text-xs text-[#6E6259]">
                <div>
                  <span className="font-semibold text-[#2B2523]">Horario de apertura:</span>{' '}
                  12:30 a 00:00 h
                </div>
                <div className="text-[#9E2A2B] font-semibold">Tapas & Raciones</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
