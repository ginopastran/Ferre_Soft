"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Building2,
  ChartPie,
  Command,
  Frame,
  GalleryVerticalEnd,
  History,
  Map,
  Package,
  PieChart,
  Settings2,
  SquareTerminal,
  Users,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { TeamSwitcher } from "./team-switcher";
import { NavMain } from "./nav-main";
import { NavProjects } from "./nav-projects";
import { NavUser } from "./nav-user";

// This is sample data.
const data = {
  teams: [
    {
      name: "Andex Tech",
      logo: GalleryVerticalEnd,
      plan: "FerreSoft",
    },
  ],
  navMain: [
    {
      title: "Reporte",
      url: "/admin/reporte",
      icon: ChartPie,
    },
    {
      title: "Clientes",
      url: "/admin/clientes",
      icon: Users,
    },
    {
      title: "Productos",
      url: "/admin/productos",
      icon: Package,
    },
    {
      title: "Proveedores",
      url: "/admin/proveedores",
      icon: Building2,
    },
    // {
    //   title: "Historial",
    //   url: "/admin/historial",
    //   icon: History,
    // },
    // {
    //   title: "Sucursales",
    //   url: "/admin/sucursales",
    //   icon: Building2,
    // },
    {
      title: "Ventas",
      url: "/admin/ventas",
      icon: Receipt,
    },
    {
      title: "Vendedores",
      url: "/admin/vendedores",
      icon: Users,
    },
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: Settings2,
    // },
  ],
};

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeUrl: string;
}

export function AppSidebar({ activeUrl, ...props }: AppSidebarProps) {
  const { user } = useAuth();
  const isVendedor = user?.rol?.nombre === "VENDEDOR";

  const navItems = useMemo(() => {
    if (isVendedor) {
      // Mostrar solo la opción de ventas para vendedores
      return [
        {
          title: "Ventas",
          url: "/admin/ventas",
          icon: Receipt,
        },
      ];
    }

    // Mostrar todas las opciones para administradores
    return [
      {
        title: "Reporte",
        url: "/admin/reporte",
        icon: ChartPie,
      },
      {
        title: "Clientes",
        url: "/admin/clientes",
        icon: Users,
      },
      {
        title: "Productos",
        url: "/admin/productos",
        icon: Package,
      },
      {
        title: "Proveedores",
        url: "/admin/proveedores",
        icon: Building2,
      },
      {
        title: "Ventas",
        url: "/admin/ventas",
        icon: Receipt,
      },
      {
        title: "Vendedores",
        url: "/admin/vendedores",
        icon: Users,
      },
    ];
  }, [isVendedor]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} activeUrl={activeUrl} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
