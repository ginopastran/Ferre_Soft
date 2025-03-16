import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, AlertCircle } from "lucide-react";
import { AfipFacturaButton } from "./AfipFacturaButton";

interface AfipInfoProps {
  cae?: string | null;
  vencimientoCae?: string | null;
  afipComprobante?: number | null;
  tipoComprobante: string;
  factura?: any; // Datos completos de la factura para generar el PDF
  onUpdate?: () => void; // Función para actualizar la vista después de anular la factura
}

export function AfipInfo({
  cae,
  vencimientoCae,
  afipComprobante,
  tipoComprobante,
  factura,
  onUpdate,
}: AfipInfoProps) {
  // Verificar si es un comprobante que debería tener CAE
  const requiereCAE = [
    "FACTURA_A",
    "FACTURA_B",
    "FACTURA_C",
    "NOTA_CREDITO_A",
    "NOTA_CREDITO_B",
  ].includes(tipoComprobante);

  // Verificar si tiene CAE
  const tieneCAE = !!cae;

  // Si no requiere CAE, no mostrar el componente
  if (!requiereCAE) {
    return null;
  }

  // Determinar si es una nota de crédito
  const esNotaCredito = tipoComprobante.startsWith("NOTA_CREDITO");

  return (
    <Card className={tieneCAE ? "border-green-500" : "border-yellow-500"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          {tieneCAE ? (
            <>
              <FileCheck className="h-5 w-5 mr-2 text-green-500" />
              <span>
                {esNotaCredito
                  ? "Nota de Crédito Electrónica AFIP"
                  : "Factura Electrónica AFIP"}
              </span>
              <Badge className="ml-2 bg-gradient-to-r from-green-600 to-green-700 text-white">
                Autorizada
              </Badge>
            </>
          ) : (
            <>
              <AlertCircle className="h-5 w-5 mr-2 text-yellow-500" />
              <span>
                {esNotaCredito
                  ? "Nota de Crédito Pendiente AFIP"
                  : "Factura Pendiente AFIP"}
              </span>
              <Badge className="ml-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white">
                Sin CAE
              </Badge>
            </>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {tieneCAE ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-muted-foreground">CAE</p>
                <p className="font-mono">{cae}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Vencimiento</p>
                <p>
                  {vencimientoCae
                    ? new Date(vencimientoCae).toLocaleDateString()
                    : "No disponible"}
                </p>
              </div>
            </div>
            {afipComprobante && (
              <div>
                <p className="text-sm text-muted-foreground">
                  Número de comprobante AFIP
                </p>
                <p className="font-mono">{afipComprobante}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {esNotaCredito
                ? "Esta nota de crédito ha sido autorizada por AFIP y cuenta con un Código de Autorización Electrónico (CAE) válido."
                : "Esta factura ha sido autorizada por AFIP y cuenta con un Código de Autorización Electrónico (CAE) válido."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm">
              {esNotaCredito
                ? "Esta nota de crédito aún no ha sido registrada en AFIP o no se pudo obtener un CAE."
                : "Esta factura aún no ha sido registrada en AFIP o no se pudo obtener un CAE."}
            </p>
            <p className="text-xs text-muted-foreground">
              Posibles causas:
              <ul className="list-disc list-inside mt-1">
                <li>Problemas de conexión con AFIP</li>
                <li>Certificados no configurados</li>
                <li>Error en los datos de la factura</li>
              </ul>
            </p>
          </div>
        )}
      </CardContent>

      {tieneCAE && factura && (
        <CardFooter>
          <AfipFacturaButton factura={factura} onUpdate={onUpdate} />
        </CardFooter>
      )}
    </Card>
  );
}
