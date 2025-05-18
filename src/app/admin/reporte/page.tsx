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
  ChartCandlestick,
  DollarSign,
  HandCoins,
  PiggyBank,
  Users,
} from "lucide-react";
import { StatCardSkeleton } from "@/components/admin/reporte/StatCardSkeleton";
import { ReportTableSkeleton } from "@/components/admin/reporte/ReportTableSkeleton";
import { toast } from "sonner";

interface Stats {
  ventasTotales: number;
  cantidadClientes: number;
  margenGanancia: number;
  porcentajeVentas: number;
  porcentajeClientes: number;
  porcentajeMargen: number;
}

function ReporteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPeriod, setSelectedPeriod] = useState(
    searchParams?.get("period") || "all"
  );
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    ventasTotales: 0,
    cantidadClientes: 0,
    margenGanancia: 0,
    porcentajeVentas: 0,
    porcentajeClientes: 0,
    porcentajeMargen: 0,
  });

  const getUserData = () => {
    try {
      const userData = document.cookie
        .split("; ")
        .find((row) => row.startsWith("userData="));
      if (!userData) return null;
      return JSON.parse(decodeURIComponent(userData.split("=")[1]));
    } catch (error) {
      console.error("Error al obtener datos del usuario:", error);
      return null;
    }
  };

  const setUrlParam = (param: string, value: string | null) => {
    const url = new URL(window.location.href);
    if (value) {
      url.searchParams.set(param, value);
    } else {
      url.searchParams.delete(param);
    }
    window.history.pushState({}, "", url);
  };

  useEffect(() => {
    const period = searchParams?.get("period") || "all";
    setSelectedPeriod(period);
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
        const end = new Date(now);
        return { start, end };
      }
      case "lastWeek": {
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay() - 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "thisMonth": {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        return { start, end };
      }
      case "lastMonth": {
        // Crear una nueva fecha para el primer día del mes actual
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start.setHours(0, 0, 0, 0);
        // Crear una nueva fecha para el último día del mes anterior
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        end.setHours(23, 59, 59, 999);
        return { start, end };
      }
      case "thisYear": {
        const start = new Date(now.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(now);
        return { start, end };
      }
      default:
        return null; // Para "all"
    }
  };

  // Define the getPreviousDateRange function
  const getPreviousDateRange = (currentRange: { start: Date; end: Date }) => {
    const duration = currentRange.end.getTime() - currentRange.start.getTime();
    const prevEnd = new Date(currentRange.start.getTime() - 1); // Restamos 1ms para no solapar períodos
    const prevStart = new Date(prevEnd.getTime() - duration);
    return { start: prevStart, end: prevEnd };
  };

  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }
    if (current === 0 && previous === 0) {
      return 0;
    }
    return Number(
      (((current - previous) / Math.abs(previous)) * 100).toFixed(2)
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replace("ARS", "$")
      .trim();
  };

  // Llamar a fetchStats cuando cambie el período seleccionado
  useEffect(() => {
    console.log("Fetching stats for period:", selectedPeriod);
    let isSubscribed = true;

    const doFetchStats = async () => {
      setLoading(true);
      try {
        const userData = getUserData();
        if (!userData) {
          toast.error("Usuario no autenticado");
          router.push("/login");
          return;
        }

        let currentRange = getDateRange(selectedPeriod);
        if (!currentRange) {
          if (selectedPeriod !== "all") {
            throw new Error("Rango de fechas inválido");
          }
          // Si es "all", usar un rango que incluya todo
          const endDate = new Date();
          const startDate = new Date(0); // 1970-01-01
          currentRange = { start: startDate, end: endDate };
        }

        console.log("Rango actual:", {
          period: selectedPeriod,
          start: currentRange.start.toISOString(),
          end: currentRange.end.toISOString(),
        });

        const response = await fetch(
          `/api/facturas?userId=${userData.id}&role=${
            userData.rol.nombre
          }&startDate=${currentRange.start.toISOString()}&endDate=${currentRange.end.toISOString()}`
        );

        if (!response.ok) {
          const errorData = await response.text();
          console.error("Error response:", errorData);
          throw new Error("Error al obtener estadísticas");
        }

        const facturas = await response.json();
        console.log("Facturas recibidas:", facturas.length);

        // Calcular estadísticas del período actual
        let totalVentas = 0;
        let totalClientes = new Set();
        let margenGanancia = 0;

        facturas.forEach((factura: any) => {
          totalVentas += factura.total;
          totalClientes.add(factura.clienteId);

          // Calcular margen de ganancia
          factura.detalles?.forEach((detalle: any) => {
            const costoTotal = detalle.producto.precioCosto * detalle.cantidad;
            margenGanancia += detalle.subtotal - costoTotal;
          });
        });

        // Obtener estadísticas del período anterior para comparación
        const previousRange = getPreviousDateRange(currentRange);
        const previousResponse = await fetch(
          `/api/facturas?userId=${userData.id}&role=${
            userData.rol.nombre
          }&startDate=${previousRange.start.toISOString()}&endDate=${previousRange.end.toISOString()}`
        );

        if (!previousResponse.ok) {
          throw new Error("Error al obtener estadísticas anteriores");
        }

        const facturasAnteriores = await previousResponse.json();

        // Calcular estadísticas del período anterior
        let ventasAnteriores = 0;
        let clientesAnteriores = new Set();
        let margenAnterior = 0;

        facturasAnteriores.forEach((factura: any) => {
          ventasAnteriores += factura.total;
          clientesAnteriores.add(factura.clienteId);

          // Calcular margen de ganancia anterior
          factura.detalles?.forEach((detalle: any) => {
            const costoTotal = detalle.producto.precioCosto * detalle.cantidad;
            margenAnterior += detalle.subtotal - costoTotal;
          });
        });

        // Calcular porcentajes de cambio
        const porcentajeVentas = calculatePercentageChange(
          totalVentas,
          ventasAnteriores
        );
        const porcentajeClientes = calculatePercentageChange(
          totalClientes.size,
          clientesAnteriores.size
        );
        const porcentajeMargen = calculatePercentageChange(
          margenGanancia,
          margenAnterior
        );

        if (isSubscribed) {
          setStats({
            ventasTotales: totalVentas,
            cantidadClientes: totalClientes.size,
            margenGanancia,
            porcentajeVentas,
            porcentajeClientes,
            porcentajeMargen,
          });
        }
      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        toast.error("Error al obtener estadísticas");
      } finally {
        if (isSubscribed) {
          setLoading(false);
        }
      }
    };

    doFetchStats();

    return () => {
      isSubscribed = false;
    };
  }, [selectedPeriod]);

  const activeUrl = "/admin/reporte";

  const getComparisonText = (period: string) => {
    switch (period) {
      case "today":
        return "respecto a ayer";
      case "yesterday":
        return "respecto al día anterior";
      case "thisWeek":
        return "respecto a la semana anterior";
      case "lastWeek":
        return "respecto a la semana previa";
      case "thisMonth":
        return "respecto al mes anterior";
      case "lastMonth":
        return "respecto al mes previo";
      case "thisYear":
        return "respecto al año anterior";
      case "all":
        return "Total histórico";
      default:
        return "respecto al período anterior";
    }
  };

  return (
    <>
      <header className="flex  h-12 md:h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-2 md:px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 md:mr-2 h-4" />
          <h2 className="text-3xl font-bold tracking-tight text-cyan-gradient">
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
              </>
            ) : (
              <>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Ventas Totales
                    </CardTitle>
                    <div className="bg-cyan-gradient rounded p-1">
                      <DollarSign className="text-white size-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.ventasTotales)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedPeriod === "all" ? (
                        getComparisonText("all")
                      ) : (
                        <>
                          {stats.porcentajeVentas > 0 ? "+" : ""}
                          {stats.porcentajeVentas}%{" "}
                          {getComparisonText(selectedPeriod)}
                        </>
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Cantidad de Ventas
                    </CardTitle>
                    <div className=" bg-cyan-gradient rounded p-1">
                      <HandCoins className="text-white size-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.cantidadClientes}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedPeriod === "all" ? (
                        getComparisonText("all")
                      ) : (
                        <>
                          {stats.porcentajeClientes > 0 ? "+" : ""}
                          {stats.porcentajeClientes}%{" "}
                          {getComparisonText(selectedPeriod)}
                        </>
                      )}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total margen de ganancia
                    </CardTitle>
                    <div className=" bg-cyan-gradient rounded p-1">
                      <DollarSign className="text-white size-5" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {formatCurrency(stats.margenGanancia)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {selectedPeriod === "all" ? (
                        getComparisonText("all")
                      ) : (
                        <>
                          {stats.porcentajeMargen > 0 ? "+" : ""}
                          {stats.porcentajeMargen}%{" "}
                          {getComparisonText(selectedPeriod)}
                        </>
                      )}
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-6">
            <Card className="col-span-1 md:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">
                  Resumen Anual de Ventas
                </CardTitle>
                <div className=" bg-cyan-gradient rounded p-1">
                  <ChartBar className="text-white size-6 rotate-[270deg]" />
                </div>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview />
              </CardContent>
            </Card>
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xl">
                  Productos Más Vendidos
                </CardTitle>
                <div className=" bg-cyan-gradient rounded p-1">
                  <ChartCandlestick className="text-white size-6 " />
                </div>
              </CardHeader>
              <CardContent>
                <RecentSales />
              </CardContent>
            </Card>
            {/* <Card className="col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="">Métodos de Pago</CardTitle>
                <div className=" bg-cyan-gradient rounded p-1">
                  <PiggyBank className="text-white size-6 " />
                </div>
              </CardHeader>
              <CardContent>
                <PaymentMethodsChart />
              </CardContent>
            </Card>
            */}
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
