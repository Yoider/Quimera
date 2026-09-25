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
      <body className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#2B2523] selection:bg-[#D4A373]/30 selection:text-[#9E2A2B]">
        {children}
      </body>
    </html>
  );
}
