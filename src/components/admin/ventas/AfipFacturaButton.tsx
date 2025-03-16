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

    const toastId = toast.loading("Descargando factura oficial de AFIP...");
    setIsLoading(true);

    try {
      // Verificar primero si la factura está disponible
      const checkResponse = await fetch(
        `/api/afip/check-pdf?facturaId=${factura.id}`
      );

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        throw new Error(errorData.error || "Error al verificar la factura");
      }

      // Crear un enlace para descargar el PDF
      const link = document.createElement("a");
      link.href = `/api/afip/pdf?facturaId=${factura.id}`;
      link.target = "_blank";
      link.download = `factura_afip_${factura.numero}.pdf`;

      // Simular clic en el enlace para iniciar la descarga
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(toastId);
      toast.success("Descarga iniciada");
    } catch (error) {
      console.error("Error al descargar PDF de AFIP:", error);
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al descargar la factura de AFIP"
      );
    } finally {
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
        {isLoading ? "Descargando..." : "Descargar Factura Oficial AFIP"}
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
