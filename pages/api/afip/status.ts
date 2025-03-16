import { NextApiRequest, NextApiResponse } from "next";
import { verificarConexion } from "@/lib/afip";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const conectado = await verificarConexion();

    if (conectado) {
      return res.status(200).json({
        status: "OK",
        message: "Conexión con AFIP establecida correctamente",
      });
    } else {
      return res.status(503).json({
        status: "ERROR",
        message: "No se pudo establecer conexión con AFIP",
      });
    }
  } catch (error) {
    console.error("Error al verificar conexión con AFIP:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Error al verificar conexión con AFIP",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
