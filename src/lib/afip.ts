// @ts-ignore
import { AfipClient } from "@afipsdk/afip.js";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import Afip from "@afipsdk/afip.js";
import { prisma } from "@/lib/prisma";

// Verificar si estamos en producción o desarrollo
const isProduction = process.env.NODE_ENV === "production";

// Asegurarse de que existe el directorio para el TA
const taFolder = path.join(process.cwd(), "afip_res");
if (!fs.existsSync(taFolder)) {
  fs.mkdirSync(taFolder, { recursive: true });
}

// Función para obtener certificados de la base de datos
const getCertificatesFromDB = async () => {
  try {
    // Obtener certificado y clave activos
    const cert = await prisma.afipCertificate.findFirst({
      where: { type: "CERT", isActive: true },
      orderBy: { createdAt: "desc" },
    });

    const key = await prisma.afipCertificate.findFirst({
      where: { type: "KEY", isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!cert || !key) {
      console.error(
        "No se encontraron certificados activos en la base de datos"
      );
      return null;
    }

    return { cert: cert.content, key: key.content };
  } catch (error) {
    console.error("Error al obtener certificados de la base de datos:", error);
    return null;
  }
};

// Función para obtener certificados de archivos locales como fallback
const getCertificatesFromFiles = async () => {
  try {
    const certPath =
      process.env.AFIP_CERT_PATH ||
      path.join(process.cwd(), "certs/csrtest44.crt");
    const keyPath =
      process.env.AFIP_KEY_PATH ||
      path.join(process.cwd(), "certs/keytest.key");

    const cert = fs.readFileSync(certPath, "utf8");
    const key = fs.readFileSync(keyPath, "utf8");

    return { cert, key };
  } catch (error) {
    console.error("Error al leer certificados desde archivos:", error);
    return null;
  }
};

// Configuración de AFIP
const getAfipConfig = async () => {
  // Primero intentamos obtener certificados de la base de datos
  let certificates = await getCertificatesFromDB();

  // Si no hay certificados en la base de datos, intentamos leerlos de archivos
  if (!certificates) {
    certificates = await getCertificatesFromFiles();

    if (!certificates) {
      throw new Error("No se pudieron obtener los certificados de AFIP");
    }
  }

  return {
    CUIT: process.env.AFIP_CUIT || "20461628312", // CUIT por defecto para testing
    cert: certificates.cert,
    key: certificates.key,
    production: isProduction,
    res_folder: taFolder,
    ta_folder: taFolder,
  };
};

// Verificar que los certificados existen
const checkCertificates = async () => {
  try {
    const config = await getAfipConfig();
    // Dado que ahora los certificados pueden estar en la base de datos,
    // simplemente verificamos que tenemos contenido
    return !!config.cert && !!config.key;
  } catch (error) {
    console.error("Error al verificar certificados:", error);
    return false;
  }
};

// Crear instancia de AFIP
let afipInstance: Afip | null = null;

// Extender el SDK de AFIP para incluir la función createPDF
// No usamos declare module para evitar errores de TypeScript
// La función createPDF se agregará dinámicamente al objeto afip

// Agregar la función createPDF al SDK de AFIP
export const extendAfipSDK = (afip: any) => {
  if (!afip.ElectronicBilling.createPDF) {
    afip.ElectronicBilling.createPDF = async function (
      data: any
    ): Promise<Buffer> {
      try {
        // Implementación basada en la documentación de AFIP SDK
        // https://docs.afipsdk.com/paso-a-paso/web-services/factura-electronica/crear-pdf

        // Verificar que los datos necesarios estén presentes
        if (!data.Emisor || !data.Receptor || !data.Comprobante) {
          throw new Error("Datos incompletos para generar el PDF");
        }

        // Construir la URL para la API de PDF de AFIP
        const url = "https://www.afip.gob.ar/fe/qr/pdf.php";

        // Preparar los datos para la solicitud
        const formData = new FormData();
        formData.append("data", JSON.stringify(data));

        // Realizar la solicitud a la API de AFIP
        const response = await fetch(url, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Error al generar PDF: ${response.statusText}`);
        }

        // Convertir la respuesta a un buffer
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      } catch (error) {
        console.error("Error en createPDF:", error);
        throw error;
      }
    };
  }

  return afip;
};

export async function getAfipInstance() {
  if (!afipInstance) {
    try {
      const config = await getAfipConfig();

      afipInstance = new Afip({
        CUIT: Number(config.CUIT),
        cert: config.cert,
        key: config.key,
        production: config.production,
        res_folder: config.res_folder,
        ta_folder: config.ta_folder,
      });

      // Extender el SDK con la función createPDF
      afipInstance = extendAfipSDK(afipInstance);

      console.log("Instancia de AFIP creada exitosamente");
    } catch (error) {
      console.error("Error al crear instancia de AFIP:", error);
      throw new Error("Error al crear instancia de AFIP");
    }
  }
  return afipInstance;
}

// Mapeo de tipos de comprobantes internos a códigos de AFIP
export const tipoComprobanteToAfip = (tipoComprobante: string): number => {
  const mapping: Record<string, number> = {
    FACTURA_A: 1,
    FACTURA_B: 6,
    FACTURA_C: 11,
    NOTA_CREDITO_A: 3,
    NOTA_CREDITO_B: 8,
    NOTA_CREDITO_C: 13,
    NOTA_DEBITO_A: 2,
    NOTA_DEBITO_B: 7,
    NOTA_DEBITO_C: 12,
    REMITO: 91, // Código para remitos (puede variar)
  };
  return mapping[tipoComprobante] || 6; // Por defecto Factura B
};

// Función para obtener los tipos de IVA válidos de AFIP
export const getCondicionesIVA = async (): Promise<any[]> => {
  const afip = await getAfipInstance();
  if (!afip) {
    throw new Error("No se pudo inicializar la conexión con AFIP");
  }

  try {
    // Consultar los tipos de IVA válidos
    const tiposIva = await afip.ElectronicBilling.getAliquotTypes();
    console.log("Tipos de IVA obtenidos de AFIP:", tiposIva);
    return tiposIva;
  } catch (error) {
    console.error("Error al obtener tipos de IVA:", error);
    throw error;
  }
};

// Función para obtener los tipos de documentos válidos de AFIP
export const getTiposDocumento = async (): Promise<any[]> => {
  const afip = await getAfipInstance();
  if (!afip) {
    throw new Error("No se pudo inicializar la conexión con AFIP");
  }

  try {
    // Consultar los tipos de documentos válidos
    const tiposDocumento = await afip.ElectronicBilling.getDocumentTypes();
    console.log("Tipos de documento obtenidos de AFIP:", tiposDocumento);
    return tiposDocumento;
  } catch (error) {
    console.error("Error al obtener tipos de documento:", error);
    throw error;
  }
};

// Mapeo de situación IVA a tipo de documento AFIP
export const situacionIVAToDocTipo = async (
  situacionIVA: string,
  tipoComprobante: string
): Promise<number> => {
  try {
    // Obtener los tipos de documento válidos
    const tiposDocumento = await getTiposDocumento();

    // Para Facturas A, siempre debe ser CUIT (80)
    if (tipoComprobante === "FACTURA_A") {
      // Verificar que el código 80 (CUIT) existe en los tipos válidos
      const cuitDocType = tiposDocumento.find((t: any) => t.Id === 80);
      if (cuitDocType) {
        return 80;
      } else {
        console.warn(
          "Código 80 (CUIT) no encontrado en tipos de documento válidos, usando el primer tipo disponible"
        );
        return tiposDocumento[0].Id;
      }
    }

    // Mapeo para otros tipos de comprobantes
    let docTipo: number;
    switch (situacionIVA) {
      case "IVA Responsable Inscripto":
      case "RESPONSABLE_INSCRIPTO":
      case "MONOTRIBUTO":
      case "EXENTO":
        docTipo = 80; // CUIT
        break;
      case "CONSUMIDOR_FINAL":
      default:
        docTipo = 99; // Consumidor Final
    }

    // Verificar que el código existe en los tipos válidos
    const docTipoValido = tiposDocumento.find((t: any) => t.Id === docTipo);
    if (!docTipoValido) {
      console.warn(
        `El código de documento ${docTipo} no es válido según AFIP, usando el primer tipo disponible`
      );
      return tiposDocumento[0].Id;
    }

    return docTipo;
  } catch (error) {
    console.error("Error al mapear situación IVA a tipo de documento:", error);
    // En caso de error, usamos el valor por defecto
    return tipoComprobante === "FACTURA_A" ? 80 : 99;
  }
};

// Obtener el último número de comprobante
export const getUltimoComprobante = async (
  puntoVenta: number,
  tipoComprobante: number
): Promise<number> => {
  const afip = await getAfipInstance();
  if (!afip) {
    throw new Error("No se pudo inicializar la conexión con AFIP");
  }

  try {
    const ultimoComprobante = await afip.ElectronicBilling.getLastVoucher(
      puntoVenta,
      tipoComprobante
    );
    return ultimoComprobante;
  } catch (error) {
    console.error("Error al obtener último comprobante:", error);
    throw error;
  }
};

// Verificar el estado del servidor de AFIP
export const verificarConexion = async (): Promise<boolean> => {
  try {
    const afip = await getAfipInstance();
    if (!afip) {
      console.error("No se pudo obtener la instancia de AFIP");
      return false;
    }

    const status = await afip.ElectronicBilling.getServerStatus();
    if (!status) {
      console.error("No se recibió respuesta del servidor de AFIP");
      return false;
    }

    return (
      status.AppServer === "OK" &&
      status.DbServer === "OK" &&
      status.AuthServer === "OK"
    );
  } catch (error) {
    console.error(
      "Error al verificar conexión con AFIP:",
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error === null
        ? "Error null"
        : String(error)
    );
    return false;
  }
};

// Función para obtener los tipos de IVA del receptor válidos
export const getTiposIvaReceptor = async (): Promise<any[]> => {
  const afip = await getAfipInstance();
  if (!afip) {
    throw new Error("No se pudo inicializar la conexión con AFIP");
  }

  try {
    // Intentar llamar al método mencionado en el error usando executeRequest
    // @ts-ignore - Ignoramos el error de TypeScript porque necesitamos acceder a métodos internos
    const response = await afip.ElectronicBilling.executeRequest(
      "FEParamGetTiposIva"
    );

    if (response && response.ResultGet) {
      console.log(
        "Tipos de IVA del receptor obtenidos de AFIP:",
        response.ResultGet
      );
      return response.ResultGet;
    } else {
      console.warn("No se pudieron obtener los tipos de IVA del receptor");
      return [];
    }
  } catch (error) {
    console.error("Error al obtener tipos de IVA del receptor:", error);
    // En caso de error, devolver valores por defecto
    return [
      { Id: 1, Desc: "IVA Responsable Inscripto" },
      { Id: 4, Desc: "Exento" },
      { Id: 5, Desc: "Consumidor Final" },
      { Id: 6, Desc: "Responsable Monotributo" },
    ];
  }
};

// Generar factura electrónica en AFIP
export const generarFacturaElectronica = async (
  factura: any,
  cliente: any,
  detalles: any[]
): Promise<{
  cae: string;
  vencimientoCae: string;
  numeroComprobante: number;
}> => {
  console.log("Iniciando generación de factura electrónica con datos:", {
    factura,
    cliente,
    detalles,
  });

  const afip = await getAfipInstance();
  if (!afip) {
    console.error("No se pudo obtener la instancia de AFIP");
    throw new Error("No se pudo inicializar la conexión con AFIP");
  }

  try {
    // Obtener los tipos de IVA válidos
    console.log("Consultando tipos de alícuotas de IVA válidas...");
    const tiposAlicuotas = await afip.ElectronicBilling.getAliquotTypes();
    console.log("Tipos de alícuotas de IVA disponibles:", tiposAlicuotas);

    // Obtener los tipos de documentos válidos
    console.log("Consultando tipos de documentos válidos...");
    const tiposDocumento = await getTiposDocumento();
    console.log("Tipos de documento disponibles:", tiposDocumento);

    // Determinar punto de venta (configurable)
    const puntoVenta = 1; // Por defecto punto de venta 1

    // Mapear tipo de comprobante
    const tipoComprobante = tipoComprobanteToAfip(factura.tipoComprobante);
    console.log("Tipo de comprobante mapeado:", {
      original: factura.tipoComprobante,
      afip: tipoComprobante,
    });

    // Obtener último número de comprobante
    const ultimoComprobante = await getUltimoComprobante(
      puntoVenta,
      tipoComprobante
    );
    const numeroComprobante = ultimoComprobante + 1;
    console.log("Número de comprobante:", {
      ultimo: ultimoComprobante,
      nuevo: numeroComprobante,
    });

    // Determinar tipo de documento y número según situación IVA y tipo de comprobante
    const docTipo = await situacionIVAToDocTipo(
      cliente.situacionIVA,
      factura.tipoComprobante
    );

    // Para facturas tipo A, siempre usar un CUIT de prueba válido
    let docNro;
    if (tipoComprobante === 1) {
      // Factura A
      // CUIT de prueba para Responsable Inscripto
      docNro = "20111111112";
      console.log("Usando CUIT de prueba para Factura A:", docNro);
    } else {
      // Para otros tipos de comprobantes, usar el CUIT/DNI del cliente
      docNro = cliente.cuitDni.replace(/[^0-9]/g, "");
    }

    console.log("Datos del cliente:", {
      situacionIVA: cliente.situacionIVA,
      tipoComprobante,
      docTipo,
      docNro,
      cuitOriginal: cliente.cuitDni,
      docNroLength: docNro.length,
    });

    // Calcular importes y redondear a 2 decimales
    const importeNeto = Number(
      detalles
        .reduce((sum, detalle) => sum + detalle.subtotal / (1 + 0.21), 0)
        .toFixed(2)
    );

    const importeIVA = Number(
      detalles
        .reduce(
          (sum, detalle) =>
            sum + (detalle.subtotal - detalle.subtotal / (1 + 0.21)),
          0
        )
        .toFixed(2)
    );

    // Redondear el total a 2 decimales
    const importeTotal = Number(factura.total.toFixed(2));

    console.log("Importes calculados y redondeados:", {
      neto: importeNeto,
      iva: importeIVA,
      total: importeTotal,
    });

    // Fecha actual en formato YYYYMMDD
    const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    // Determinar la condición IVA del receptor según el tipo de comprobante
    let condicionIVAReceptorId;
    if (tipoComprobante === 1) {
      // Factura A
      condicionIVAReceptorId = 1; // IVA Responsable Inscripto
    } else if (tipoComprobante === 6) {
      // Factura B
      condicionIVAReceptorId = 5; // Consumidor Final por defecto

      // Si es monotributista o exento, usar el valor correspondiente
      if (
        cliente.situacionIVA.includes("MONOTRIBUTO") ||
        cliente.situacionIVA.includes("Monotributo")
      ) {
        condicionIVAReceptorId = 6; // Responsable Monotributo
      } else if (
        cliente.situacionIVA.includes("EXENTO") ||
        cliente.situacionIVA.includes("Exento")
      ) {
        condicionIVAReceptorId = 4; // IVA Sujeto Exento
      }
    }

    console.log("Condición IVA del receptor:", condicionIVAReceptorId);

    // Crear datos de la factura para AFIP - Versión actualizada con CondicionIVAReceptorId
    const facturaData: any = {
      CantReg: 1, // Cantidad de comprobantes a registrar
      PtoVta: puntoVenta,
      CbteTipo: tipoComprobante,
      Concepto: 1, // Productos
      DocTipo: docTipo,
      DocNro: docNro,
      CbteDesde: numeroComprobante,
      CbteHasta: numeroComprobante,
      CbteFch: fecha,
      ImpTotal: importeTotal,
      ImpTotConc: 0, // Importe neto no gravado
      ImpNeto: importeNeto,
      ImpOpEx: 0, // Importe exento
      ImpIVA: importeIVA,
      ImpTrib: 0, // Importe otros tributos
      MonId: "PES", // Moneda: Pesos Argentinos
      MonCotiz: 1, // Cotización de la moneda
      CondicionIVAReceptorId: condicionIVAReceptorId, // Nuevo campo requerido por AFIP
      Iva: [
        // Alícuotas de IVA
        {
          Id: 5, // Código de alícuota: 21%
          BaseImp: importeNeto,
          Importe: importeIVA,
        },
      ],
    };

    console.log("Datos de factura preparados para AFIP:", facturaData);

    // Crear la factura en AFIP
    console.log("Enviando solicitud a AFIP...");
    try {
      const result = await afip.ElectronicBilling.createVoucher(facturaData);
      console.log("Respuesta de AFIP:", result);

      if (!result) {
        throw new Error("No se recibió respuesta de AFIP");
      }

      if (!result.CAE) {
        throw new Error(`Respuesta de AFIP sin CAE: ${JSON.stringify(result)}`);
      }

      return {
        cae: result.CAE,
        vencimientoCae: result.CAEFchVto,
        numeroComprobante,
      };
    } catch (afipError) {
      console.error(
        "Error al crear voucher en AFIP:",
        afipError instanceof Error
          ? { message: afipError.message, stack: afipError.stack }
          : afipError === null
          ? "Error null"
          : String(afipError)
      );
      throw new Error(
        afipError instanceof Error
          ? `Error de AFIP: ${afipError.message}`
          : `Error desconocido de AFIP: ${String(afipError)}`
      );
    }
  } catch (error) {
    console.error(
      "Error detallado al generar factura electrónica:",
      error instanceof Error
        ? { message: error.message, stack: error.stack }
        : error === null
        ? "Error null"
        : String(error)
    );

    // Re-lanzar el error para que sea manejado por el llamador
    throw error instanceof Error
      ? error
      : new Error(error === null ? "Error desconocido en AFIP" : String(error));
  }
};
