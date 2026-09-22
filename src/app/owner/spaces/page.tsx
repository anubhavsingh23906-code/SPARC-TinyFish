import { DashboardShell } from "@/components/dashboard-shell";
import { OwnerSpaceForm } from "@/components/owner-space-form";

export default function Page() {
  return (
    <DashboardShell role="OWNER">
      <section>
        <p className="eyebrow">Owner operations</p>

        <h1 className="mb-6 text-3xl font-bold">
          Spaces & availability
        </h1>

        <OwnerSpaceForm />
      </section>
    </DashboardShell>
  );
}
