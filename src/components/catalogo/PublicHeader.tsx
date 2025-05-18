"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, Grid, LayoutGrid } from "lucide-react";

export function PublicHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-cyan-600">
              FerreSoft
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-4">
            <Link
              href="/catalogo"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === "/catalogo"
                  ? "bg-cyan-100 text-cyan-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Catálogo Tarjetas
              </div>
            </Link>
            <Link
              href="/catalogo-tabla"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === "/catalogo-tabla"
                  ? "bg-cyan-100 text-cyan-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                Catálogo Tabla
              </div>
            </Link>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/catalogo"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === "/catalogo"
                  ? "bg-cyan-100 text-cyan-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <LayoutGrid className="h-4 w-4 mr-2" />
                Catálogo Tarjetas
              </div>
            </Link>
            <Link
              href="/catalogo-tabla"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                pathname === "/catalogo-tabla"
                  ? "bg-cyan-100 text-cyan-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Grid className="h-4 w-4 mr-2" />
                Catálogo Tabla
              </div>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
