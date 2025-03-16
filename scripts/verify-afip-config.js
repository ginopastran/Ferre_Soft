const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function checkEnvironmentVariables() {
  console.log("Verificando variables de entorno...");
  const requiredVars = ["AFIP_CUIT", "AFIP_CERT_PATH", "AFIP_KEY_PATH"];
  const missingVars = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  if (missingVars.length > 0) {
    console.error("❌ Faltan las siguientes variables de entorno:");
    missingVars.forEach((varName) => console.error(`   - ${varName}`));
    return false;
  }

  console.log("✅ Variables de entorno configuradas correctamente");
  return true;
}

function checkCertificates() {
  console.log("\nVerificando certificados...");
  const certPath = path.resolve(
    process.env.AFIP_CERT_PATH || "./certs/cert.pem"
  );
  const keyPath = path.resolve(process.env.AFIP_KEY_PATH || "./certs/key.key");

  if (!fs.existsSync(certPath)) {
    console.error(`❌ No se encontró el certificado en: ${certPath}`);
    return false;
  }

  if (!fs.existsSync(keyPath)) {
    console.error(`❌ No se encontró la clave privada en: ${keyPath}`);
    return false;
  }

  // Verificar formato del certificado
  try {
    execSync(`openssl x509 -in "${certPath}" -text -noout`);
    console.log("✅ Certificado válido");
  } catch (error) {
    console.error("❌ El certificado no tiene un formato válido");
    return false;
  }

  // Verificar formato de la clave privada
  try {
    execSync(`openssl rsa -in "${keyPath}" -check -noout`);
    console.log("✅ Clave privada válida");
  } catch (error) {
    console.error("❌ La clave privada no tiene un formato válido");
    return false;
  }

  return true;
}

function checkResourceFolders() {
  console.log("\nVerificando carpetas de recursos...");
  const folders = ["afip_res", "certs"];

  for (const folder of folders) {
    const folderPath = path.join(process.cwd(), folder);
    if (!fs.existsSync(folderPath)) {
      console.log(`Creando carpeta: ${folder}`);
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  console.log("✅ Carpetas de recursos verificadas");
  return true;
}

function main() {
  console.log("=== Verificación de Configuración AFIP ===\n");

  const envOk = checkEnvironmentVariables();
  const certsOk = checkCertificates();
  const foldersOk = checkResourceFolders();

  console.log("\n=== Resumen ===");
  console.log(`Variables de entorno: ${envOk ? "✅" : "❌"}`);
  console.log(`Certificados: ${certsOk ? "✅" : "❌"}`);
  console.log(`Carpetas de recursos: ${foldersOk ? "✅" : "❌"}`);

  if (!envOk || !certsOk || !foldersOk) {
    console.log(
      "\n❌ La configuración no está completa. Por favor, sigue estos pasos:"
    );
    console.log("\n1. Obtener certificados de AFIP:");
    console.log("   - Ingresar a AFIP con clave fiscal nivel 3");
    console.log('   - Ir a "Administrador de Relaciones de Clave Fiscal"');
    console.log(
      '   - Generar certificado en "Administración de Certificados Digitales"'
    );
    console.log("\n2. Autorizar Web Services:");
    console.log(
      '   - Autorizar el servicio "wsfe" para facturación electrónica'
    );
    console.log("\n3. Configurar variables de entorno:");
    console.log("   AFIP_CUIT=tu_cuit_aqui");
    console.log("   AFIP_CERT_PATH=./certs/cert.pem");
    console.log("   AFIP_KEY_PATH=./certs/key.key");
    console.log("\n4. Colocar los certificados en la carpeta certs/:");
    console.log("   - cert.pem: Certificado público");
    console.log("   - key.key: Clave privada");
    process.exit(1);
  }

  console.log("\n✅ Todo está correctamente configurado");
}

main();
