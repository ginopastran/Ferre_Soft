"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { OverviewSkeleton } from "@/components/admin/reporte/OverviewSkeleton";

interface MonthlyData {
  name: string;
  total: number;
}

const MONTHS = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];

export function Overview() {
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMonthlyData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/ordenes");
        const ordenes = await response.json();

        // Inicializar array con todos los meses en 0
        const monthlyTotals = MONTHS.map((name) => ({
          name,
          total: 0,
        }));

        // Sumar ventas por mes
        ordenes.forEach((orden: any) => {
          const date = new Date(orden.fecha);
          const monthIndex = date.getMonth();
          monthlyTotals[monthIndex].total += orden.total;
        });

        // Redondear totales a 2 decimales
        monthlyTotals.forEach((month) => {
          month.total = Number(month.total.toFixed(2));
        });

        setMonthlyData(monthlyTotals);
      } catch (error) {
        console.error("Error al obtener datos mensuales:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthlyData();
  }, []);

  if (loading) return <OverviewSkeleton />;

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={monthlyData}>
        <defs>
          <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `$${value.toLocaleString()}`}
        />
        <Bar
          dataKey="total"
          fill="url(#barGradient)"
          radius={[4, 4, 0, 0]}
          name="Ventas"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
