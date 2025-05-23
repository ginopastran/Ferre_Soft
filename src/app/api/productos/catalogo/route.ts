import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const getAllProducts = searchParams.get("all") === "true";

    if (getAllProducts) {
      const productos = await prisma.producto.findMany({
        where: {
          OR: [
            { codigo: { contains: search, mode: "insensitive" } },
            { descripcion: { contains: search, mode: "insensitive" } },
            { rubro: { contains: search, mode: "insensitive" } },
          ],
        },
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
          codigo: "asc",
        },
      });

      return NextResponse.json({
        productos,
        total: productos.length,
        hasMore: false,
      });
    }

    const skip = (page - 1) * limit;

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where: {
          OR: [
            { codigo: { contains: search, mode: "insensitive" } },
            { descripcion: { contains: search, mode: "insensitive" } },
            { rubro: { contains: search, mode: "insensitive" } },
          ],
        },
        select: {
          id: true,
          codigo: true,
          descripcion: true,
          precioFinal1: true,
          iva: true,
          imagenUrl: true,
          rubro: true,
        },
        skip,
        take: limit,
        orderBy: {
          codigo: "asc",
        },
      }),
      prisma.producto.count({
        where: {
          OR: [
            { codigo: { contains: search, mode: "insensitive" } },
            { descripcion: { contains: search, mode: "insensitive" } },
            { rubro: { contains: search, mode: "insensitive" } },
          ],
        },
      }),
    ]);

    return NextResponse.json({
      productos,
      total,
      hasMore: skip + productos.length < total,
    });
  } catch (error) {
    console.error("Error al obtener productos:", error);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
