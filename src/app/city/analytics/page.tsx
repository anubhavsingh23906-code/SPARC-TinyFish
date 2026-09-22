import { DashboardShell } from "@/components/dashboard-shell";
import { CityAnalytics } from "@/components/city-analytics";

export default function CityAnalyticsPage() {
  return (
    <DashboardShell>
      <section className="mx-auto max-w-7xl">
        <CityAnalytics />
      </section>
    </DashboardShell>
  );
}