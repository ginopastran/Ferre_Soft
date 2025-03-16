import React, { useState, useEffect } from "react";
import { FacturaTemplate } from "../../components/FacturaTemplate";
import Head from "next/head";
import "../../styles/factura.css";

const FacturaPreview = () => {
  const [facturaData, setFacturaData] = useState({
    tipoComprobante: "A",
    codigoComprobante: "01",
    razonSocial: "FERRESOFT S.A.",
    domicilioComercial: "Av. Siempre Viva 123 - CABA",
    condicionIVA: "Responsable inscripto",
    puntoVenta: "00001",
    compNro: "00000001",
    fechaEmision: "01/01/2023",
    cuit: "20461628312",
    ingresosBrutos: "12345432",
    fechaInicioActividades: "01/01/2023",
    periodoFacturadoDesde: "01/01/2023",
    periodoFacturadoHasta: "31/01/2023",
    fechaVtoPago: "15/02/2023",
    clienteCuit: "20123456789",
    clienteNombre: "Cliente de Ejemplo S.A.",
    clienteCondicionIVA: "IVA Responsable Inscripto",
    clienteDomicilio: "Calle Falsa 123, Springfield",
    condicionVenta: "Efectivo",
    detalles: [
      {
        codigo: "001",
        descripcion: "Producto de ejemplo 1",
        cantidad: "2.00",
        unidadMedida: "Unidad",
        precioUnitario: "1000.00",
        bonificacion: "0.00",
        subtotal: "2000.00",
        alicuotaIVA: "21%",
        subtotalConIVA: "2420.00",
      },
      {
        codigo: "002",
        descripcion: "Producto de ejemplo 2",
        cantidad: "1.00",
        unidadMedida: "Unidad",
        precioUnitario: "500.00",
        bonificacion: "0.00",
        subtotal: "500.00",
        alicuotaIVA: "21%",
        subtotalConIVA: "605.00",
      },
    ],
    importeNetoGravado: "2500.00",
    importeTotal: "3025.00",
    qrDataUrl: "",
    cae: "12345678901234",
    fechaVencimientoCae: "15/02/2023",
  });

  // Generar QR para la vista previa
  useEffect(() => {
    const generateQR = async () => {
      try {
        const QRCode = (await import("qrcode")).default;
        const qrData = `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(
          JSON.stringify({
            ver: 1,
            fecha: facturaData.fechaEmision,
            cuit: facturaData.cuit,
            ptoVta: 1,
            tipoCmp:
              facturaData.tipoComprobante === "A"
                ? 1
                : facturaData.tipoComprobante === "B"
                ? 6
                : 11,
            nroCmp: parseInt(facturaData.compNro),
            importe: parseFloat(facturaData.importeTotal),
            moneda: "PES",
            ctz: 1,
            tipoCodAut: "E",
            codAut: facturaData.cae,
          })
        ).toString("base64")}`;

        const qrDataUrl = await QRCode.toDataURL(qrData);
        setFacturaData((prev) => ({ ...prev, qrDataUrl }));
      } catch (error) {
        console.error("Error generando QR:", error);
      }
    };

    generateQR();
  }, []);

  const handleTipoComprobanteChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const tipo = e.target.value;
    const codigo = tipo === "A" ? "01" : tipo === "B" ? "06" : "11";
    setFacturaData((prev) => ({
      ...prev,
      tipoComprobante: tipo,
      codigoComprobante: codigo,
    }));
  };

  return (
    <>
      <Head>
        <title>Vista Previa de Factura</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="container mx-auto p-4">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Vista Previa de Factura</h1>
          <div>
            <label className="mr-2">Tipo de Comprobante:</label>
            <select
              value={facturaData.tipoComprobante}
              onChange={handleTipoComprobanteChange}
              className="border p-2 rounded"
            >
              <option value="A">Factura A</option>
              <option value="B">Factura B</option>
              <option value="C">Factura C</option>
            </select>
          </div>
        </div>

        <div className="border p-4 bg-white">
          <div className="page">
            <FacturaTemplate {...facturaData} />
          </div>
        </div>
      </div>
    </>
  );
};

export default FacturaPreview;
