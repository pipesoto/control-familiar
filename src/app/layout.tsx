import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/layout/BottomNav";
import { FloatingAddButton } from "@/components/layout/FloatingAddButton";

export const metadata: Metadata = {
  title: "SaludFamiliar - Controles médicos",
  description: "Gestiona los controles médicos de tu familia en un solo lugar.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c97b9a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="mx-auto max-w-lg min-h-screen pb-20">
          <main className="px-4 pt-4 pb-6">{children}</main>
        </div>
        <FloatingAddButton />
        <BottomNav />
      </body>
    </html>
  );
}
