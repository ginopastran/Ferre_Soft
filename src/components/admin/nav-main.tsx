"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavMainProps {
  items: {
    title: string;
    url: string;
    icon: LucideIcon;
  }[];
  activeUrl: string;
}

export function NavMain({ items, activeUrl }: NavMainProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { verifySession } = useAuth();

  const handleNavigation = async (url: string, e: React.MouseEvent) => {
    e.preventDefault();

    try {
      verifySession().catch(console.error);

      router.push(url);
    } catch (error) {
      console.error("Error de navegación:", error);
      router.push("/login");
    }
  };

  return (
    <div className="flex flex-col gap-1 px-3">
      {items.map((item) => (
        <a
          key={item.url}
          href={item.url}
          onClick={(e) => handleNavigation(item.url, e)}
          className={cn(
            "flex h-9 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-200 hover:bg-secondary/20 hover:text-secondary-foreground whitespace-nowrap",
            {
              "bg-primary/10 text-primary":
                pathname === item.url || activeUrl === item.url,
              "text-muted-foreground":
                pathname !== item.url && activeUrl !== item.url,
            }
          )}
        >
          <item.icon className="h-5 w-5" />
          <span className="font-medium">{item.title}</span>
        </a>
      ))}
    </div>
  );
}
