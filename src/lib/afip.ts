// @ts-ignore
import { AfipClient } from "@afipsdk/afip.js";
import path from "path";
import fs from "fs";
import { promises as fsPromises } from "fs";
import Afip from "@afipsdk/afip.js";
import { prisma } from "@/lib/prisma";

// Verificar si estamos en producción o desarrollo
const isProduction = process.env.NODE_ENV === "production";

// Manejo condicional del directorio TA según el entorno
let taFolder = "";
try {
  // En producción (Vercel), no intentamos crear directorios en el sistema de archivos
  if (isProduction) {
    // Utilizamos una ruta temporal en memoria en lugar de crear directorios
    taFolder = "/tmp";
  } else {
    // En desarrollo, usamos el directorio local
    taFolder = path.join(process.cwd(), "afip_res");
    if (!fs.existsSync(taFolder)) {
      fs.mkdirSync(taFolder, { recursive: true });
    }
  }
} catch (error) {
  console.error("Error al configurar directorio TA:", error);
  // Fallback en caso de error
  taFolder = "/tmp";
}

// Función para obtener certificados de la base de datos
const getCertificatesFromDB = async () => {
  try {
    // Determinar el entorno actual para filtrar certificados correspondientes
    const environment = isProduction ? "PROD" : "DEV";
    console.log(`Obteniendo certificados AFIP para entorno: ${environment}`);

    // Buscar certificados específicos para el entorno actual
    const cert = await prisma.afipCertificate.findFirst({
      where: {
        type: "CERT",
        isActive: true,
        environment: environment,
      },
      orderBy: { createdAt: "desc" },
    });

    const key = await prisma.afipCertificate.findFirst({
      where: {
        type: "KEY",
        isActive: true,
        environment: environment,
      },
      orderBy: { createdAt: "desc" },
    });

    // Si no hay certificados específicos para el entorno, intentar con certificados sin entorno específico
    if (!cert || !key) {
      console.warn(
        `No se encontraron certificados para el entorno ${environment}, buscando certificados genéricos...`
      );

      const genericCert = await prisma.afipCertificate.findFirst({
        where: {
          type: "CERT",
          isActive: true,
          OR: [{ environment: null }, { environment: "" }],
        },
        orderBy: { createdAt: "desc" },
      });

      const genericKey = await prisma.afipCertificate.findFirst({
        where: {
          type: "KEY",
          isActive: true,
          OR: [{ environment: null }, { environment: "" }],
        },
        orderBy: { createdAt: "desc" },
      });

      if (!genericCert || !genericKey) {
        console.error(
          "No se encontraron certificados activos en la base de datos"
        );
        throw new Error(
          "No se encontraron certificados activos en la base de datos"
        );
      }

      return { cert: genericCert.content, key: genericKey.content };
    }

    return { cert: cert.content, key: key.content };
  } catch (error) {
    console.error("Error al obtener certificados de la base de datos:", error);
    throw error;
  }
};

