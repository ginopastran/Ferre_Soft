"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  updateUser: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);

  const updateUser = (newUser: AuthContextType["user"]) => {
    setUser(newUser);
  };

  useEffect(() => {
    async function loadUserFromSession() {
      try {
        const response = await fetch("/api/auth/session", {
          credentials: "include",
          headers: {
            "X-App-ID": process.env.NEXT_PUBLIC_APP_ID || "",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error loading user session:", error);
      } finally {
        setLoading(false);
      }
    }

    loadUserFromSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
