import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardProviders } from "@/components/dashboard/dashboard-providers";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardProviders>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProviders>
  );
}