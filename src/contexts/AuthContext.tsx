"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface User {
  id: number;
  email: string;
  nombre: string;
  sucursalId: number;
  rol: {
    id: number;
    nombre: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  updateUser: (user: AuthContextType["user"]) => void;
  verifySession: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  updateUser: () => {},
  verifySession: async () => false,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Determinar si estamos en una ruta pública
  const isPublicRoute = pathname
    ? ["/login", "/register", "/offline", "/catalogo", "/catalogo-tabla"].some(
        (route) => pathname === route || pathname.startsWith(`${route}/`)
      )
    : false;

  const updateUser = (newUser: AuthContextType["user"]) => {
    setUser(newUser);
  };

  // Función para verificar y actualizar el estado de la sesión
  const verifySession = async (): Promise<boolean> => {
    try {
      // Si estamos en una ruta pública, no es necesario verificar
      if (isPublicRoute) {
        return !!user;
      }

      const response = await fetch("/api/auth/session", {
        credentials: "include",
        headers: {
          "X-App-ID": process.env.NEXT_PUBLIC_APP_ID || "",
          "Cache-Control": "no-cache, no-store",
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.user) {
          setUser(data.user);
          return true;
        } else {
          setUser(null);
          return false;
        }
      } else {
        setUser(null);
        return false;
      }
    } catch (error) {
      console.error("Error verificando sesión:", error);
      // En caso de error en rutas públicas, permitir continuar
      if (isPublicRoute) {
        return true;
      }
      setUser(null);
      return false;
    }
  };

  // Función para cerrar sesión
  const logout = async (): Promise<void> => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      router.push("/login");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  // Efecto para verificar la sesión al cargar inicialmente
  useEffect(() => {
    async function loadUserFromSession() {
      try {
        await verifySession();
      } catch (error) {
        console.error("Error loading user session:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserFromSession();
  }, []);

  // Efecto para revalidar la sesión cuando cambia la ruta
  useEffect(() => {
    // Si estamos volviendo de una ruta pública a una protegida, verificar la sesión
    if (!isPublicRoute) {
      verifySession().catch((error) => {
        console.error("Error al revalidar sesión en cambio de ruta:", error);
      });
    }
  }, [pathname]);

  return (
    <AuthContext.Provider
      value={{ user, loading, updateUser, verifySession, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
