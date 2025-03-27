import { NextApiRequest, NextApiResponse } from "next";
import { forceNewTokenAuthorization } from "@/lib/afip";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Solo permitir solicitudes POST por seguridad
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Intentar regenerar el token
    const result = await forceNewTokenAuthorization();

    if (result) {
      return res.status(200).json({
        status: "OK",
        message: "Token de Acceso (TA) regenerado exitosamente",
      });
    } else {
      return res.status(500).json({
        status: "ERROR",
        message: "No se pudo regenerar el Token de Acceso (TA)",
      });
    }
  } catch (error) {
    console.error(
      "Error al procesar solicitud de regeneración de token:",
      error
    );
    return res.status(500).json({
      status: "ERROR",
      message: "Error al regenerar el Token de Acceso",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
