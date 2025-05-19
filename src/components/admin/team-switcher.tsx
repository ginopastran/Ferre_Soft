"use client";

import * as React from "react";
import { ChevronsUpDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Image from "next/image";

export function TeamSwitcher({
  teams,
}: {
  teams: {
    name: string;
    logo: React.ElementType;
    plan: string;
  }[];
}) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex aspect-square size-8 items-center justify-center  text-sidebar-primary-foreground">
            {/* <activeTeam.logo className="size-4" /> */}
            <Image
              src="/andes-logo.jpeg"
              alt="logo"
              width={120}
              height={120}
              className=" rounded-lg"
            />
          </div>
          <div className="grid flex-1 text-left text-cyan-gradient text-lg font-bold tracking-tighter uppercase">
            {/* <span className="truncate font-semibold">{activeTeam.name}</span>
            <span className="truncate text-xs">{activeTeam.plan}</span> */}
            Andes Fueguinos
            {/* <Image src="/andes-logo.jpg" alt="logo" width={100} height={100} /> */}
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
