const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();

async function generateAndImportCerts() {
  console.log("Generando y cargando certificados de prueba para AFIP...");

  try {
    // Generar par de claves
    const { privateKey, publicKey } = crypto.generateKeyPairSync("rsa", {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });

    // Desactivar certificados existentes
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

    // Crear certificado
    await prisma.afipCertificate.create({
      data: {
        name: "test.crt",
        content: publicKey,
        type: "CERT",
        description: "Certificado de prueba generado automáticamente",
        isActive: true,
      },
    });

    // Crear clave privada
    await prisma.afipCertificate.create({
      data: {
        name: "test.key",
        content: privateKey,
        type: "KEY",
        description: "Clave privada de prueba generada automáticamente",
        isActive: true,
      },
    });

    console.log("✅ Certificados generados y cargados correctamente");
  } catch (error) {
    console.error("Error al generar y cargar certificados:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
generateAndImportCerts()
  .then(() => {
    console.log("\nPasos siguientes:");
    console.log("1. Configurar el CUIT en las variables de entorno de Vercel:");
    console.log("   AFIP_CUIT=tu_cuit_aqui");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error en el script:", error);
    process.exit(1);
  });
