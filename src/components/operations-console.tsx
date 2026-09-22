"use client";

import {
  AlertTriangle,
  BadgeIndianRupee,
  CheckCircle2,
  ClipboardCheck,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { formatINR } from "@/lib/currency";

type VerificationStatus =
  | "APPROVED"
  | "PENDING"
  | "CHANGES_REQUESTED"
  | "REJECTED";

type VerificationRow = {
  id: string;
  name: string;
  status: VerificationStatus;
  capacity: string;
  freshness: string;
  submittedAt?: string;
  reviewNote?: string;
};

export function OwnerConsole() {
  const [dashboard, setDashboard] =
    useState<any>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const loadDashboard = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const response = await fetch(
          "/api/owner/dashboard",
          {
            cache: "no-store",
          },
        );

        const body =
          await response.json();

        if (!response.ok) {
          throw new Error(
            body?.error ??
              "OWNER_DASHBOARD_FAILED",
          );
        }

        setDashboard(
          body.dashboard ?? null,
        );

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "OWNER_DASHBOARD_FAILED",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadDashboard();

    const interval =
      window.setInterval(() => {
        void loadDashboard(true);
      }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="panel p-8 text-sm text-slate-500">
        Loading owner operations...
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel p-6">
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="panel p-8 text-sm text-slate-500">
        No owner dashboard data available.
      </div>
    );
  }

  const metrics = dashboard.metrics;

  return (
    <div className="space-y-6">
      {/* =========================
          KPI CARDS
      ========================== */}

      <div className="grid gap-4 md:grid-cols-4">
        {[
          [
            "Today's reservations",
            String(
              metrics.todayReservations,
            ),
            ClipboardCheck,
          ],
          [
            "Gross revenue",
            formatINR(
              metrics.grossRevenue,
            ),
            BadgeIndianRupee,
          ],
          [
            "Net settlement",
            formatINR(
              metrics.netSettlement,
            ),
            CheckCircle2,
          ],
          [
            "Reliability",
            `${metrics.reliability}%`,
            ShieldCheck,
          ],
        ].map(
          ([label, value, Icon]) => {
            const C =
              Icon as typeof ClipboardCheck;

            return (
              <div
                className="panel p-5"
                key={label as string}
              >
                <C
                  className="text-signal"
                  size={19}
                />

                <p className="mt-5 text-2xl font-bold">
                  {value as string}
                </p>

                <p className="text-sm text-slate-500">
                  {label as string}
                </p>
              </div>
            );
          },
        )}
      </div>

      {/* =========================
          SPACES + QUALITY
      ========================== */}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_.7fr]">
        <div className="panel overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <div>
              <p className="eyebrow">
                Your spaces
              </p>

              <h2 className="text-xl font-bold">
                Availability controls
              </h2>
            </div>

            <a
              className="rounded-xl bg-ink px-3 py-2 text-sm font-bold text-white"
              href="/owner/spaces"
            >
              Manage spaces
            </a>
          </div>

          {dashboard.spaces.length ===
          0 ? (
            <div className="p-6 text-sm text-slate-500">
              You have not submitted any
              spaces yet.
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-cloud text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">
                      Space
                    </th>

                    <th>Trust</th>

                    <th>
                      Capacity
                    </th>

                    <th>
                      Availability
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dashboard.spaces.map(
                    (space: any) => (
                      <tr
                        className="border-t"
                        key={space.id}
                      >
                        <td className="p-4">
                          <div className="font-semibold">
                            {space.name}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {space.operationalStatus}
                          </div>
                        </td>

                        <td>
                          <span
                            className={`chip ${
                              space.status ===
                              "APPROVED"
                                ? "bg-emerald-50 text-emerald-700"
                                : space.status ===
                                    "REJECTED"
                                  ? "bg-red-50 text-red-700"
                                  : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {space.status}
                          </span>
                        </td>

                        <td>
                          {space.available} /{" "}
                          {space.capacity}
                        </td>

                        <td>
                          <span className="font-semibold">
                            {space.capacity >
                            0
                              ? Math.round(
                                  (space.available /
                                    space.capacity) *
                                    100,
                                )
                              : 0}
                            %
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="panel p-5">
          <p className="eyebrow">
            Fulfillment quality
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Live operational metrics
          </h2>

          <div className="mt-5 space-y-4 text-sm">
            <p className="flex justify-between">
              <span>
                Lifecycle progress
              </span>

              <b>
                {metrics.fulfillmentRate === null
                  ? "—"
                  : `${metrics.fulfillmentRate}%`}
              </b>
            </p>

            <p className="flex justify-between">
              <span>
                Space utilization
              </span>

              <b>
                {metrics.utilization}%
              </b>
            </p>

            <p className="flex justify-between">
              <span>
                Active spaces
              </span>

              <b>
                {metrics.activeSpaces}
              </b>
            </p>

            <p className="flex justify-between">
              <span>
                Pending verification
              </span>

              <b>
                {metrics.pendingSpaces}
              </b>
            </p>

            <div className="rounded-xl bg-amber-50 p-3 text-xs">
              <AlertTriangle
                size={14}
                className="mb-1 text-amber-700"
              />

              Reliability is calculated from
              verified operational performance.
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          RECENT RESERVATIONS
      ========================== */}

      <div className="panel overflow-hidden">
        <div className="p-5">
          <p className="eyebrow">
            Reservation activity
          </p>

          <h2 className="text-xl font-bold">
            Recent reservations
          </h2>
        </div>

        {dashboard.recentReservations
          .length === 0 ? (
          <div className="border-t p-6 text-sm text-slate-500">
            No reservations have been
            recorded for your spaces yet.
          </div>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-cloud text-xs uppercase text-slate-500">
                <tr>
                  <th className="p-4">
                    Reference
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Amount
                  </th>

                  <th>
                    Owner settlement
                  </th>
                </tr>
              </thead>

              <tbody>
                {dashboard.recentReservations.map(
                  (reservation: any) => (
                    <tr
                      className="border-t"
                      key={reservation.id}
                    >
                      <td className="p-4 font-semibold">
                        {reservation.reference}
                      </td>

                      <td>
                        <span className="chip bg-cloud">
                          {
                            reservation.status
                          }
                        </span>
                      </td>

                      <td>
                        {formatINR(
                          reservation.amount,
                        )}
                      </td>

                      <td className="font-semibold">
                        {formatINR(
                          reservation.ownerSettlement,
                        )}
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function VerificationConsole({
  mode = "ADMIN",
}: {
  mode?: "ADMIN" | "OWNER";
}) {
  const [rows, setRows] = useState<VerificationRow[]>([]);

  const [loading, setLoading] = useState(true);

  const [actionId, setActionId] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const canReview = mode === "ADMIN";

  const loadRows = useCallback(
    async (silent = false) => {
      try {
        if (!silent) {
          setLoading(true);
        }

        const response = await fetch("/api/verifications", {
          cache: "no-store",
        });

        const body = await response.json();

        if (!response.ok) {
          throw new Error(
            body?.error ?? "VERIFICATION_LOAD_FAILED",
          );
        }

        const verificationRows: VerificationRow[] = (
          body.verifications ?? []
        ).map((verification: any) => {
          const space = verification.spaceId;

          return {
            id: String(
              verification._id ??
                verification.id,
            ),

            name:
              space?.title ??
              "Unnamed space",

            status:
              verification.status ??
              "PENDING",

            capacity: String(
              space?.capacity ?? 0,
            ),

            freshness:
              verification.reviewedAt
                ? "Reviewed"
                : "Awaiting review",

            submittedAt:
              verification.createdAt,

            reviewNote:
              verification.reviewNote ??
              "",
          };
        });

        setRows(verificationRows);

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "VERIFICATION_LOAD_FAILED",
        );
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    void loadRows();

    const interval = window.setInterval(() => {
      void loadRows(true);
    }, 3000);

    return () => {
      window.clearInterval(interval);
    };
  }, [loadRows]);

  async function review(
    id: string,
    decision:
      | "APPROVED"
      | "REJECTED"
      | "CHANGES_REQUESTED",
  ) {
    if (!canReview) {
      return;
    }

    try {
      setActionId(id);

      setError(null);

      const reviewNote =
        decision === "APPROVED"
          ? "Space details verified by SPARC administrator."
          : decision === "CHANGES_REQUESTED"
            ? "Please update the submitted space details before resubmission."
            : "Space did not meet verification requirements.";

      const response = await fetch(
        `/api/verifications/${id}/review`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            decision,
            reviewNote,
          }),
        },
      );

      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body?.error ??
            "VERIFICATION_REVIEW_FAILED",
        );
      }

      await loadRows(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "VERIFICATION_REVIEW_FAILED",
      );
    } finally {
      setActionId(null);
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="eyebrow">
            {canReview
              ? "Administrator review"
              : "Owner verification status"}
          </p>

          <h2 className="text-xl font-bold">
            Verification queue
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Verification status is synchronized
            with the SPARC database.
          </p>

          {!canReview && (
            <div className="mt-4 rounded-xl bg-cloud p-3 text-sm text-slate-600">
              Your submission is reviewed by
              SPARC administrators. Owners cannot
              approve their own spaces.
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => void loadRows()}
          className="rounded-lg border p-2"
          title="Refresh"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {error && (
        <div className="mx-5 mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 text-sm text-slate-500">
          Loading verification records...
        </div>
      ) : rows.length === 0 ? (
        <div className="p-8 text-sm text-slate-500">
          No verification records found.
        </div>
      ) : (
        <div className="divide-y">
          {rows.map((row) => (
            <div
              className="p-5"
              key={row.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <b>{row.name}</b>

                  <p className="text-sm text-slate-500">
                    Capacity: {row.capacity}
                  </p>
                </div>

                <span
                  className={`chip ${
                    row.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-700"
                      : row.status ===
                            "CHANGES_REQUESTED" ||
                        row.status === "REJECTED"
                        ? "bg-red-50 text-red-700"
                        : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {row.status}
                </span>

                {canReview &&
                row.status === "PENDING" ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={
                        actionId === row.id
                      }
                      onClick={() =>
                        void review(
                          row.id,
                          "CHANGES_REQUESTED",
                        )
                      }
                      className="rounded-lg border px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                      {actionId === row.id
                        ? "Saving..."
                        : "Request changes"}
                    </button>

                    <button
                      type="button"
                      disabled={
                        actionId === row.id
                      }
                      onClick={() =>
                        void review(
                          row.id,
                          "APPROVED",
                        )
                      }
                      className="rounded-lg bg-ink px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    >
                      {actionId === row.id
                        ? "Saving..."
                        : "Approve"}
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-medium text-slate-500">
                    {row.status === "APPROVED"
                      ? "Verification complete"
                      : row.status === "PENDING"
                        ? "Awaiting administrator review"
                        : row.status ===
                            "CHANGES_REQUESTED"
                          ? "Changes requested"
                          : "Verification rejected"}
                  </span>
                )}
              </div>

              {row.reviewNote && (
                <div className="mt-4 rounded-xl border border-border bg-muted/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Administrator note
                  </p>

                  <p className="mt-1 text-sm">
                    {row.reviewNote}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}