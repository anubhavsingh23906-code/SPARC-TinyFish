"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";

type AuditEvent = {
	id: string;
	action: string;
	actor: string;
	actorRole: string;
	entity: string;
	entityId: string;
	timestamp: string | null;
};

export default function Page() {
	const [events, setEvents] = useState<AuditEvent[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		async function loadAudit() {
			try {
				const response = await fetch("/api/admin/audit", {
					cache: "no-store",
				});
				const data = await response.json();

				if (!response.ok || !data.ok) {
					throw new Error(
						data.error ?? "AUDIT_LOAD_FAILED",
					);
				}

				setEvents(data.events ?? []);
				setError("");
			} catch (loadError) {
				setError(
					loadError instanceof Error
						? loadError.message
						: "AUDIT_LOAD_FAILED",
				);
			} finally {
				setLoading(false);
			}
		}

		void loadAudit();
	}, []);

	return (
		<DashboardShell role="ADMIN">
			<section>
				<p className="eyebrow">Governance</p>

				<h1 className="mb-6 text-3xl font-bold">
					Audit log
				</h1>

				<div className="panel overflow-hidden">
					{loading ? (
						<p className="p-8 text-sm text-slate-500">
							Loading recorded activity...
						</p>
					) : error ? (
						<p className="p-8 text-sm text-red-700">
							Unable to load audit events: {error}
						</p>
					) : events.length === 0 ? (
						<p className="p-8 text-sm text-slate-500">
							No recorded activity yet.
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full min-w-[720px] text-left text-sm">
								<thead className="bg-cloud text-xs uppercase text-slate-500">
									<tr>
										<th className="p-4">Time</th>
										<th>Actor</th>
										<th>Action</th>
										<th>Entity</th>
										<th>Entity ID</th>
									</tr>
								</thead>

								<tbody>
									{events.map((event) => (
										<tr className="border-t" key={event.id}>
											<td className="whitespace-nowrap p-4 text-slate-500">
												{event.timestamp
													? new Date(event.timestamp).toLocaleString()
													: "Unknown time"}
											</td>
											<td>
												<div className="font-semibold">
													{event.actor}
												</div>
												<div className="text-xs text-slate-500">
													{event.actorRole}
												</div>
											</td>
											<td className="font-semibold">
												{event.action}
											</td>
											<td>{event.entity}</td>
											<td className="max-w-56 truncate text-slate-500">
												{event.entityId || "-"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</section>
		</DashboardShell>
	);
}

