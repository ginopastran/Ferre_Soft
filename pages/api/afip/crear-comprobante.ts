import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const comprobante = req.body;

    if (!comprobante) {
      return res
        .status(400)
        .json({ error: "Datos del comprobante requeridos" });
    }

    // En una implementación real, aquí se haría la llamada a la API de AFIP
    // Por ahora, simulamos una respuesta exitosa

    // Generar un CAE aleatorio de 14 dígitos
    const cae = Math.floor(Math.random() * 10000000000000)
      .toString()
      .padStart(14, "0");

    // Fecha de vencimiento del CAE (10 días después de la fecha actual)
    const fechaActual = new Date();
    const fechaVencimiento = new Date(fechaActual);
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 10);
    const vencimientoCae = fechaVencimiento
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    // Devolver la respuesta simulada
    return res.status(200).json({
      cae,
      vencimientoCae,
      numero: comprobante.CbteDesde,
      resultado: "A", // Aprobado
      mensaje: "Comprobante aprobado",
    });
  } catch (error) {
    console.error("Error al crear el comprobante en AFIP:", error);
    return res.status(500).json({
      error: "Error interno del servidor",
      details: error instanceof Error ? error.message : "Error desconocido",
    });
  }
}
