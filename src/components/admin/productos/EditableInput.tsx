import { Input } from "@/components/ui/input";
import { CheckCircle2 } from "lucide-react";

interface EditableInputProps {
  value: string | number;
  onChange: (value: string) => void;
  type?: "text" | "number";
  prefix?: string;
  width?: string;
  isSaved?: boolean;
}

export const EditableInput: React.FC<EditableInputProps> = ({
  value,
  onChange,
  type = "text",
  prefix,
  width = "w-48",
  isSaved = false,
}) => {
  // Calcular el padding izquierdo basado en la longitud del prefijo
  const getPaddingLeft = () => {
    if (!prefix) return "";
    return prefix.length > 1 ? "pl-9" : "pl-7";
  };

  return (
    <div className={`relative ${width}`}>
      {prefix && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          {prefix}
        </span>
      )}
      <Input
        type={type}
        value={value}
        className={`w-full ${getPaddingLeft()} pr-8 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        onChange={(e) => onChange(e.target.value)}
      />
      {isSaved && (
        <CheckCircle2 className="h-4 w-4 absolute right-2 top-1/2 -translate-y-1/2" />
      )}
    </div>
  );
};
