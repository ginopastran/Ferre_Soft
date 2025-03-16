import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, TruckIcon } from "lucide-react";
import { RemitoButton } from "./RemitoButton";

interface RemitoInfoProps {
  remito: {
    id: string;
    numero: string;
    fecha: Date;
    tipoComprobante: string;
    estado: string;
  };
  onUpdate?: () => void;
}

export function RemitoInfo({ remito, onUpdate }: RemitoInfoProps) {
  return (
    <Card className="border-blue-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <TruckIcon className="h-5 w-5 mr-2 text-blue-500" />
          <span>Remito</span>
          <Badge className="ml-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            {remito.estado === "ANULADA" ? "Anulado" : "Activo"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <p className="text-sm text-muted-foreground">Número de Remito</p>
            <p className="font-mono">{remito.numero}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
            <p>{new Date(remito.fecha).toLocaleDateString()}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Este remito es un documento no fiscal que acredita la entrega de
            mercadería.
          </p>
        </div>
      </CardContent>

      <CardFooter>
        <RemitoButton remito={remito} onUpdate={onUpdate} />
      </CardFooter>
    </Card>
  );
}
