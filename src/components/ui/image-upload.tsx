import { ChangeEvent, useState } from "react";
import { Button } from "./button";
import { Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  currentImage?: string;
}

export function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      handleImageSelect(file);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSelect = async (file: File) => {
    try {
      const base64 = await convertToBase64(file);
      if (typeof base64 === "string") {
        onImageSelect(base64);
      } else {
        toast.error("Error al procesar la imagen");
      }
    } catch (error) {
      console.error("Error al procesar la imagen:", error);
      toast.error("Error al procesar la imagen. Intente con otra imagen.");
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {preview ? (
        <div className="relative w-40 h-40">
          <Image
            src={preview}
            alt="Preview"
            fill
            className="object-cover rounded-md"
          />
        </div>
      ) : null}
      <Button variant="outline" className="w-full" asChild>
        <label className="cursor-pointer">
          <Upload className="w-4 h-4 mr-2" />
          Subir Imagen
          <input
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleImageChange}
          />
        </label>
      </Button>
    </div>
  );
}
