import { useRouter } from "next/navigation";
import { toast } from "sonner";

export const SignOutForm = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
      });

      if (!response.ok) throw new Error("Error al cerrar sesión");

      router.push("/login");
      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-left px-1 py-0.5 text-red-500"
    >
      Sign out
    </button>
  );
};
