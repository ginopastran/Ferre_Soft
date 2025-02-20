"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { DateRangePicker } from "@/components/admin/date-range-picker";
import { Overview } from "@/components/admin/overview";
import { PaymentMethodsChart } from "@/components/admin/payment-methods-chart";
import { RecentSales } from "@/components/admin/recent-sales";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Apple,
  ChartBar,
  DollarSign,
  HandCoins,
  PiggyBank,
  Users,
} from "lucide-react";
import { StatCardSkeleton } from "@/components/admin/reporte/StatCardSkeleton";
import { ReportTableSkeleton } from "@/components/admin/reporte/ReportTableSkeleton";

function ReporteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState(
    searchParams?.get("period") || "all"
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    ventasTotales: 0,
    cantidadClientes: 0,
    margenGanancia: 0,
    porcentajeVentas: 0,
    porcentajeClientes: 0,
    porcentajeMargen: 0,
  });

  const setUrlParam = (param: string, value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value === null) {
      params.delete(param);
    } else {
      params.set(param, value);
    }
    router.push(`/admin/reporte?${params.toString()}`);
  };

  useEffect(() => {
    const period = searchParams?.get("period") || "all";
    setSelectedPeriod(period);
    fetchStats();
  }, [searchParams]);

  // Función para obtener el rango de fechas según el período
  const getDateRange = (period: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (period) {
      case "today":
        return {
          start: new Date(today.setHours(0, 0, 0, 0)),
          end: new Date(today.setHours(23, 59, 59, 999)),
        };
      case "yesterday": {
        const start = new Date(today);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "thisWeek": {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      }
      case "lastWeek": {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() - 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(today);
        end.setDate(today.getDate() - today.getDay() - 1);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "thisMonth": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      }
      case "lastMonth": {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "thisYear": {
        const start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        return { start, end: now };
      }
      default:
        return null; // Para "all"
    }
  };

  // Define the getPreviousDateRange function
  const getPreviousDateRange = (currentRange: { start: Date; end: Date }) => {
    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    const prevEnd = new Date(currentRange.start);
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start: prevStart, end: prevEnd };
  };

  // Función para obtener estadísticas
  const fetchStats = async () => {
    setLoading(true);
    try {
      const dateRange = getDateRange(selectedPeriod);
      const response = await fetch("/api/ordenes");
      const ordenes = await response.json();

      const ordenesConFechas = ordenes.map((orden: any) => ({
        ...orden,
        fecha: new Date(orden.fecha),
      }));

      const ordenesFiltradas = dateRange
        ? ordenesConFechas.filter((orden: any) => {
            return (
              orden.fecha >= dateRange.start && orden.fecha <= dateRange.end
            );
          })
        : ordenesConFechas;

      const prevDateRange = dateRange ? getPreviousDateRange(dateRange) : null;
      const ordenesPeriodoAnterior = prevDateRange
        ? ordenesConFechas.filter((orden: any) => {
            return (
              orden.fecha >= prevDateRange.start &&
              orden.fecha <= prevDateRange.end
            );
          })
        : ordenesConFechas;

      const ventasEsteMes = ordenesFiltradas.reduce(
        (sum: number, orden: any) => sum + orden.total,
        0
      );

      const ventasUltimoMes = ordenesPeriodoAnterior.reduce(
        (sum: number, orden: any) => sum + orden.total,
        0
      );

      const clientesEsteMes = ordenesFiltradas.length;
      const clientesUltimoMes = ordenesPeriodoAnterior.length;

      const margenEsteMes = ordenesFiltradas.reduce(
        (sum: number, orden: any) => {
          return (
            sum +
            orden.detalles.reduce((subtotal: number, detalle: any) => {
              const costoTotal = detalle.costo * detalle.cantidad;
              const ventaTotal = detalle.subtotal;
              return subtotal + (ventaTotal - costoTotal);
            }, 0)
          );
        },
        0
      );

      const margenUltimoMes = ordenesPeriodoAnterior.reduce(
        (sum: number, orden: any) => {
          return (
            sum +
            orden.detalles.reduce((subtotal: number, detalle: any) => {
              const costoTotal = detalle.costo * detalle.cantidad;
              const ventaTotal = detalle.subtotal;
              return subtotal + (ventaTotal - costoTotal);
            }, 0)
          );
        },
        0
      );

      const calculatePercentageChange = (current: number, previous: number) => {
        if (previous === 0) {
          return current > 0 ? 100 : 0;
        }
        return Number((((current - previous) / previous) * 100).toFixed(2));
      };

      setStats({
        ventasTotales: ventasEsteMes,
        cantidadClientes: clientesEsteMes,
        margenGanancia: margenEsteMes,
        porcentajeVentas: calculatePercentageChange(
          ventasEsteMes,
          ventasUltimoMes
        ),
        porcentajeClientes: calculatePercentageChange(
          clientesEsteMes,
          clientesUltimoMes
        ),
        porcentajeMargen: calculatePercentageChange(
          margenEsteMes,
          margenUltimoMes
        ),
      });
    } catch (error) {
      console.error("Error al obtener estadísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Llamar a fetchStats cuando cambie el período
  useEffect(() => {
    fetchStats();
  }, [selectedPeriod]);

  const activeUrl = "/admin/reporte";

  const getComparisonText = (period: string) => {
    switch (period) {
      case "today":
      case "yesterday":
        return "respecto al día anterior";
      case "thisWeek":
      case "lastWeek":
        return "respecto a la semana anterior";
      case "thisMonth":
      case "lastMonth":
        return "respecto al mes anterior";
      case "thisYear":
        return "respecto al año anterior";
      default:
        return "respecto al período anterior";
    }
  };

  return (
    <>
      <header className="flex h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-indigo-gradient">
            Reporte de ventas
          </h2>
        </div>
      </header>

      <div className="flex-col md:flex">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">Elegir período</p>
            <DateRangePicker
              onPeriodChange={(period) => {
                setUrlParam("period", period === "all" ? null : period);
              }}
              value={selectedPeriod}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {loading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ventas Totales
                    </CardTitle>
                    <div className="bg-indigo-gradient rounded p-1">
                      <DollarSign className="text-white size-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${stats.ventasTotales.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.porcentajeVentas > 0 ? "+" : ""}
                      {stats.porcentajeVentas}%{" "}
                      {getComparisonText(selectedPeriod)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Cantidad de Ventas
                    </CardTitle>
                    <div className=" bg-indigo-gradient rounded p-1">
                      <HandCoins className="text-white size-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.cantidadClientes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.porcentajeClientes > 0 ? "+" : ""}
                      {stats.porcentajeClientes}% respecto al mes anterior
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total margen de ganancia
                    </CardTitle>
                    <div className=" bg-indigo-gradient rounded p-1">
                      <DollarSign className="text-white size-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${stats.margenGanancia.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {stats.porcentajeMargen > 0 ? "+" : ""}
                      {stats.porcentajeMargen}% respecto al mes anterior
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-6">
            <Card className="col-span-1 md:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="">Resumen Anual de Ventas</CardTitle>
                <div className=" bg-indigo-gradient rounded p-1">
                  <ChartBar className="text-white size-6 rotate-[270deg]" />
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="">Productos Más Vendidos</CardTitle>
                <div className=" bg-indigo-gradient rounded p-1">
                  <Apple className="text-white size-6 " />
                </div>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="">Métodos de Pago</CardTitle>
                <div className=" bg-indigo-gradient rounded p-1">
                  <PiggyBank className="text-white size-6 " />
                </div>
              </CardHeader>
              <CardContent>
                <PaymentMethodsChart />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <SidebarProvider>
      <AppSidebar activeUrl="/admin/reporte" />
      <SidebarInset>
        <Suspense fallback={<ReportTableSkeleton />}>
          <ReporteContent />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}
