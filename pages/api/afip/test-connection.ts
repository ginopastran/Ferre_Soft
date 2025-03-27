import { NextApiRequest, NextApiResponse } from "next";
import { getAfipInstance, verificarConexion } from "@/lib/afip";
import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const results: Record<string, any> = {
    environment: process.env.NODE_ENV || "unknown",
    timestamp: new Date().toISOString(),
    steps: [],
    config: {
      afipCuit: process.env.AFIP_CUIT || "no configurado",
      certPath: process.env.AFIP_CERT_PATH || "no configurado",
      keyPath: process.env.AFIP_KEY_PATH || "no configurado",
    },
  };

  try {
    // Paso 1: Verificar conexión
    try {
      results.steps.push({
        step: "Verificar conexión básica",
        status: "INICIADO",
      });
      const conectado = await verificarConexion();
      results.steps[0].status = conectado ? "OK" : "ERROR";
      results.steps[0].result = conectado;
    } catch (error) {
      results.steps[0].status = "ERROR";
      results.steps[0].error =
        error instanceof Error ? error.message : "Error desconocido";
    }

    // Paso 2: Verificar certificados en base de datos
    try {
      results.steps.push({
        step: "Verificar certificados en DB",
        status: "INICIADO",
      });

      const certFromDB = await prisma.afipCertificate.findFirst({
        where: { type: "CERT", isActive: true },
        orderBy: { createdAt: "desc" },
      });

      const keyFromDB = await prisma.afipCertificate.findFirst({
        where: { type: "KEY", isActive: true },
        orderBy: { createdAt: "desc" },
      });

      results.steps[1].dbCertificates = {
        certExists: !!certFromDB,
        keyExists: !!keyFromDB,
        certCreatedAt: certFromDB?.createdAt || null,
        keyCreatedAt: keyFromDB?.createdAt || null,
        certLength: certFromDB ? certFromDB.content.length : 0,
        keyLength: keyFromDB ? keyFromDB.content.length : 0,
        certPreview: certFromDB
          ? certFromDB.content.substring(0, 50) + "..."
          : null,
        keyPreview: keyFromDB
          ? keyFromDB.content.substring(0, 50) + "..."
          : null,
      };

      results.steps[1].status = certFromDB && keyFromDB ? "OK" : "ADVERTENCIA";
    } catch (error) {
      results.steps[1].status = "ERROR";
      results.steps[1].error =
        error instanceof Error ? error.message : "Error desconocido";
    }

    // Paso 3: Verificar certificados en archivos
    try {
      results.steps.push({
        step: "Verificar certificados en archivos",
        status: "INICIADO",
      });

      // Comprobar rutas por defecto
      const defaultCertPath = path.join(process.cwd(), "certs/csrtest44.crt");
      const defaultKeyPath = path.join(process.cwd(), "certs/keytest.key");

      // Comprobar rutas de env
      const envCertPath = process.env.AFIP_CERT_PATH || "";
      const envKeyPath = process.env.AFIP_KEY_PATH || "";

      // Verificar cada ubicación
      const defaultCertExists = fs.existsSync(defaultCertPath);
      const defaultKeyExists = fs.existsSync(defaultKeyPath);
      const envCertExists = envCertPath && fs.existsSync(envCertPath);
      const envKeyExists = envKeyPath && fs.existsSync(envKeyPath);

      results.steps[2].filesCertificates = {
        defaultPaths: {
          certPath: defaultCertPath,
          keyPath: defaultKeyPath,
          certExists: defaultCertExists,
          keyExists: defaultKeyExists,
          certContent: defaultCertExists
            ? fs.readFileSync(defaultCertPath, "utf8").substring(0, 50) + "..."
            : null,
          keyContent: defaultKeyExists
            ? fs.readFileSync(defaultKeyPath, "utf8").substring(0, 50) + "..."
            : null,
        },
        envPaths: {
          certPath: envCertPath || "no configurado",
          keyPath: envKeyPath || "no configurado",
          certExists: envCertExists,
          keyExists: envKeyExists,
          certContent: envCertExists
            ? fs.readFileSync(envCertPath, "utf8").substring(0, 50) + "..."
            : null,
          keyContent: envKeyExists
            ? fs.readFileSync(envKeyPath, "utf8").substring(0, 50) + "..."
            : null,
        },
      };

      results.steps[2].status =
        (defaultCertExists && defaultKeyExists) ||
        (envCertExists && envKeyExists)
          ? "OK"
          : "ADVERTENCIA";
    } catch (error) {
      results.steps[2].status = "ERROR";
      results.steps[2].error =
        error instanceof Error ? error.message : "Error desconocido";
    }

    // Paso 4: Verificar certificados en node_modules
    try {
      results.steps.push({
        step: "Verificar certificados en node_modules",
        status: "INICIADO",
      });

      // Comprobar las rutas de certificados de node_modules
      const basePath = path.join(
        process.cwd(),
        "node_modules",
        "@afipsdk",
        "afip.js",
        "Afip_res"
      );
      const certPath = path.join(basePath, "cert");
      const keyPath = path.join(basePath, "key");

      const basePathExists = fs.existsSync(basePath);
      const certExists = fs.existsSync(certPath);
      const keyExists = fs.existsSync(keyPath);

      let certContent = null;
      let keyContent = null;

      if (certExists) {
        try {
          certContent =
            fs.readFileSync(certPath, "utf8").substring(0, 50) + "...";
        } catch (err) {
          certContent =
            "Error al leer: " +
            (err instanceof Error ? err.message : String(err));
        }
      }

      if (keyExists) {
        try {
          keyContent =
            fs.readFileSync(keyPath, "utf8").substring(0, 50) + "...";
        } catch (err) {
          keyContent =
            "Error al leer: " +
            (err instanceof Error ? err.message : String(err));
        }
      }

      results.steps[3].nodeCertificates = {
        basePath,
        basePathExists,
        certPath,
        keyPath,
        certExists,
        keyExists,
        certContent,
        keyContent,
      };

      // Verificar permisos
      if (basePathExists) {
        try {
          const stats = fs.statSync(basePath);
          results.steps[3].nodeCertificates.permissions = {
            isDirectory: stats.isDirectory(),
            mode: stats.mode.toString(8),
            uid: stats.uid,
            gid: stats.gid,
          };
        } catch (err) {
          results.steps[3].nodeCertificates.permissions = {
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }

      results.steps[3].status = certExists && keyExists ? "OK" : "ADVERTENCIA";
    } catch (error) {
      results.steps[3].status = "ERROR";
      results.steps[3].error =
        error instanceof Error ? error.message : "Error desconocido";
    }

    // Paso 5: Obtener instancia de AFIP
    try {
      results.steps.push({
        step: "Obtener instancia AFIP",
        status: "INICIADO",
      });
      const afip = await getAfipInstance();
      results.steps[4].status = afip ? "OK" : "ERROR";
      results.steps[4].result = afip
        ? "Instancia obtenida correctamente"
        : "No se pudo obtener la instancia";
    } catch (error) {
      results.steps[4].status = "ERROR";
      results.steps[4].error =
        error instanceof Error ? error.message : "Error desconocido";
    }

    // Paso 6: Probar estado del servidor
    try {
      results.steps.push({
        step: "Estado del servidor AFIP",
        status: "INICIADO",
      });
      const afip = await getAfipInstance();

      if (!afip) {
        results.steps[5].status = "ERROR";
        results.steps[5].error = "No se pudo obtener la instancia de AFIP";
      } else {
        try {
          const serverStatus = await afip.ElectronicBilling.getServerStatus();
          results.steps[5].status = "OK";
          results.steps[5].result = serverStatus;
        } catch (error) {
          results.steps[5].status = "ERROR";
          results.steps[5].error =
            error instanceof Error ? error.message : "Error desconocido";
        }
      }
    } catch (error) {
      results.steps[5].status = "ERROR";
      results.steps[5].error =
        error instanceof Error ? error.message : "Error desconocido";
    }

    // Paso 7: Probar tipos de alícuotas
    try {
      results.steps.push({
        step: "Obtener tipos de alícuotas",
        status: "INICIADO",
      });
      const afip = await getAfipInstance();

      if (!afip) {
        results.steps[6].status = "ERROR";
        results.steps[6].error = "No se pudo obtener la instancia de AFIP";
      } else {
        try {
          const aliquotTypes = await afip.ElectronicBilling.getAliquotTypes();
          results.steps[6].status = "OK";
          results.steps[6].result =
            aliquotTypes && aliquotTypes.length > 0
              ? `${aliquotTypes.length} tipos encontrados`
              : "Sin resultados";
        } catch (error) {
          results.steps[6].status = "ERROR";
          results.steps[6].error =
            error instanceof Error ? error.message : "Error desconocido";

          // Intentar obtener un diagnóstico más detallado
          if (
            error instanceof Error &&
            error.message.includes("Request failed")
          ) {
            try {
              // Intento directo con un método más simple para diagnosticar
              const statusResult =
                await afip.ElectronicBilling.getServerStatus();
              results.steps[6].diagnostico = {
                serverStatusFunciona: !!statusResult,
                statusResult,
              };
            } catch (innerError) {
              results.steps[6].diagnostico = {
                intentoAlternativo: "Error también en getServerStatus",
                error:
                  innerError instanceof Error
                    ? innerError.message
                    : String(innerError),
              };
            }
          }
        }
      }
    } catch (error) {
      results.steps[6].status = "ERROR";
      results.steps[6].error =
        error instanceof Error ? error.message : "Error desconocido";
    }

    return res.status(200).json(results);
  } catch (error) {
    console.error("Error al ejecutar prueba de conexión con AFIP:", error);
    return res.status(500).json({
      status: "ERROR",
      message: "Error al ejecutar prueba de conexión con AFIP",
      error: error instanceof Error ? error.message : "Error desconocido",
      results,
    });
  }
}
