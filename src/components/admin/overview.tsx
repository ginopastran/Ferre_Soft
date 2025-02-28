"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

interface MonthlyData {
  name: string;
  total: number;
}

export function Overview() {
  const [data, setData] = useState<MonthlyData[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!user) return;

      try {
        const response = await fetch(
          `/api/facturas?userId=${user.id}&role=${user.rol.nombre}`
        );
        if (!response.ok) {
          throw new Error("Error al obtener datos mensuales");
        }
        const facturas = await response.json();

        // Procesar las facturas para obtener datos mensuales
        const monthlyTotals = new Map<string, number>();
        const months = [
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

        // Inicializar todos los meses en 0
        months.forEach((month, index) => {
          monthlyTotals.set(month, 0);
        });

        // Sumar las ventas por mes
        facturas.forEach((factura: any) => {
          const date = new Date(factura.fecha);
          const monthName = months[date.getMonth()];
          monthlyTotals.set(
            monthName,
            (monthlyTotals.get(monthName) || 0) + factura.total
          );
        });

        // Convertir el mapa a array para el gráfico
        const chartData = Array.from(monthlyTotals.entries()).map(
          ([name, total]) => ({
            name,
            total,
          })
        );

        setData(chartData);
      } catch (error) {
        console.error("Error al obtener datos mensuales:", error);
      }
    };

    fetchMonthlyData();
  }, [user]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
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
          tickFormatter={(value) => `$${value}`}
        />
        <Bar dataKey="total" fill="url(#gradient)" radius={[4, 4, 0, 0]} />
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
