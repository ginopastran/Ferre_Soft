import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Trash2, Plus } from "lucide-react";
import { EditableInput } from "./EditableInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface ProductTableRowProps {
  product: Product;
  savedFields: { [key: string]: boolean };
  onInputChange: (id: number, field: string, value: string) => void;
  onDelete: (id: number) => void;
}

export const ProductTableRow: React.FC<ProductTableRowProps> = ({
  product,
  savedFields,
  onInputChange,
  onDelete,
}) => {
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [stockToAdd, setStockToAdd] = useState("");

  const handleNumericChange = (id: number, field: string, value: string) => {
    if (value === "" || value === "-") {
      onInputChange(id, field, "");
      return;
    }
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      onInputChange(id, field, numValue.toString());
    }
  };

  const handleAddStock = () => {
    if (stockToAdd) {
      const currentStock = parseFloat(product.stock.toString()) || 0;
      const addAmount = parseFloat(stockToAdd);
      if (!isNaN(addAmount) && addAmount > 0) {
        const newStock = (currentStock + addAmount).toString();
        onInputChange(product.id, "stock", newStock);
        setStockToAdd("");
        setIsAddStockOpen(false);
      }
    }
  };

  return (
    <>
      <TableRow>
        <TableCell>
          <EditableInput
            value={product.name}
            onChange={(value) => onInputChange(product.id, "name", value)}
            width="w-[200px]"
            isSaved={savedFields[`${product.id}-name`]}
          />
        </TableCell>
        <TableCell>
          <div className="relative">
            <Select
              value={product.unit}
              onValueChange={(value) =>
                onInputChange(product.id, "unit", value)
              }
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Unidad">Unidad</SelectItem>
                <SelectItem value="Kg">Kg</SelectItem>
              </SelectContent>
            </Select>
            {savedFields[`${product.id}-unit`] && (
              <CheckCircle2 className="h-4 w-4 absolute right-8 top-1/2 -translate-y-1/2" />
            )}
          </div>
        </TableCell>
        <TableCell>
          <EditableInput
            type="number"
            value={product.pricePerUnit || ""}
            onChange={(value) =>
              handleNumericChange(product.id, "pricePerUnit", value)
            }
            width="w-[130px]"
            prefix="$"
            isSaved={savedFields[`${product.id}-pricePerUnit`]}
          />
        </TableCell>
        <TableCell>
          <EditableInput
            type="number"
            value={product.margen || ""}
            onChange={(value) =>
              handleNumericChange(product.id, "margen", value)
            }
            width="w-[130px]"
            prefix="%"
            isSaved={savedFields[`${product.id}-margen`]}
          />
        </TableCell>
        <TableCell>
          <EditableInput
            type="number"
            value={product.price || ""}
            onChange={(value) =>
              handleNumericChange(product.id, "price", value)
            }
            width="w-[130px]"
            prefix="$"
            isSaved={savedFields[`${product.id}-price`]}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <EditableInput
              type="number"
              value={product.stock || ""}
              onChange={(value) =>
                handleNumericChange(product.id, "stock", value)
              }
              width="w-[130px]"
              prefix={product.unit === "Kg" ? "Kg" : "U"}
              isSaved={savedFields[`${product.id}-stock`]}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsAddStockOpen(true)}
              className="h-8 w-8 bg-indigo-gradient text-white hover:text-white"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(product.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TableCell>
      </TableRow>

      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent className="w-[90vw] md:w-full rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-indigo-gradient">
              Añadir stock a {product.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Ingrese cantidad a añadir en{" "}
                {product.unit === "Kg" ? "kilogramos" : "unidades"}:
              </label>
              <Input
                type="number"
                value={stockToAdd}
                onChange={(e) => setStockToAdd(e.target.value)}
                placeholder={`Cantidad en ${
                  product.unit === "Kg" ? "Kg" : "unidades"
                }`}
              />
            </div>
            <Button
              onClick={handleAddStock}
              className="w-full bg-indigo-gradient text-white hover:text-white"
            >
              Añadir stock
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
