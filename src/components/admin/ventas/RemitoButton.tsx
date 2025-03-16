import { Button } from "@/components/ui/button";
import { Printer, XCircle } from "lucide-react";
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

interface RemitoButtonProps {
  remito: {
    id: string;
    numero: string;
    fecha: Date;
    tipoComprobante: string;
    estado: string;
  };
  onUpdate?: () => void;
}

export function RemitoButton({ remito, onUpdate }: RemitoButtonProps) {
  const [isPrintLoading, setIsPrintLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  const handlePrintRemito = async () => {
    if (isPrintLoading) return;

    const toastId = toast.loading("Preparando impresión del remito...");
    setIsPrintLoading(true);

    try {
      // Crear un enlace para imprimir el remito
      const link = document.createElement("a");
      link.href = `/api/remitos/pdf?remitoId=${remito.id}`;
      link.target = "_blank";

      // Simular clic en el enlace para abrir en nueva pestaña
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.dismiss(toastId);
      toast.success("Remito listo para imprimir");
    } catch (error) {
      console.error("Error al preparar remito para impresión:", error);
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error
          ? error.message
          : "Error al preparar el remito para impresión"
      );
    } finally {
      setIsPrintLoading(false);
    }
  };

  const handleCancelRemito = async () => {
    if (isCancelLoading) return;

    setIsCancelLoading(true);
    const toastId = toast.loading(
      "Anulando remito mediante nota de crédito..."
    );

    try {
      const response = await fetch("/api/remitos/crear-nota-credito-remito", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ facturaId: remito.id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al anular el remito");
      }

      const data = await response.json();
      toast.dismiss(toastId);
      toast.success("Remito anulado correctamente mediante nota de crédito");

      // Actualizar la vista si se proporciona la función onUpdate
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error al anular remito:", error);
      toast.dismiss(toastId);
      toast.error(
        error instanceof Error ? error.message : "Error al anular el remito"
      );
    } finally {
      setIsCancelLoading(false);
      setShowCancelDialog(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={handlePrintRemito}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
        disabled={isPrintLoading}
      >
        <Printer className="h-4 w-4 mr-2" />
        {isPrintLoading ? "Preparando..." : "Imprimir Remito"}
      </Button>

      {remito.estado !== "ANULADA" && (
        <Button
          onClick={() => setShowCancelDialog(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white"
          disabled={isCancelLoading}
        >
          <XCircle className="h-4 w-4 mr-2" />
          {isCancelLoading ? "Anulando..." : "Anular Remito"}
        </Button>
      )}

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Estás seguro de anular este remito?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción generará una nota de crédito para anular el remito{" "}
              {remito.numero} y no se puede deshacer. El remito quedará marcado
              como "ANULADO" en el sistema y se devolverá el stock de los
              productos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelRemito}
              className="bg-red-600 hover:bg-red-700"
            >
              Anular Remito
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
