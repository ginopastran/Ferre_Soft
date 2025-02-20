import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Filter, List, X } from "lucide-react";

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onFilterClick: () => void;
  onSortClick: () => void;
  showClearFilters: boolean;
  onClearFilters: () => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  searchTerm,
  onSearchChange,
  onFilterClick,
  onSortClick,
  showClearFilters,
  onClearFilters,
}) => {
  return (
    <div className="flex items-center gap-2">
      <Input
        placeholder="Buscar productos..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-sm"
      />
      <Button variant="outline" size="icon" onClick={onFilterClick}>
        <Filter className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" onClick={onSortClick}>
        <List className="h-4 w-4" />
      </Button>
      {showClearFilters && (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="mr-2 h-4 w-4" />
          Limpiar filtros
        </Button>
      )}
    </div>
  );
};
