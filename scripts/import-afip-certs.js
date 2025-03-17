// Este script importa los certificados de AFIP a la base de datos

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function importCerts() {
  console.log("Iniciando importación de certificados AFIP...");

  try {
    // Leer las variables de entorno para las rutas de los certificados
    const certPath = process.env.AFIP_CERT_PATH || "certs/csrtest44.crt";
    const keyPath = process.env.AFIP_KEY_PATH || "certs/keytest.key";

    console.log(`Leyendo certificado de: ${certPath}`);
    console.log(`Leyendo clave privada de: ${keyPath}`);

    // Comprobar si los archivos existen
    if (!fs.existsSync(certPath)) {
      throw new Error(`El archivo de certificado no existe: ${certPath}`);
    }

    if (!fs.existsSync(keyPath)) {
      throw new Error(`El archivo de clave privada no existe: ${keyPath}`);
    }

    // Leer contenido de los archivos
    const certContent = fs.readFileSync(certPath, "utf8");
    const keyContent = fs.readFileSync(keyPath, "utf8");

    // Comprobar si ya existen certificados con estos nombres
    const existingCert = await prisma.afipCertificate.findFirst({
      where: {
        name: path.basename(certPath),
        type: "CERT",
      },
    });

    const existingKey = await prisma.afipCertificate.findFirst({
      where: {
        name: path.basename(keyPath),
        type: "KEY",
      },
    });

    // Desactivar certificados y claves existentes
    await prisma.afipCertificate.updateMany({
      where: {
        OR: [
          { type: "CERT", isActive: true },
          { type: "KEY", isActive: true },
        ],
      },
      data: {
        isActive: false,
      },
    });

    // Crear o actualizar el certificado
    if (existingCert) {
      console.log(
        `Actualizando certificado existente: ${path.basename(certPath)}`
      );
      await prisma.afipCertificate.update({
        where: { id: existingCert.id },
        data: {
          content: certContent,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      console.log(`Creando nuevo certificado: ${path.basename(certPath)}`);
      await prisma.afipCertificate.create({
        data: {
          name: path.basename(certPath),
          content: certContent,
          type: "CERT",
          description: "Certificado importado desde script",
          isActive: true,
        },
      });
    }

    // Crear o actualizar la clave
    if (existingKey) {
      console.log(`Actualizando clave existente: ${path.basename(keyPath)}`);
      await prisma.afipCertificate.update({
        where: { id: existingKey.id },
        data: {
          content: keyContent,
          isActive: true,
          updatedAt: new Date(),
        },
      });
    } else {
      console.log(`Creando nueva clave: ${path.basename(keyPath)}`);
      await prisma.afipCertificate.create({
        data: {
          name: path.basename(keyPath),
          content: keyContent,
          type: "KEY",
          description: "Clave privada importada desde script",
          isActive: true,
        },
      });
    }

    console.log("Certificados importados correctamente a la base de datos");
  } catch (error) {
    console.error("Error al importar certificados:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la función
importCerts();
