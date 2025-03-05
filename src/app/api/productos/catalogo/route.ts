import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const productos = await prisma.producto.findMany({
      select: {
        id: true,
        codigo: true,
        descripcion: true,
        precioFinal1: true,
        iva: true,
        imagenUrl: true,
        rubro: true,
      },
      orderBy: {
        rubro: "asc",
      },
    });

    return NextResponse.json(productos);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
