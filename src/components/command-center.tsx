"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

type CityIntelligence = {
	generatedAt: string;
	city: {
		capacity: number;
		available: number;
		occupied: number;
		utilization: number;
	};
	zones: Array<{
		zone: string;
		capacity: number;
		available: number;
		spaces: number;
		utilization: number;
		status: "NORMAL" | "BUSY" | "CRITICAL";
	}>;
	alerts: {
		criticalZones: number;
		busyZones: number;
		incidents: number;
	};
	interventions: Array<{
		id: string;
		zone: string;
		action: string;
		status: string;
		actor: string;
		createdAt: string;
	}>;
};

export function CityCommand() {
	const [intelligence, setIntelligence] =
		useState<CityIntelligence | null>(null);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState("");

	const loadIntelligence = useCallback(
		async (manual = false) => {
			try {
				if (manual) {
					setRefreshing(true);
				}

				const response = await fetch(
					"/api/city/intelligence",
					{ cache: "no-store" },
				);
				const data = await response.json().catch(() => ({}));

				if (!response.ok || !data.ok) {
					throw new Error(
						`HTTP ${response.status}: ${data.error ?? "Unable to load city intelligence"}`,
					);
				}

				setIntelligence(data.intelligence);
				setError("");
			} catch (loadError) {
				setError(
					loadError instanceof Error
						? loadError.message
						: "Unable to load city intelligence",
				);
			} finally {
				setLoading(false);
				setRefreshing(false);
			}
		},
		[],
	);

	useEffect(() => {
		void loadIntelligence();
	}, [loadIntelligence]);

	if (loading) {
		return (
			<div className="panel p-8 text-sm text-slate-500">
				Loading live city intelligence...
			</div>
		);
	}

	if (error && !intelligence) {
		return (
			<div className="panel p-6">
				<p className="font-bold text-red-700">
					City command center unavailable
				</p>
				<p className="mt-2 text-sm text-red-600">
					{error}
				</p>
				<button
					type="button"
					onClick={() => void loadIntelligence(true)}
					className="mt-4 flex items-center gap-2 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white"
				>
					<RefreshCw size={15} />
					Retry
				</button>
			</div>
		);
	}

	if (!intelligence) {
		return null;
	}

	const activeAlerts =
		intelligence.alerts.criticalZones +
		intelligence.alerts.busyZones +
		intelligence.alerts.incidents;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between gap-4">
				<p className="text-sm text-slate-500">
					Live network state · measured {new Date(intelligence.generatedAt).toLocaleTimeString()}
				</p>
				<button
					type="button"
					onClick={() => void loadIntelligence(true)}
					disabled={refreshing}
					className="flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold disabled:opacity-60"
				>
					<RefreshCw
						size={14}
						className={refreshing ? "animate-spin" : ""}
					/>
					{refreshing ? "Refreshing..." : "Refresh"}
				</button>
			</div>

			{error && (
				<div className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
					Refresh failed. Displayed city data may be stale: {error}
				</div>
			)}

			<div className="grid gap-4 md:grid-cols-4">
				{[
					["Total capacity", intelligence.city.capacity],
					["Available", intelligence.city.available],
					["Occupied", intelligence.city.occupied],
					["Active alerts", activeAlerts],
				].map(([label, value]) => (
					<div className="panel p-5" key={label}>
						<p className="eyebrow">{label}</p>
						<p className="mt-3 text-3xl font-bold">{value}</p>
						<p className="mt-1 text-xs text-slate-500">
							{label === "Active alerts"
								? `${intelligence.city.utilization}% network utilization`
								: "Verified active inventory"}
						</p>
					</div>
				))}
			</div>

			<div className="grid gap-6 lg:grid-cols-2">
				<div className="panel overflow-hidden">
					<div className="p-5">
						<p className="eyebrow">Live zone state</p>
						<h2 className="text-xl font-bold">
							Pressure by urban zone
						</h2>
					</div>

					{intelligence.zones.length === 0 ? (
						<p className="border-t p-6 text-sm text-slate-500">
							No verified active zones are currently available.
						</p>
					) : (
						intelligence.zones.map((zone) => (
							<Link
								href="/city/intelligence"
								className="flex items-center justify-between border-t p-4 hover:bg-cloud"
								key={zone.zone}
							>
								<div>
									<b>{zone.zone}</b>
									<p className="text-sm text-slate-500">
										{zone.available}/{zone.capacity} available · {zone.spaces} active spaces
									</p>
								</div>
								<span
									className={`chip ${
										zone.status === "CRITICAL"
											? "bg-red-50 text-red-700"
											: zone.status === "BUSY"
												? "bg-amber-50 text-amber-800"
												: "bg-emerald-50 text-emerald-700"
									}`}
								>
									{zone.utilization}% · {zone.status}
								</span>
							</Link>
						))
					)}
				</div>

				<div className="panel p-5">
					<p className="eyebrow">City status</p>
					<h2 className="text-xl font-bold">
						Action, not automation
					</h2>

					{activeAlerts > 0 ? (
						<div className="mt-4 rounded-xl bg-amber-50 p-4">
							<div className="flex gap-2">
								<AlertTriangle size={17} className="text-amber-700" />
								<b>{activeAlerts} active city signals</b>
							</div>
							<p className="mt-2 text-sm">
								{intelligence.alerts.criticalZones} critical zones, {intelligence.alerts.busyZones} busy zones, and {intelligence.alerts.incidents} active incidents.
							</p>
							<Link
								href="/city/intelligence"
								className="mt-3 inline-block text-sm font-bold text-ink"
							>
								Open Intelligence →
							</Link>
						</div>
					) : (
						<p className="mt-4 text-sm text-slate-500">
							No active capacity signals in the live network.
						</p>
					)}

					<div className="mt-5 rounded-xl bg-cloud p-4">
						<p className="text-sm font-semibold">
							{intelligence.interventions.length} active interventions
						</p>
						<p className="mt-1 text-xs text-slate-500">
							Persisted operator decisions from the live Intelligence surface.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
export function AdminCommand(){return <div className="space-y-6"><div className="grid gap-4 md:grid-cols-4">{[["Users","4"],["Active spaces","34"],["Gross booking value","₹2.4L"],["SPARC revenue","₹19.2K"],["STAR members","1"],["Open incidents","4"],["Refunds","₹1,280"],["Verification queue","8"]].map(x=><div className="panel p-4" key={x[0]}><p className="eyebrow">{x[0]}</p><p className="mt-2 text-2xl font-bold">{x[1]}</p></div>)}</div><div className="panel p-6"><p className="eyebrow">Platform governance</p><h2 className="text-xl font-bold">System health</h2><div className="mt-4 grid gap-3 text-sm sm:grid-cols-2"><p>Database <b className="float-right">Configured when Mongo URI exists</b></p><p>Intelligence <b className="float-right">Operational</b></p><p>Map <b className="float-right">Operational</b></p><p>Payment <b className="float-right">Mock provider</b></p><p>EV <b className="float-right">Simulation</b></p></div><Link href="/admin/audit" className="mt-6 inline-block rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white">Open audit log</Link></div></div>}

