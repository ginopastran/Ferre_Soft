"use client";

import { LogOut, ChevronsUpDown, Bot } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import Image from "next/image";

export function NavUser() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const { user } = useAuth();
  const pathname = usePathname();
  const isAdmin = user?.rol?.nombre === "ADMIN";
  const isSuperAdmin = user?.rol?.nombre === "SUPERADMIN";

  if (!user) return null;

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Error al cerrar sesión");

      // Limpiar cookies del cliente
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
      document.cookie =
        "userData=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

      router.push("/login");
      toast.success("Sesión cerrada exitosamente");
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      toast.error("Error al cerrar sesión");
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isAdmin ||
          (isSuperAdmin && (
            <Link href={"/admin/paltai"}>
              <SidebarMenuButton
                tooltip={"Chat Paltai"}
                className={`group-data-[collapsible=icon]:!p-1.5 flex items-center text-base [&>svg]:size-5 hover:bg-indigo-gradient hover:text-white transition-all duration-300 ease-in-out active:bg-indigo-600 active:text-white py-5 mb-1 ${
                  pathname === "/admin/paltai"
                    ? "font-medium text-white bg-indigo-gradient"
                    : " text-muted-foreground"
                }`}
              >
                {<Bot />}
                {"Chat Palt.AI"}
              </SidebarMenuButton>
            </Link>
          ))}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg text-white">
                <AvatarFallback className="rounded-lg bg-indigo-gradient">
                  {user.nombre.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user.nombre}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg bg-indigo-gradient text-white">
                    {user.nombre.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user.nombre}</span>
                  <span className="truncate text-xs">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className=" cursor-pointer bg-cancel-gradient text-white hover:text-white focus:text-white"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
