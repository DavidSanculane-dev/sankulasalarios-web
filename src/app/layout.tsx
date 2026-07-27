import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Configuração da fonte oficial para um visual limpo e corporativo
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "sankulaSalarios — Consola de Assiduidade",
  description: "Sistema de gestão de assiduidade multi-terminal (ZKTeco, Hikvision, Suprema)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (

    <html lang="pt" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <body className="h-full bg-slate-50 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
