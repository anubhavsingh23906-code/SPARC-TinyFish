import { DashboardShell } from "@/components/dashboard-shell";
import { VerificationConsole } from "@/components/operations-console";

export default function Page() {
  return (
    <DashboardShell role="ADMIN">
      <section>
        <p className="eyebrow">Platform trust</p>

        <h1 className="mb-6 text-3xl font-bold">
          Verification administration
        </h1>

        <VerificationConsole mode="ADMIN" />
      </section>
    </DashboardShell>
  );
}

