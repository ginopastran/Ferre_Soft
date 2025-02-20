import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { getSession } from "@/lib/session";
import Script from "next/script";
import { headers } from "next/headers";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const session = await getSession(headersList);

  if (!session?.user) {
    redirect("/login");
  }

  const cookieStore = await cookies();
  const isCollapsed = cookieStore.get("sidebar:state")?.value !== "true";

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <AppSidebar activeUrl="/admin/paltai" />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </>
  );
}
