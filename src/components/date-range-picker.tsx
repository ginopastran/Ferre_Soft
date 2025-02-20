"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const PERIODS = {
  all: "Todo",
  today: "Hoy",
  yesterday: "Ayer",
  thisWeek: "Esta semana",
  lastWeek: "Semana pasada",
  thisMonth: "Este mes",
  lastMonth: "Mes pasado",
  thisYear: "Este año",
};

interface DateRangePickerProps {
  onPeriodChange: (period: string) => void;
}

export function DateRangePicker({ onPeriodChange }: DateRangePickerProps) {
  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={onPeriodChange} defaultValue="all">
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Seleccionar período" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(PERIODS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
