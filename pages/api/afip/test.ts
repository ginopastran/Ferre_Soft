import { NextApiRequest, NextApiResponse } from "next";
import Afip from "@afipsdk/afip.js";
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Leer los certificados
    const certPath = path.join(process.cwd(), "certs", "csrtest44.cert");
    const keyPath = path.join(process.cwd(), "certs", "keytest.key");

    const cert = fs.readFileSync(certPath, "utf8");
    const key = fs.readFileSync(keyPath, "utf8");

    // Crear instancia de AFIP
    const afip = new Afip({
      CUIT: process.env.AFIP_CUIT || "20461628312",
      cert: cert,
      key: key,
      production: false,
    });

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
