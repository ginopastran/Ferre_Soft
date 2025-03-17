import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

// Helper para leer un archivo como texto
const readFileAsText = (filePath: string): string => {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error al leer el archivo ${filePath}:`, error);
    throw new Error(`No se pudo leer el archivo: ${filePath}`);
  }
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // GET - Obtener todos los certificados o uno específico
  if (req.method === "GET") {
    try {
      const { id, type } = req.query;

      // Si se proporciona un ID, obtener un certificado específico
      if (id) {
        const certificate = await prisma.afipCertificate.findUnique({
          where: { id: Number(id) },
        });

        if (!certificate) {
          return res.status(404).json({ error: "Certificado no encontrado" });
        }

        return res.status(200).json(certificate);
      }

      // Si se proporciona un tipo, filtrar por tipo
      let whereClause = {};
      if (type) {
        whereClause = { type: type as string };
      }

      // Obtener todos los certificados (o filtrados por tipo)
      const certificates = await prisma.afipCertificate.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json(certificates);
    } catch (error) {
      console.error("Error al obtener certificados:", error);
      return res.status(500).json({ error: "Error al obtener certificados" });
    }
  }

  // POST - Subir un nuevo certificado
  if (req.method === "POST") {
    try {
      const { name, content, description, type } = req.body;

      if (!name || !content || !type) {
        return res.status(400).json({
          error: "Faltan datos requeridos",
          details: { name: !name, content: !content, type: !type },
        });
      }

      // Validar el tipo
      if (type !== "CERT" && type !== "KEY") {
        return res.status(400).json({
          error: "Tipo de certificado inválido",
          details: "El tipo debe ser 'CERT' o 'KEY'",
        });
      }

      // Verificar si ya existe un certificado con el mismo nombre
      const existingCert = await prisma.afipCertificate.findUnique({
        where: { name },
      });

      if (existingCert) {
        return res.status(400).json({
          error: "Ya existe un certificado con ese nombre",
        });
      }

      // Crear el nuevo certificado
      const certificate = await prisma.afipCertificate.create({
        data: {
          name,
          content,
          description,
          type,
          isActive: true,
        },
      });

      return res.status(201).json(certificate);
    } catch (error) {
      console.error("Error al crear certificado:", error);
      return res.status(500).json({ error: "Error al crear el certificado" });
    }
  }

  // PUT - Actualizar un certificado existente
  if (req.method === "PUT") {
    try {
      const { id, isActive, description } = req.body;

      if (!id) {
        return res.status(400).json({ error: "Falta el ID del certificado" });
      }

      // Sólo permitimos actualizar isActive y description
      const updateData: any = {};
      if (isActive !== undefined) updateData.isActive = isActive;
      if (description !== undefined) updateData.description = description;

      const certificate = await prisma.afipCertificate.update({
        where: { id: Number(id) },
        data: updateData,
      });

      return res.status(200).json(certificate);
    } catch (error) {
      console.error("Error al actualizar certificado:", error);
      return res
        .status(500)
        .json({ error: "Error al actualizar el certificado" });
    }
  }

  // DELETE - Eliminar un certificado
  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id) {
        return res.status(400).json({ error: "Falta el ID del certificado" });
      }

      await prisma.afipCertificate.delete({
        where: { id: Number(id) },
      });

      return res
        .status(200)
        .json({ message: "Certificado eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar certificado:", error);
      return res
        .status(500)
        .json({ error: "Error al eliminar el certificado" });
    }
  }

  // PATCH - Importar certificados desde los archivos
  if (req.method === "PATCH" && req.query.action === "import") {
    try {
      // 1. Leer los certificados desde los archivos
      const certPath = path.join(process.cwd(), "certs", "csrtest44.crt");
      const keyPath = path.join(process.cwd(), "certs", "keytest.key");

      const certContent = readFileAsText(certPath);
      const keyContent = readFileAsText(keyPath);

      // 2. Verificar si ya existen certificados activos
      const existingCerts = await prisma.afipCertificate.findMany({
        where: {
          OR: [
            { name: "csrtest44.crt", type: "CERT" },
            { name: "keytest.key", type: "KEY" },
          ],
        },
      });

      // 3. Si ya existen, los desactivamos
      if (existingCerts.length > 0) {
        for (const cert of existingCerts) {
          await prisma.afipCertificate.update({
            where: { id: cert.id },
            data: { isActive: false },
          });
        }
      }

      // 4. Importar el certificado
      const certResult = await prisma.afipCertificate.create({
        data: {
          name: "csrtest44.crt",
          content: certContent,
          type: "CERT",
          description: "Certificado importado desde archivos locales",
          isActive: true,
        },
      });

      // 5. Importar la clave privada
      const keyResult = await prisma.afipCertificate.create({
        data: {
          name: "keytest.key",
          content: keyContent,
          type: "KEY",
          description: "Clave privada importada desde archivos locales",
          isActive: true,
        },
      });

      return res.status(200).json({
        message: "Certificados importados correctamente",
        certificados: [certResult, keyResult],
      });
    } catch (error) {
      console.error("Error al importar certificados:", error);
      return res
        .status(500)
        .json({ error: "Error al importar los certificados" });
    }
  }

  return res.status(405).json({ message: "Método no permitido" });
}
