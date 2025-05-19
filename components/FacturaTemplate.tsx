import React from "react";

interface DetalleFactura {
  codigo: string;
  descripcion: string;
  cantidad: string;
  unidadMedida: string;
  precioUnitario: string;
  bonificacion: string;
  subtotal: string;
  alicuotaIVA: string;
  subtotalConIVA: string;
}

interface FacturaTemplateProps {
  tipoComprobante: string;
  codigoComprobante: string;
  razonSocial: string;
  // domicilioComercial: string;
  condicionIVA: string;
  puntoVenta: string;
  compNro: string;
  fechaEmision: string;
  cuit: string;
  ingresosBrutos: string;
  fechaInicioActividades: string;
  periodoFacturadoDesde: string;
  periodoFacturadoHasta: string;
  fechaVtoPago: string;
  clienteCuit: string;
  clienteNombre: string;
  clienteCondicionIVA: string;
  clienteDomicilio: string;
  condicionVenta: string;
  detalles: DetalleFactura[];
  importeNetoGravado: string;
  importeTotal: string;
  qrDataUrl: string;
  cae: string;
  fechaVencimientoCae: string;
}

export const FacturaTemplate: React.FC<FacturaTemplateProps> = ({
  tipoComprobante,
  codigoComprobante,
  razonSocial,
  // domicilioComercial,
  condicionIVA,
  puntoVenta,
  compNro,
  fechaEmision,
  cuit,
  ingresosBrutos,
  fechaInicioActividades,
  periodoFacturadoDesde,
  periodoFacturadoHasta,
  fechaVtoPago,
  clienteCuit,
  clienteNombre,
  clienteCondicionIVA,
  clienteDomicilio,
  condicionVenta,
  detalles,
  importeNetoGravado,
  importeTotal,
  qrDataUrl,
  cae,
  fechaVencimientoCae,
}) => {
  return (
    <>
      <div
        className="wrapper text-center bold text-20"
        style={{ width: "100%", borderBottom: 0 }}
      >
        ORIGINAL
      </div>

      <div className="flex relative">
        <div
          className="wrapper inline-block w50 flex"
          style={{ borderRight: 0 }}
        >
          <h3
            className="text-center"
            style={{ fontSize: "24px", marginBottom: "3px", width: "100%" }}
          >
            {razonSocial}
          </h3>
          <p
            style={{
              fontSize: "13px",
              lineHeight: 1.5,
              marginBottom: 0,
              alignSelf: "flex-end",
            }}
          >
            <b>Razón Social:</b> {razonSocial}
            <br />
            {/* <b>Domicilio Comercial:</b> {domicilioComercial} */}
            <br />
            <b>Condición frente al IVA:</b> {condicionIVA}
          </p>
        </div>
        <div className="wrapper inline-block w50">
          <h3
            className="text-center"
            style={{ fontSize: "24px", marginBottom: "3px" }}
          >
            FACTURA
          </h3>
          <p style={{ fontSize: "13px", lineHeight: 1.5, marginBottom: 0 }}>
            <b>
              Punto de Venta: {puntoVenta} Comp. Nro: {compNro}
            </b>
            <br />
            <b>Fecha de Emisión: {fechaEmision}</b>
            <br />
            <b>CUIT:</b> {cuit}
            <br />
            <b>Ingresos Brutos:</b> {ingresosBrutos}
            <br />
            <b>Fecha de Inicio de Actividades:</b> {fechaInicioActividades}
          </p>
        </div>
        <div className="wrapper floating-mid">
          <h3 className="no-margin text-center" style={{ fontSize: "26px" }}>
            {tipoComprobante}
          </h3>
          <h5 className="no-margin text-center">COD. {codigoComprobante}</h5>
        </div>
      </div>

      <div className="wrapper flex space-around" style={{ marginTop: "1px" }}>
        <span>
          <b>Período Facturado Desde:</b> {periodoFacturadoDesde}
        </span>
        <span>
          <b>Hasta:</b> {periodoFacturadoHasta}
        </span>
        <span>
          <b>Fecha de Vto. para el pago:</b> {fechaVtoPago}
        </span>
      </div>

      <div className="wrapper" style={{ marginTop: "2px", fontSize: "12px" }}>
        <div className="flex" style={{ marginBottom: "15px" }}>
          <span style={{ width: "30%" }}>
            <b>CUIT:</b> {clienteCuit}
          </span>
          <span>
            <b>Apellido y Nombre / Razón Social:</b> {clienteNombre}
          </span>
        </div>
        <div
          className="flex"
          style={{ flexWrap: "nowrap", marginBottom: "5px" }}
        >
          <span style={{ width: "70%" }}>
            <b>Condición frente al IVA:</b> {clienteCondicionIVA}
          </span>
          <span>
            <b>Domicilio:</b> {clienteDomicilio}
          </span>
        </div>
        <div className="flex">
          <span>
            <b>Condición de venta:</b> {condicionVenta}
          </span>
        </div>
      </div>

      <table style={{ marginTop: "5px" }} className="compact-table">
        <thead>
          <tr>
            <th className="text-left">Código</th>
            <th className="text-left">Producto / Servicio</th>
            <th>Cantidad</th>
            <th>U. Medida</th>
            <th>Precio Unit.</th>
            <th>% Bonif</th>
            <th>Subtotal</th>
            <th>Alicuota IVA</th>
            <th>Subtotal c/IVA</th>
          </tr>
        </thead>
        <tbody>
          {detalles.map((detalle, index) => (
            <tr key={index}>
              <td className="text-left">{detalle.codigo}</td>
              <td className="text-left">{detalle.descripcion}</td>
              <td className="text-right">{detalle.cantidad}</td>
              <td className="text-center">{detalle.unidadMedida}</td>
              <td className="text-right">{detalle.precioUnitario}</td>
              <td className="text-center">{detalle.bonificacion}</td>
              <td className="text-center">{detalle.subtotal}</td>
              <td className="text-right">{detalle.alicuotaIVA}</td>
              <td className="text-right">{detalle.subtotalConIVA}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div
        className="footer no-page-break"
        style={{ marginTop: detalles.length <= 3 ? "40px" : "140px" }}
      >
        <div className="flex wrapper space-between">
          <div style={{ width: "55%" }}>
            <p className="bold" style={{ marginTop: "0", marginBottom: "5px" }}>
              Otros tributos
            </p>
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Detalle</th>
                  <th className="text-right">Alíc. %</th>
                  <th className="text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Per./Ret. de Impuesto a las Ganancias</td>
                  <td></td>
                  <td></td>
                  <td className="text-right">0,00</td>
                </tr>
                <tr>
                  <td>Per./Ret. de IVA</td>
                  <td></td>
                  <td></td>
                  <td className="text-right">0,00</td>
                </tr>
                <tr>
                  <td>Impuestos Internos</td>
                  <td></td>
                  <td></td>
                  <td className="text-right">0,00</td>
                </tr>
                <tr>
                  <td>Impuestos Municipales</td>
                  <td></td>
                  <td></td>
                  <td className="text-right">0,00</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            style={{ width: "40%", marginTop: "40px" }}
            className="flex wrapper"
          >
            <span className="text-right" style={{ width: "60%" }}>
              <b>Importe Neto Gravado: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>{importeNetoGravado}</b>
            </span>
            <span className="text-right" style={{ width: "60%" }}>
              <b>IVA 27%: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>0,00</b>
            </span>
            <span className="text-right" style={{ width: "60%" }}>
              <b>IVA 21%: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>0,00</b>
            </span>
            <span className="text-right" style={{ width: "60%" }}>
              <b>IVA 10.5%: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>0,00</b>
            </span>
            <span className="text-right" style={{ width: "60%" }}>
              <b>IVA 5%: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>0,00</b>
            </span>
            <span className="text-right" style={{ width: "60%" }}>
              <b>IVA 2.5%: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>0,00</b>
            </span>
            <span className="text-right" style={{ width: "60%" }}>
              <b>IVA 0%: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>0,00</b>
            </span>
            <span className="text-right" style={{ width: "60%" }}>
              <b>Importe Otros Tributos: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>0,00</b>
            </span>
            <span className="text-right" style={{ width: "60%" }}>
              <b>Importe Total: $</b>
            </span>
            <span className="text-right" style={{ width: "40%" }}>
              <b>{importeTotal}</b>
            </span>
          </div>
        </div>
        <div className="flex relative" style={{ marginTop: "20px" }}>
          <div
            className="qr-container"
            style={{ padding: "0 20px 20px 20px", width: "20%" }}
          >
            <img src={qrDataUrl} style={{ maxWidth: "100%" }} alt="QR Code" />
          </div>
          <div style={{ paddingLeft: "10px", width: "45%" }}>
            <h4 className="italic bold">AFIP</h4>
            <h4 className="italic bold">Comprobante Autorizado</h4>
            <p className="small italic bold" style={{ fontSize: "9px" }}>
              Esta Administración Federal no se responsabiliza por los datos
              ingresados en el detalle de la operación
            </p>
          </div>
          <div
            className="flex"
            style={{ alignSelf: "flex-start", width: "35%" }}
          >
            <span className="text-right" style={{ width: "50%" }}>
              <b>CAE N°:</b>
            </span>
            <span className="text-left" style={{ paddingLeft: "10px" }}>
              {cae}
            </span>
            <span className="text-right" style={{ width: "50%" }}>
              <b>Fecha de Vto. de CAE:</b>
            </span>
            <span className="text-left" style={{ paddingLeft: "10px" }}>
              {fechaVencimientoCae}
            </span>
          </div>
          <span className="floating-mid bold">Pág 1/1</span>
        </div>
      </div>
    </>
  );
};
