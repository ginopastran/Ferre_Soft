export interface Product {
  id: number;
  codigo: string;
  codigoProveedor: string;
  codigoBarras: string | null;
  rubro: string;
  descripcion: string;
  proveedor: string;
  precioCosto: number;
  iva: number;
  margenGanancia1: number;
  precioFinal1: number;
  margenGanancia2: number;
  precioFinal2: number;
  imagenUrl?: string;
  stock: number;
  creadoEn: Date;
}
