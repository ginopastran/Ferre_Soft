import { Factura, Cliente, DetalleFactura } from "@prisma/client";
import QRCode from "qrcode";

interface FacturaWithDetails extends Factura {
  cliente: Cliente;
  detalles: (DetalleFactura & {
    producto: {
      codigo: string;
      descripcion: string;
    };
  })[];
}

export async function generatePDFContent(
  factura: FacturaWithDetails
): Promise<string> {
  // Mapear tipo de comprobante
  const tipoComprobante =
    factura.tipoComprobante === "FACTURA_A"
      ? "A"
      : factura.tipoComprobante === "FACTURA_B"
      ? "B"
      : "C";

  // Formatear fecha
  const fechaEmision = new Date(factura.fecha).toLocaleDateString();
  const fechaVencimientoCae = factura.vencimientoCae
    ? new Date(factura.vencimientoCae).toLocaleDateString()
    : "";

  // Generar código QR para la factura
  const qrData = `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(
    JSON.stringify({
      ver: 1,
      fecha: fechaEmision,
      cuit: process.env.AFIP_CUIT || "20461628312",
      ptoVta: 1,
      tipoCmp: tipoComprobante === "A" ? 1 : tipoComprobante === "B" ? 6 : 11,
      nroCmp: factura.afipComprobante || 0,
      importe: factura.total,
      moneda: "PES",
      ctz: 1,
      tipoCodAut: "E",
      codAut: factura.cae,
    })
  ).toString("base64")}`;

  const qrDataUrl = await QRCode.toDataURL(qrData);

  // Generar el HTML
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Factura ${factura.numero}</title>
        <style>
          * {
            box-sizing: border-box;
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
          }
          body {
            padding: 20px;
          }
          .factura-container {
            border: 1px solid #000;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
          }
          .tipo-comprobante {
            font-size: 24px;
            font-weight: bold;
            border: 2px solid #000;
            padding: 5px 15px;
            display: inline-block;
          }
          .info-empresa {
            margin-bottom: 20px;
          }
          .info-cliente {
            margin-bottom: 20px;
            padding: 10px;
            background-color: #f5f5f5;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          th {
            background-color: #f0f0f0;
          }
          .totales {
            text-align: right;
            margin-top: 20px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
          }
          .qr-code {
            text-align: center;
            margin-top: 20px;
          }
          .qr-code img {
            width: 150px;
            height: 150px;
          }
        </style>
      </head>
      <body>
        <div class="factura-container">
          <div class="header">
            <div class="tipo-comprobante">FACTURA ${tipoComprobante}</div>
            <h1>FERRESOFT S.A.</h1>
            <p>CUIT: ${process.env.AFIP_CUIT || "20461628312"}</p>
            <p>Av. Siempre Viva 123 - CABA</p>
            <p>Responsable Inscripto</p>
          </div>

          <div class="info-cliente">
            <h3>Datos del Cliente</h3>
            <p>Nombre: ${factura.cliente.nombre}</p>
            <p>CUIT/DNI: ${factura.cliente.cuitDni || "No especificado"}</p>
            <p>Dirección: ${factura.cliente.direccion || "No especificado"}</p>
            <p>Condición IVA: ${
              factura.tipoComprobante === "FACTURA_A"
                ? "IVA Responsable Inscripto"
                : "Consumidor Final"
            }</p>
          </div>

          <div class="detalles">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Precio Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${factura.detalles
                  .map(
                    (detalle) => `
                  <tr>
                    <td>${detalle.producto.codigo}</td>
                    <td>${detalle.producto.descripcion}</td>
                    <td>${detalle.cantidad}</td>
                    <td>$${detalle.precioUnitario.toFixed(2)}</td>
                    <td>$${detalle.subtotal.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="totales">
            <p><strong>Total: $${factura.total.toFixed(2)}</strong></p>
          </div>

          ${
            factura.cae
              ? `
            <div class="footer">
              <p>CAE N°: ${factura.cae}</p>
              <p>Fecha de Vto. de CAE: ${fechaVencimientoCae}</p>
              <div class="qr-code">
                <img src="${qrDataUrl}" alt="Código QR AFIP" />
              </div>
            </div>
          `
              : ""
          }
        </div>
      </body>
    </html>
  `;
}
