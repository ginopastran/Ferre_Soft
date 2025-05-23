"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RubroToggleGroupProps {
  rubros: string[];
  activeRubro: string;
  onRubroChange: (rubro: string) => void;
  getProductosCount: (rubro?: string) => number;
}

export function RubroToggleGroup({
  rubros,
  activeRubro,
  onRubroChange,
  getProductosCount,
}: RubroToggleGroupProps) {
  return (
    <ScrollArea className="w-full">
      <div className="pb-4">
        <ToggleGroup
          type="single"
          value={activeRubro}
          onValueChange={(value) => value && onRubroChange(value)}
          className="inline-flex flex-nowrap gap-2 min-w-full md:flex-wrap md:justify-start"
        >
          <ToggleGroupItem
            value="todos"
            className="min-w-[120px] shrink-0 bg-white data-[state=on]:bg-cyan-600 data-[state=on]:text-white"
          >
            Todos ({getProductosCount()})
          </ToggleGroupItem>
          {rubros.map((rubro) => (
            <ToggleGroupItem
              key={rubro}
              value={rubro}
              className="min-w-[120px] shrink-0 bg-white data-[state=on]:bg-cyan-600 data-[state=on]:text-white"
            >
              {rubro} ({getProductosCount(rubro)})
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </ScrollArea>
  );
}
