import React from "react";

interface DetalleRemito {
  codigo: string;
  descripcion: string;
  cantidad: string;
  precioUnitario: string;
  subtotal: string;
}

interface RemitoTemplateProps {
  numero: string;
  fecha: string;
  razonSocial: string;
  // domicilioComercial: string;
  clienteNombre: string;
  clienteCuit: string;
  clienteDomicilio: string;
  vendedor?: string;
  detalles: DetalleRemito[];
  total: string;
}

export const RemitoTemplate: React.FC<RemitoTemplateProps> = ({
  numero,
  fecha,
  razonSocial,
  // domicilioComercial,
  clienteNombre,
  clienteCuit,
  clienteDomicilio,
  vendedor,
  detalles,
  total,
}) => {
  return (
    <div className="remito-container">
      <div className="header text-center">
        <h1 style={{ color: "#3498db", marginBottom: "5px" }}>REMITO</h1>
        <h2>{razonSocial}</h2>
        <p className="no-margin">Documento no válido como factura</p>
        <h3>Remito N°: {numero}</h3>
        <p>Fecha: {fecha}</p>
      </div>

      <div className="info-container flex space-between">
        <div className="info-section">
          <h3 style={{ color: "#3498db" }}>Empresa</h3>
          <p>
            <strong>Razón Social:</strong> {razonSocial}
          </p>
          {/* <p>
            <strong>Domicilio:</strong> {domicilioComercial}
          </p> */}
          {vendedor && (
            <p>
              <strong>Vendedor:</strong> {vendedor}
            </p>
          )}
        </div>

        <div className="info-section">
          <h3 style={{ color: "#3498db" }}>Cliente</h3>
          <p>
            <strong>Nombre:</strong> {clienteNombre}
          </p>
          <p>
            <strong>CUIT/DNI:</strong> {clienteCuit || "No especificado"}
          </p>
          <p>
            <strong>Dirección:</strong> {clienteDomicilio || "No especificado"}
          </p>
        </div>
      </div>

      <table className="detalles-table">
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
          {detalles.map((detalle, index) => (
            <tr key={index}>
              <td>{detalle.codigo}</td>
              <td>{detalle.descripcion}</td>
              <td className="text-center">{detalle.cantidad}</td>
              <td className="text-right">{detalle.precioUnitario}</td>
              <td className="text-right">{detalle.subtotal}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="total-section">
        <div
          style={{
            textAlign: "right",
            marginTop: "20px",
            fontSize: "16px",
            fontWeight: "bold",
          }}
        >
          <p>Total: {total}</p>
        </div>
      </div>

      <div className="footer text-center">
        <p>Este documento es un comprobante de entrega de mercadería.</p>
        <p>No válido como factura.</p>
      </div>
    </div>
  );
};
