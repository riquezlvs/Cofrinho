import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cofrinho - Início",
  description: "Gerenciador financeiro pessoal inteligente",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark h-full antialiased font-sans">
      <body className="min-h-full w-full bg-black text-white antialiased flex justify-center selection:bg-lime-400 selection:text-black">
        {children}
      </body>
    </html>
  );
}
