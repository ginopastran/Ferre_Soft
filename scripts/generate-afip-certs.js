/**
 * Script para generar certificados de AFIP usando Node.js crypto
 *
 * Este script genera certificados de prueba para la integración con AFIP
 * sin depender de OpenSSL.
 *
 * Uso:
 * node scripts/generate-afip-certs.js
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

// Crear directorio de certificados si no existe
const certDir = path.join(process.cwd(), "certs");
if (!fs.existsSync(certDir)) {
  fs.mkdirSync(certDir, { recursive: true });
}

// Función para generar certificados de prueba
function generateTestCertificates() {
  console.log("\nGenerando certificados de prueba...");

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

  // Guardar clave privada
  const keyPath = path.join(certDir, "key.key");
  fs.writeFileSync(keyPath, privateKey);
  console.log("✅ Clave privada generada correctamente.");

  // Guardar certificado (usando la clave pública como certificado de prueba)
  const certPath = path.join(certDir, "cert.pem");
  fs.writeFileSync(certPath, publicKey);
  console.log("✅ Certificado de prueba generado correctamente.");

  return {
    keyExists: fs.existsSync(keyPath),
    certExists: fs.existsSync(certPath),
  };
}

// Función principal
function main() {
  console.log("=== Generación de Certificados para AFIP ===");
  console.log(
    "\nEste script genera certificados de prueba para la integración con AFIP."
  );
  console.log("⚠️ NOTA: Estos certificados son solo para pruebas locales.");

  const { keyExists, certExists } = generateTestCertificates();

  console.log("\n=== Resumen ===");
  console.log(`Clave privada: ${keyExists ? "✅ Existe" : "❌ No existe"}`);
  console.log(`Certificado: ${certExists ? "✅ Existe" : "❌ No existe"}`);

  console.log(
    "\n⚠️ IMPORTANTE: Para producción, debe generar un certificado válido a través del sitio de AFIP."
  );
  console.log("\nPasos para producción:");
  console.log("1. Ingresar a https://auth.afip.gob.ar/");
  console.log('2. Ir a "Administrador de Relaciones"');
  console.log('3. Seleccionar "Adherir Servicio" y buscar "Web Services"');
  console.log('4. Seleccionar "WSFE - Factura Electrónica"');
  console.log("5. Subir la clave pública generada");
  console.log(
    "6. Descargar el certificado y guardarlo como cert.pem en la carpeta certs"
  );

  console.log("\nPasos siguientes:");
  console.log("1. Configurar variables de entorno en .env:");
  console.log("   AFIP_CUIT=20000000000");
  console.log("   AFIP_CERT_PATH=./certs/cert.pem");
  console.log("   AFIP_KEY_PATH=./certs/key.key");
}

// Ejecutar función principal
main();
