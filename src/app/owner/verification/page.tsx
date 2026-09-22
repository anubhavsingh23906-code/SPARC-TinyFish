import { DashboardShell } from "@/components/dashboard-shell";
import { VerificationConsole } from "@/components/operations-console";

export default function Page() {
  return (
    <DashboardShell role="OWNER">
      <section>
        <p className="eyebrow">Trust workflow</p>

        <h1 className="mb-6 text-3xl font-bold">
          Space verification
        </h1>

        <VerificationConsole mode="OWNER" />
      </section>
    </DashboardShell>
  );
}

