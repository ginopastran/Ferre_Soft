"use client";

import { useEffect, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Legend } from "recharts";
import { PaymentMethodsChartSkeleton } from "./reporte/PaymentMethodsChartSkeleton";

interface PaymentMethodStats {
  name: string;
  value: number;
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const PAYMENT_METHOD_NAMES = {
  efectivo: "Efectivo",
  tarjeta: "Tarjeta",
  transferencia: "Transferencia",
  mercadoPago: "Mercado Pago",
};

export function PaymentMethodsChart() {
  const [paymentStats, setPaymentStats] = useState<PaymentMethodStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPaymentStats = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/ordenes");
        const ordenes = await response.json();

        // Crear un mapa para contar los métodos de pago
        const paymentCounts = new Map<string, number>();

        // Contar cada método de pago
        ordenes.forEach((orden: any) => {
          const method = orden.metodoPago;
          paymentCounts.set(
            method,
            (paymentCounts.get(method) || 0) + orden.total
          );
        });

        // Convertir el mapa a array y formatear para el gráfico
        const stats = Array.from(paymentCounts.entries()).map(
          ([method, total]) => ({
            name: PAYMENT_METHOD_NAMES[
              method as keyof typeof PAYMENT_METHOD_NAMES
            ],
            value: Number(total.toFixed(2)),
          })
        );

        setPaymentStats(stats);
      } catch (error) {
        console.error("Error al obtener estadísticas de pagos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaymentStats();
  }, []);

  if (loading) return <PaymentMethodsChartSkeleton />;

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={paymentStats}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({
              cx,
              cy,
              midAngle,
              innerRadius,
              outerRadius,
              value,
              index,
            }) => {
              const RADIAN = Math.PI / 180;
              const radius = 25 + innerRadius + (outerRadius - innerRadius);
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);

              return (
                <text
                  x={x}
                  y={y}
                  fill="#888"
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                >
                  ${value.toLocaleString()}
                </text>
              );
            }}
          >
            {paymentStats.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
