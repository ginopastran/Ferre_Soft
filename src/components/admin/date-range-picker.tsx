"use client";

import * as React from "react";
import {
  addDays,
  format,
  setHours,
  setMinutes,
  startOfDay,
  endOfDay,
} from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar1 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PERIODS = {
  all: "Todo",
  today: "Hoy",
  yesterday: "Ayer",
  thisWeek: "Esta semana",
  lastWeek: "Semana pasada",
  thisMonth: "Este mes",
  lastMonth: "Mes pasado",
  thisYear: "Este año",
} as const;

export interface DateRangePickerProps {
  onPeriodChange: (period: string) => void;
  value?: string;
}

export function DateRangePicker({
  onPeriodChange,
  value = "all",
}: DateRangePickerProps) {
  return (
    <div className="flex items-center space-x-2">
      <Select onValueChange={onPeriodChange} value={value}>
        <SelectTrigger className="w-[180px] shadow-md">
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
