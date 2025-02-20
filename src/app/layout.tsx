import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ClientLayout } from "@/components/client-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FerreSoft",
  description: "Sistema de gestión de ventas y stock",
  manifest: "/manifest.json",
  icons: {
    apple: "/web-app-manifest-192x192.png",
    icon: "/web-app-manifest-512x512.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.className} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
