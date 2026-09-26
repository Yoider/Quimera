import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Taberna Quimera | Cervecería & Taberna Moderna en Sevilla',
  description:
    'Carta oficial y experiencia gastronómica de Taberna Quimera. Cerveza Cruzcampo glaciar, chacinas ibéricas de bellota, marisco fresco de Huelva y molletes gourmet en Sevilla.',
  keywords: [
    'Taberna Quimera',
    'Cervecería Sevilla',
    'Cruzcampo',
    'Tapas Sevilla',
    'Molletes',
    'Jamón Ibérico',
    'Marisco Huelva',
  ],
  authors: [{ name: 'Taberna Quimera' }],
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable} scroll-smooth`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && typeof SVGAnimatedString !== 'undefined') {
                var p = SVGAnimatedString.prototype;
                if (!p.slice) p.slice = function() { var s = this.baseVal || ''; return String.prototype.slice.apply(s, arguments); };
                if (!p.split) p.split = function() { var s = this.baseVal || ''; return String.prototype.split.apply(s, arguments); };
                if (!p.indexOf) p.indexOf = function() { var s = this.baseVal || ''; return String.prototype.indexOf.apply(s, arguments); };
                if (!p.includes) p.includes = function() { var s = this.baseVal || ''; return String.prototype.includes.apply(s, arguments); };
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2B2523] selection:bg-[#D4A373]/30 selection:text-[#9E2A2B]">
        {children}
      </body>
    </html>
  );
}