// Configuración de AFIP
const getAfipConfig = async () => {
  try {
    // Obtener certificados exclusivamente de la base de datos
    const certificates = await getCertificatesFromDB();

    if (!certificates) {
      throw new Error(
        "No se pudieron obtener los certificados de la base de datos"
      );
    }

    // Configurar opciones básicas
    const config: any = {
      CUIT: process.env.AFIP_CUIT || "20461628312",
      cert: certificates.cert,
      key: certificates.key,
      production: isProduction,
      res_folder: taFolder,
      ta_folder: taFolder,
    };

    // Incluir access_token solo en producción
    if (isProduction) {
      if (!process.env.AFIP_ACCESS_TOKEN) {
        console.warn(
          "ADVERTENCIA: access_token no encontrado en variables de entorno para entorno de producción"
        );
      } else {
        console.log("Access token de AFIP configurado para producción");
        config.access_token = process.env.AFIP_ACCESS_TOKEN;
      }
    }

    return config;
  } catch (error) {
    console.error("Error en getAfipConfig:", error);
    throw new Error(
      "No se pudieron obtener los certificados necesarios para AFIP"
    );
  }
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
      console.log("Obteniendo instancia de AFIP...");
      const config = await getAfipConfig();

      // Verificar que tengamos todos los datos necesarios
      if (!config.CUIT) {
        console.error("CUIT no configurado en las variables de entorno");
      } else {
        console.log(`CUIT configurado: ${config.CUIT}`);
      }

      // Verificar certificados
      if (!config.cert) {
        console.error("Certificado (cert) no encontrado o vacío");
      } else {
        const certPreview = config.cert.substring(0, 40) + "...";
        console.log(`Certificado encontrado: ${certPreview}`);
      }

      if (!config.key) {
        console.error("Clave privada (key) no encontrada o vacía");
      } else {
        const keyPreview = config.key.substring(0, 40) + "...";
        console.log(`Clave privada encontrada: ${keyPreview}`);
      }

      // Verificar access_token en producción
      if (isProduction && !config.access_token) {
        console.error("ERROR: access_token no configurado para producción");
      } else if (isProduction) {
        console.log("Access token configurado para producción");
      }

      // Registrar información sobre el entorno
      console.log(`Modo producción: ${config.production}`);
      console.log(`Carpeta TA: ${config.ta_folder}`);

      // Crear la instancia con la configuración obtenida
      const afipOptions: any = {
        CUIT: Number(config.CUIT),
        cert: config.cert,
        key: config.key,
        production: config.production,
        res_folder: config.res_folder,
        ta_folder: config.ta_folder,
      };

      // Incluir el access_token solo si existe y estamos en producción
      if (isProduction && config.access_token) {
        afipOptions.access_token = config.access_token;
        console.log("Access token incluido en la configuración de AFIP SDK");
      }

      // Crear la instancia con todas las opciones
      afipInstance = new Afip(afipOptions);

      // Extender el SDK con la función createPDF
      afipInstance = extendAfipSDK(afipInstance);

      console.log("Instancia de AFIP creada exitosamente");
    } catch (error) {
      console.error(
        "Error al crear instancia de AFIP:",
        error instanceof Error ? error.message : String(error)
      );

      // Mostrar más detalles del error para facilitar la depuración
      if (error instanceof Error) {
        console.error("Stack trace:", error.stack);

        // Si hay propiedades adicionales en el error, mostrarlas
        const errorDetails = {};
        for (const prop in error) {
          if (Object.prototype.hasOwnProperty.call(error, prop)) {
            // @ts-ignore
            errorDetails[prop] = error[prop];
          }
        }
        if (Object.keys(errorDetails).length > 0) {
          console.error(
            "Detalles adicionales del error:",
            JSON.stringify(errorDetails, null, 2)
          );
        }
      }

      // En producción, devolvemos null en lugar de lanzar un error
      if (process.env.NODE_ENV === "production") {
        console.warn(
          "En producción: Devolviendo null en lugar de lanzar error en getAfipInstance"
        );
        return null;
      }

      throw new Error(
        `Error al crear instancia de AFIP: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
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
    // Obtener tipos de documentos de AFIP
    const tiposDocumento = await getTiposDocumento();

    // Normalizar situación IVA
    const situacionNormalizada = situacionIVA.toUpperCase().replace(/ /g, "_");

    switch (situacionNormalizada) {
      case "RESPONSABLE_INSCRIPTO":
        return 80; // CUIT
      case "IVA_RESPONSABLE_NO_INSCRIPTO":
        return 80; // CUIT
      case "IVA_NO_RESPONSABLE":
        return 96; // DNI
      case "IVA_SUJETO_EXENTO":
        return 80; // CUIT
      case "CONSUMIDOR_FINAL":
        return 96; // DNI
      case "MONOTRIBUTISTA":
        return 80; // CUIT
      case "SUJETO_NO_CATEGORIZADO":
        return 96; // DNI
      default:
        console.warn(`Situación IVA no reconocida: ${situacionIVA}`);
        return 96; // DNI por defecto
    }
  } catch (error) {
    console.error("Error al obtener tipo de documento:", error);
    throw error;
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
    // Obtener el entorno actual
    const environment = process.env.NODE_ENV || "development";
    console.log(`Verificando conexión AFIP en entorno: ${environment}`);

    // En cualquier entorno, manejar errores adecuadamente
    try {
      const afip = await getAfipInstance();
      if (!afip) {
        console.error("No se pudo obtener la instancia de AFIP");
        return false;
      }

      console.log(
        "Instancia AFIP obtenida, verificando estado del servidor..."
      );

      try {
        // Intentar obtener el estado del servidor con mejor manejo de errores
        const status = await afip.ElectronicBilling.getServerStatus();

        if (!status) {
          console.error("No se recibió respuesta del servidor de AFIP");
          return false;
        }

        console.log("Respuesta del servidor AFIP:", JSON.stringify(status));

        // Verificar cada componente del estado
        const appServerOk = status.AppServer === "OK";
        const dbServerOk = status.DbServer === "OK";
        const authServerOk = status.AuthServer === "OK";

        console.log(
          `Estado de los servicios AFIP - AppServer: ${status.AppServer}, DbServer: ${status.DbServer}, AuthServer: ${status.AuthServer}`
        );

        return appServerOk && dbServerOk && authServerOk;
      } catch (statusError) {
        // Capturar específicamente el error al consultar el estado
        const errorMessage =
          statusError instanceof Error
            ? statusError.message
            : String(statusError);
        const errorDetails = JSON.stringify(
          statusError,
          Object.getOwnPropertyNames(statusError)
        );
        console.error(
          `Error al consultar estado del servidor AFIP: ${errorMessage}`
        );
        console.error(`Detalles del error: ${errorDetails}`);

        // Si estamos en modo desarrollo, mostrar más información para depuración
        if (environment !== "production") {
          console.log("Intentando obtener información adicional del error...");

          if (statusError instanceof Error && "response" in statusError) {
            // @ts-ignore - Para acceder a propiedades de error axios/fetch
            const responseData = statusError.response?.data;
            if (responseData) {
              console.error(
                "Respuesta del servidor:",
                JSON.stringify(responseData)
              );
            }
          }
        } else {
          // Verificar específicamente el error de falta de access_token en producción
          if (
            errorMessage.includes("401") ||
            errorMessage.includes("Unauthorized")
          ) {
            console.error(
              "Error de autorización 401: Es probable que necesite configurar AFIP_ACCESS_TOKEN en las variables de entorno para el entorno de producción."
            );

            // Verificar si tenemos el token configurado
            if (!process.env.AFIP_ACCESS_TOKEN) {
              console.error(
                "AFIP_ACCESS_TOKEN no está definido en las variables de entorno"
              );
            }
          }
        }

        return false;
      }
    } catch (instanceError) {
      console.error(
        `Error al verificar conexión con AFIP en ${environment}:`,
        instanceError instanceof Error
          ? instanceError.message
          : String(instanceError)
      );
      return false;
    }
  } catch (error) {
    console.error(
      "Error general al verificar conexión con AFIP:",
      error instanceof Error ? error.message : String(error)
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
    try {
      const tiposAlicuotas = await afip.ElectronicBilling.getAliquotTypes();
      console.log("Tipos de alícuotas de IVA disponibles:", tiposAlicuotas);
    } catch (alicuotasError) {
      console.error("Error al obtener tipos de alícuotas:", alicuotasError);
      // Continuamos con la ejecución, ya que podría ser un error temporal
    }

    // Obtener los tipos de documentos válidos
    console.log("Consultando tipos de documentos válidos...");
    let tiposDocumento;
    try {
      tiposDocumento = await getTiposDocumento();
      console.log("Tipos de documento disponibles:", tiposDocumento);
    } catch (docError) {
      console.error("Error al obtener tipos de documento:", docError);
      // Usamos un conjunto por defecto
      tiposDocumento = [
        { Id: 80, Desc: "CUIT" },
        { Id: 96, Desc: "DNI" },
        { Id: 99, Desc: "Consumidor Final" },
      ];
      console.log("Usando tipos de documento por defecto:", tiposDocumento);
    }

    // Determinar punto de venta (configurable)
    const puntoVenta = 3; // Punto de venta 3 para facturación electrónica

    // Mapear tipo de comprobante
    const tipoComprobante = tipoComprobanteToAfip(factura.tipoComprobante);
    console.log("Tipo de comprobante mapeado:", {
      original: factura.tipoComprobante,
      afip: tipoComprobante,
    });

    // Obtener último número de comprobante
    let numeroComprobante;
    try {
      const ultimoComprobante = await getUltimoComprobante(
        puntoVenta,
        tipoComprobante
      );
      numeroComprobante = ultimoComprobante + 1;
      console.log("Número de comprobante:", {
        ultimo: ultimoComprobante,
        nuevo: numeroComprobante,
      });
    } catch (numError) {
      console.error("Error al obtener último comprobante:", numError);
      // Generar un número aleatorio como fallback (solo para desarrollo)
      numeroComprobante = Math.floor(10000 + Math.random() * 90000);
      console.log("Usando número de comprobante generado:", numeroComprobante);
    }

    // Determinar tipo de documento y número según situación IVA y tipo de comprobante
    let docTipo;
    try {
      docTipo = await situacionIVAToDocTipo(
        cliente.situacionIVA,
        factura.tipoComprobante
      );
    } catch (docTipoError) {
      console.error("Error al determinar tipo de documento:", docTipoError);
      // Asignar un valor por defecto según el tipo de comprobante
      docTipo = tipoComprobante === 1 ? 80 : 99;
      console.log("Usando tipo de documento por defecto:", docTipo);
    }

    // Para facturas tipo A, siempre usar un CUIT de prueba válido
    let docNro;
    if (tipoComprobante === 1) {
      // Factura A
      // CUIT de prueba para Responsable Inscripto
      docNro = "20111111112";
      console.log("Usando CUIT de prueba para Factura A:", docNro);
    } else {
      // Para otros tipos de comprobantes, usar el CUIT/DNI del cliente
      docNro = cliente.cuitDni ? cliente.cuitDni.replace(/[^0-9]/g, "") : "0";

      // Verificar que docNro sea válido
      if (!docNro || docNro === "0") {
        // Para consumidor final el DocNro puede ser 0
        if (docTipo === 99) {
          docNro = "0";
        } else {
          console.warn(
            "CUIT/DNI del cliente inválido, usando valor por defecto"
          );
          docNro = "0"; // Valor para consumidor final
          docTipo = 99; // Cambiar a consumidor final
        }
      }
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
    if (tipoComprobante === 1 || tipoComprobante === 3) {
      // Factura A o Nota de Crédito A
      condicionIVAReceptorId = 1; // IVA Responsable Inscripto
    } else if (tipoComprobante === 6 || tipoComprobante === 8) {
      // Factura B o Nota de Crédito B
      condicionIVAReceptorId = 5; // Consumidor Final por defecto

      // Si es monotributista o exento, usar el valor correspondiente
      if (
        cliente.situacionIVA?.includes("MONOTRIBUTO") ||
        cliente.situacionIVA?.includes("Monotributo")
      ) {
        condicionIVAReceptorId = 6; // Responsable Monotributo
      } else if (
        cliente.situacionIVA?.includes("EXENTO") ||
        cliente.situacionIVA?.includes("Exento")
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
      Iva: [
        // Alícuotas de IVA
        {
          Id: 5, // Código de alícuota: 21%
          BaseImp: importeNeto,
          Importe: importeIVA,
        },
      ],
    };

    // Añadir CondicionIVAReceptorId solo si está definido
    if (condicionIVAReceptorId) {
      facturaData.CondicionIVAReceptorId = condicionIVAReceptorId;
    }

    // Verificar si es una nota de crédito o débito y agregar CbtesAsoc
    const esNotaCredito = [3, 8, 13].includes(tipoComprobante); // Nota de Crédito A, B, C
    const esNotaDebito = [2, 7, 12].includes(tipoComprobante); // Nota de Débito A, B, C

    if (esNotaCredito || esNotaDebito) {
      console.log(
        "Agregando datos de factura asociada para nota de crédito/débito"
      );

      // Tipo de factura asociada según el tipo de nota
      let tipoFacturaAsociada = 1; // Por defecto, asociar a una Factura A

      if (tipoComprobante === 3)
        tipoFacturaAsociada = 1; // Nota de Crédito A -> Factura A
      else if (tipoComprobante === 8)
        tipoFacturaAsociada = 6; // Nota de Crédito B -> Factura B
      else if (tipoComprobante === 13)
        tipoFacturaAsociada = 11; // Nota de Crédito C -> Factura C
      else if (tipoComprobante === 2)
        tipoFacturaAsociada = 1; // Nota de Débito A -> Factura A
      else if (tipoComprobante === 7)
        tipoFacturaAsociada = 6; // Nota de Débito B -> Factura B
      else if (tipoComprobante === 12) tipoFacturaAsociada = 11; // Nota de Débito C -> Factura C

      // Para producción, buscar la última factura del tipo correspondiente para asociarla
      let ultimaFacturaAsociada: number = 1;

      try {
        ultimaFacturaAsociada = await getUltimoComprobante(
          puntoVenta,
          tipoFacturaAsociada
        );

        if (ultimaFacturaAsociada < 1) {
          ultimaFacturaAsociada = 1;
        }

        console.log(
          `Última factura de tipo ${tipoFacturaAsociada} encontrada: ${ultimaFacturaAsociada}`
        );
      } catch (error) {
        console.warn("Error al obtener última factura asociada:", error);
        // En caso de error, usar 1 como número de factura asociada
        ultimaFacturaAsociada = 1;
      }

      // Agregar estructura CbtesAsoc (obligatoria para notas de crédito/débito)
      facturaData.CbtesAsoc = [
        {
          Tipo: tipoFacturaAsociada, // Tipo de comprobante asociado
          PtoVta: puntoVenta, // Punto de venta de la factura asociada
          Nro: ultimaFacturaAsociada, // Número de la factura asociada
        },
      ];

      console.log(
        "Datos de facturas asociadas añadidos:",
        facturaData.CbtesAsoc
      );
    }

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

      // Verificar si es un error relacionado a MiPyme
      const errorMessage =
        afipError instanceof Error ? afipError.message : String(afipError);
      if (
        errorMessage.includes("requiere_fec") ||
        errorMessage.includes("factura de crédito MiPyme")
      ) {
        throw new Error(
          "Este cliente requiere facturas MiPyME según AFIP. Debe emitir una factura de crédito electrónica (FCE)."
        );
      }

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

// Función para forzar la regeneración del Token de Acceso
export const forceNewTokenAuthorization = async (): Promise<boolean> => {
  try {
    const afip = await getAfipInstance();
    if (!afip) {
      throw new Error("No se pudo obtener la instancia de AFIP");
    }

    console.log("Forzando regeneración del Token de Acceso (TA) para AFIP...");

    // Usar el método interno para autenticar nuevamente
    // @ts-ignore - Accedemos a métodos internos
    await afip.ElectronicBilling.client.authenticate({ force: true });

    console.log("Token de Acceso (TA) regenerado exitosamente");
    return true;
  } catch (error) {
    console.error("Error al regenerar Token de Acceso (TA):", error);
    return false;
  }
};
