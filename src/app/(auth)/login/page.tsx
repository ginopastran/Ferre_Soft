"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useOfflineAuth } from "@/hooks/useOfflineAuth";
import { useOfflineMode } from "@/contexts/OfflineModeContext";

export default function LoginPage() {
  const router = useRouter();
  const { updateUser } = useAuth();
  const { saveOfflineCredentials } = useOfflineAuth();
  const { isOnline } = useOfflineMode();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email) {
      newErrors.email = "El email es requerido";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email inválido";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "La contraseña es requerida";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (!isOnline) {
        const stored = localStorage.getItem("offlineCredentials");
        if (stored) {
          const credentials = JSON.parse(stored);
          if (credentials.email === email) {
            updateUser(credentials.user);
            console.log(
              "Redirigiendo a:",
              credentials.user.rol.nombre === "ADMIN"
                ? "/admin/reporte"
                : "/admin/ventas"
            );
            router.push(
              credentials.user.rol.nombre === "ADMIN"
                ? "/admin/reporte"
                : "/admin/ventas"
            );
            return;
          }
        }
        toast.error("No hay credenciales guardadas para modo offline");
        setIsLoading(false);
        return;
      }

      console.log("Iniciando sesión con:", email);
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-App-ID": process.env.NEXT_PUBLIC_APP_ID || "",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Error en el login");
      }

      const data = await response.json();
      console.log("Login exitoso, obteniendo sesión...");

      const sessionResponse = await fetch("/api/auth/session", {
        headers: {
          "X-App-ID": process.env.NEXT_PUBLIC_APP_ID || "",
        },
      });

      if (!sessionResponse.ok) {
        throw new Error("Error al obtener la sesión");
      }

      const sessionData = await sessionResponse.json();
      console.log("Datos de sesión:", sessionData);

      if (!sessionData.user) {
        throw new Error("No se pudo obtener la información del usuario");
      }

      saveOfflineCredentials({
        email,
        user: sessionData.user,
      });

      updateUser(sessionData.user);

      const redirectPath =
        sessionData.user.rol.nombre === "ADMIN"
          ? "/admin/reporte"
          : "/admin/ventas";
      console.log("Redirigiendo a:", redirectPath);

      // Esperar un momento para que se actualice el estado
      setTimeout(() => {
        router.push(redirectPath);
      }, 100);
    } catch (error) {
      console.error("Error en login:", error);
      toast.error("Error al iniciar sesión", {
        description: "Verifica tus credenciales e intenta nuevamente",
      });
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-indigo-gradient">
            Iniciar Sesión
          </h1>
          <p className="text-gray-500">
            Ingresa tus credenciales para acceder al sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Contraseña</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-gradient"
            disabled={isLoading}
          >
            {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </Button>
        </form>

        <div className="text-center text-sm">
          ¿No tienes una cuenta?{" "}
          <Link href="/register" className="text-indigo-600 hover:underline">
            Regístrate aquí
          </Link>
        </div>
      </div>
    </div>
  );
}
