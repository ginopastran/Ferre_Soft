import { NextApiRequest, NextApiResponse } from "next";
import { getAfipInstance } from "@/lib/afip";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Usar la función actualizada para obtener la instancia AFIP
    const afip = await getAfipInstance();

    if (!afip) {
      throw new Error("No se pudo inicializar la conexión con AFIP");
    }

    // Verificar el estado del servidor
    const serverStatus = await afip.ElectronicBilling.getServerStatus();

    return res.status(200).json({
      status: "OK",
      serverStatus,
      message: "Conexión con AFIP establecida correctamente",
    });
  } catch (error) {
    console.error("Error al verificar conexión con AFIP:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Error al verificar conexión con AFIP",
      error: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
