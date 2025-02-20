"use client";
import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import { OfflineModeProvider } from "@/contexts/OfflineModeContext";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const registerSW = async () => {
      try {
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker registrado:", registration);
        }
      } catch (error) {
        console.error("Error al registrar el Service Worker:", error);
      }
    };

    registerSW();
  }, []);

  return (
    <AuthProvider>
      <OfflineModeProvider>
        <Toaster richColors position="top-center" theme="light" />
        {children}
      </OfflineModeProvider>
    </AuthProvider>
  );
}
