import { Button } from "@/components/ui/button";
import { FileDown, Printer, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface AfipFacturaButtonProps {
  factura: {
    id: string;
    numero: string;
    fecha: Date;
    cae?: string | null;
    vencimientoCae?: string | null;
    afipComprobante?: number | null;
    tipoComprobante: string;
    estado: string;
  };
  onUpdate?: () => void;
}

export function AfipFacturaButton({
  factura,
  onUpdate,
}: AfipFacturaButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handleDownloadAfipPDF = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      const toastId = toast.loading("Preparando descarga de factura...");

      // Verificar que la factura tenga ID
      if (!factura.id) {
        toast.error("Error: ID de factura no disponible");
        setIsLoading(false);
        toast.dismiss(toastId);
        return;
      }

      // Añadir un timestamp para evitar caché
      const timestamp = new Date().getTime();
      const downloadUrl = `/api/afip/pdf?facturaId=${factura.id}&t=${timestamp}`;

      try {
        // Hacer un fetch directamente de la URL del PDF
        const response = await fetch(downloadUrl);

        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
          throw new Error(`Error HTTP: ${response.status}`);
        }

        // Obtener el blob del PDF
        const blob = await response.blob();

        // Verificar que el blob tenga contenido
        if (blob.size === 0) {
          throw new Error("El PDF generado está vacío");
        }

        // Determinar si es nota de crédito
        const esNotaCredito = factura.tipoComprobante.includes("NOTA_CREDITO");
        const tipoFactura = factura.tipoComprobante.split("_")[1] || ""; // Extrae "A", "B", etc.

        // Crear un nombre de archivo para la descarga
        const filename = esNotaCredito
          ? `notacredito${tipoFactura.toLowerCase()}-${factura.numero}.pdf`
          : `factura${tipoFactura.toLowerCase()}-${factura.numero}.pdf`;

        // Crear una URL para el blob
        const url = window.URL.createObjectURL(blob);

        // Crear un enlace temporal para la descarga
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();

        // Limpiar recursos
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        }, 100);

        toast.dismiss(toastId);
        toast.success(
          `${
            esNotaCredito ? "Nota de crédito" : "Factura"
          } descargada correctamente`
        );
        setIsLoading(false);
      } catch (error) {
        console.error("Error al descargar la factura:", error);
        toast.error("No se pudo descargar la factura");
        setIsLoading(false);
        toast.dismiss(toastId);
      }
    } catch (error) {
      console.error("Error al descargar factura:", error);
      toast.error("Error al descargar la factura");
      setIsLoading(false);
    }
  };

  const handleCancelFactura = async () => {
    if (isCancelLoading) return;

    setIsCancelLoading(true);
    const toastId = toast.loading(
      "Anulando factura mediante nota de crédito..."
    );

    try {
      const response = await fetch("/api/afip/crear-nota-credito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ facturaId: factura.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al anular la factura");
      }

      const data = await response.json();
      toast.dismiss(toastId);
      toast.success("Factura anulada correctamente mediante nota de crédito");

      // Actualizar la vista si se proporciona la función onUpdate
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error al anular factura:", error);
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Error al anular la factura"
      );
    } finally {
      setIsCancelLoading(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handleDownloadAfipPDF}
        className="bg-gradient-to-r from-green-600 to-green-700 text-white"
        disabled={isLoading}
      >
        <FileDown className="h-4 w-4 mr-2" />
        {isLoading ? "Preparando..." : "Ver/Descargar Factura AFIP"}
      </Button>

      {factura.estado !== "ANULADA" && (
        <Button
          onClick={() => setShowCancelDialog(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white"
          disabled={isCancelLoading}
        >
          <XCircle className="h-4 w-4 mr-2" />
          {isCancelLoading ? "Anulando..." : "Cancelar Factura"}
        </Button>
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de anular esta factura?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción generará una nota de crédito para anular la factura{" "}
              {factura.numero} y no se puede deshacer. La factura quedará
              marcada como "ANULADA" en el sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelFactura}
              className="bg-red-600 hover:bg-red-700"
            >
              Anular Factura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
