import { DashboardShell } from "@/components/dashboard-shell";
import { CityCommand } from "@/components/command-center";

export default function Page() {
	return (
		<DashboardShell role="CITY_OPERATOR">
			<section>
				<p className="eyebrow">City operator · live data</p>

				<h1 className="mb-6 text-3xl font-bold">
					Urban space command center
				</h1>

				<CityCommand />
			</section>
		</DashboardShell>
	);
}
