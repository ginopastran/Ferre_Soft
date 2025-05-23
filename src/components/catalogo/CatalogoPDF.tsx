import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils/format";

// Usamos una fuente que viene incluida por defecto
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "Helvetica",
    },
    {
      src: "Helvetica-Bold",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#fff",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    position: "relative",
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  header: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Helvetica",
    fontWeight: "bold",
  },
  date: {
    position: "absolute",
    top: 5,
    right: 0,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#374151",
  },
  productGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "space-between",
  },
  productCard: {
    width: "31%",
    marginBottom: 12,
    padding: 8,
    border: "1px solid #e5e7eb",
    borderRadius: 6,
  },
  productImage: {
    width: "100%",
    height: 100,
    objectFit: "contain",
    marginBottom: 6,
  },
  defaultImage: {
    width: "100%",
    height: 100,
    backgroundColor: "#f3f4f6",
  },
  productTitle: {
    fontSize: 10,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    marginBottom: 3,
  },
  productCode: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 2,
    fontFamily: "Helvetica",
  },
  productCategory: {
    fontSize: 9,
    color: "#6b7280",
    marginBottom: 3,
    fontFamily: "Helvetica",
  },
  productPrice: {
    fontSize: 11,
    fontFamily: "Helvetica",
    fontWeight: "bold",
    color: "#0891b2",
  },
  pageNumber: {
    position: "absolute",
    bottom: 15,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#6b7280",
  },
});

interface Producto {
  id: number;
  codigo: string;
  descripcion: string;
  precioFinal1: number;
  iva: number;
  imagenUrl?: string;
  rubro: string;
}

interface CatalogoPDFProps {
  productos: Producto[];
}

const PRODUCTS_PER_PAGE = 9;

export const CatalogoPDF = ({ productos }: CatalogoPDFProps) => {
  const totalPages = Math.ceil(productos.length / PRODUCTS_PER_PAGE);
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <Document>
      {pages.map((pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {pageIndex === 0 && (
            <View style={styles.headerContainer}>
              <Image style={styles.logo} src="/andes-logo.jpeg" />
              <Text style={styles.header}>
                LISTA DE PRECIOS (SIN IVA) {new Date().toLocaleDateString()}
              </Text>
            </View>
          )}

          <View style={styles.productGrid}>
            {productos
              .slice(
                pageIndex * PRODUCTS_PER_PAGE,
                (pageIndex + 1) * PRODUCTS_PER_PAGE
              )
              .map((producto) => (
                <View key={producto.id} style={styles.productCard}>
                  {producto.imagenUrl ? (
                    <Image
                      style={styles.productImage}
                      src={producto.imagenUrl}
                    />
                  ) : (
                    <View style={styles.defaultImage} />
                  )}
                  <Text style={styles.productTitle}>
                    {producto.descripcion}
                  </Text>
                  <Text style={styles.productCode}>
                    Código: {producto.codigo}
                  </Text>
                  <Text style={styles.productCategory}>
                    Rubro: {producto.rubro}
                  </Text>
                  <Text style={styles.productPrice}>
                    {formatCurrency(producto.precioFinal1)}
                  </Text>
                </View>
              ))}
          </View>

          <Text style={styles.pageNumber}>
            Página {pageIndex + 1} de {totalPages}
          </Text>
        </Page>
      ))}
    </Document>
  );
};
