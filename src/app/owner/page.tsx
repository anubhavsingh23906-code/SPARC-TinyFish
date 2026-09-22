import { DashboardShell } from "@/components/dashboard-shell";
import { OwnerConsole } from "@/components/operations-console";

export default function Page() {
	return (
		<DashboardShell role="OWNER">
			<section>
				<p className="eyebrow">Owner operations</p>

				<h1 className="mb-6 text-3xl font-bold">
					Your spaces, trusted and active
				</h1>

				<OwnerConsole />
			</section>
		</DashboardShell>
	);
}

