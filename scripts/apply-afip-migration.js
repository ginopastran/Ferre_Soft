/**
 * Script para aplicar la migración de Prisma para AFIP
 *
 * Este script ejecuta los comandos necesarios para aplicar los cambios
 * al esquema de Prisma y actualizar la base de datos.
 *
 * Uso:
 * node scripts/apply-afip-migration.js
 */

const { execSync } = require("child_process");
const path = require("path");

// Función para ejecutar comandos
function runCommand(command) {
  console.log(`Ejecutando: ${command}`);
  try {
    execSync(command, { stdio: "inherit" });
    return true;
  } catch (error) {
    console.error(`Error al ejecutar: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Función principal
async function main() {
  console.log("Aplicando migración para AFIP...");

  // 1. Generar la migración
  if (!runCommand("npx prisma migrate dev --name add_afip_fields")) {
    console.error("Error al generar la migración. Abortando.");
    return;
  }

  // 2. Generar el cliente de Prisma
  if (!runCommand("npx prisma generate")) {
    console.error("Error al generar el cliente de Prisma. Abortando.");
    return;
  }

  console.log("\n✅ Migración aplicada exitosamente.");
  console.log("\nPasos siguientes:");
  console.log(
    "1. Generar certificados de AFIP: node scripts/generate-afip-certs.js"
  );
  console.log("2. Configurar variables de entorno en .env:");
  console.log("   AFIP_CUIT=20000000000");
  console.log("   AFIP_CERT_PATH=./certs/cert.pem");
  console.log("   AFIP_KEY_PATH=./certs/key.key");
}

// Ejecutar función principal
main().catch((error) => {
  console.error("Error inesperado:", error);
  process.exit(1);
});
