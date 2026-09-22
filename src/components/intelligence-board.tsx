"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Gauge,
  Lightbulb,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

type CityAlert = {
  id: string;
  zone: string;
  type:
    | "CAPACITY_CRITICAL"
    | "CAPACITY_HIGH"
    | "DEMAND_INCREASING";
  severity:
    | "CRITICAL"
    | "HIGH"
    | "MEDIUM";
  title: string;
  message: string;
  recommendation: string;
  currentUtilization: number;
  predictedUtilization: number;
  confidence: number;
  createdAt: string;
};

type Zone = {
  zone: string;
  capacity: number;
  available: number;
  used: number;
  spaces: number;
  utilization: number;
  status: "NORMAL" | "BUSY" | "CRITICAL";
};

type ForecastZone = {
  zone: string;
  capacity: number;
  currentAvailable: number;
  currentUtilization: number;
  predictedAvailability: number;
  predictedUtilization: number;
  trend:
    | "INCREASING_DEMAND"
    | "DECREASING_DEMAND"
    | "STABLE"
    | "INSUFFICIENT_DATA";
  confidence: number;
  risk: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommendation: string;
  samples: number;
};

type Intelligence = {
  generatedAt: string;
  city: {
    capacity: number;
    available: number;
    occupied: number;
    utilization: number;
  };
  zones: Zone[];
  alerts: {
    criticalZones: number;
    busyZones: number;
    incidents: number;
  };
  criticalZones: Zone[];
  busyZones: Zone[];
  incidents: Array<{
    _id?: string;
    title?: string;
    description?: string;
    status?: string;
    severity?: string;
  }>;
  interventions: CityIntervention[];
};

type CityIntervention = {
  id: string;
  zone: string;
  action:
    | "REDIRECT_DEMAND"
    | "MARK_INTERVENTION"
    | "CREATE_ZONE_ALERT";
  alternatives: Array<{
    zone: string;
    utilization: number;
    available: number;
  }>;
  status: string;
  actor: string;
  actorRole: string;
  createdAt: string;
  updatedAt: string;
};

type Forecast = {
  generatedAt: string;
  zones: ForecastZone[];
};

export function forecastDisplayState(
  zone: Pick<ForecastZone, "trend" | "risk" | "samples">,
) {
  if (
    zone.trend === "INSUFFICIENT_DATA" ||
    zone.samples < 2
  ) {
    return {
      label: "INSUFFICIENT DATA",
      className: "chip bg-slate-100 text-slate-600",
    };
  }

  return {
    label: zone.risk,
    className:
      zone.risk === "CRITICAL"
        ? "chip bg-red-50 text-red-700"
        : zone.risk === "HIGH"
          ? "chip bg-amber-50 text-amber-700"
          : zone.risk === "MEDIUM"
            ? "chip bg-yellow-50 text-yellow-700"
            : "chip bg-emerald-50 text-emerald-700",
  };
}

export function getOperatorAlerts(
  interventions: CityIntervention[],
) {
  return interventions.filter(
    (intervention) =>
      intervention.action === "CREATE_ZONE_ALERT",
  );
}

function isAbortError(error: unknown) {
  return (
    error instanceof DOMException &&
    error.name === "AbortError"
  ) || (
    error instanceof Error &&
    error.name === "AbortError"
  );
}

export function IntelligenceBoard() {
  const [intelligence, setIntelligence] =
    useState<Intelligence | null>(null);

  const [forecast, setForecast] =
    useState<Forecast | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [actionLoading, setActionLoading] =
    useState<string | null>(null);

  const [actionMessage, setActionMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  const [alerts, setAlerts] = useState<CityAlert[]>([]);
  const [alertsLoading, setAlertsLoading] =
    useState(false);
  const [alertsError, setAlertsError] =
    useState("");

  const [snapshotLoading, setSnapshotLoading] =
    useState(false);

  const [snapshotMessage, setSnapshotMessage] =
    useState("");

  const [snapshotError, setSnapshotError] =
    useState("");

  const pollingRef = useRef(false);

  const loadAlerts = useCallback(async (
    signal?: AbortSignal,
  ) => {
    try {
      setAlertsLoading(true);

      const response = await fetch(
        "/api/city/alerts",
        {
          cache: "no-store",
          signal,
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(
          `HTTP ${response.status}: ${data.error || "Unable to load city alerts"}`,
        );
      }

      if (signal?.aborted) {
        return;
      }

      setAlerts(data.alerts ?? []);
      setAlertsError("");
    } catch (error) {
      if (isAbortError(error) || signal?.aborted) {
        return;
      }

      console.error(
        "Alert loading error:",
        error,
      );
      setAlertsError(
        error instanceof Error
          ? error.message
          : "Unable to load city alerts",
      );
    } finally {
      if (!signal?.aborted) {
        setAlertsLoading(false);
      }
    }
  }, []);

  const loadIntelligence = useCallback(async (
    showRefreshing = false,
    signal?: AbortSignal,
  ) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      }

      const [intelligenceResponse, forecastResponse] =
        await Promise.all([
          fetch("/api/city/intelligence", {
            cache: "no-store",
            signal,
          }),
          fetch(
            "/api/city/intelligence/forecast",
            {
              cache: "no-store",
              signal,
            },
          ),
        ]);

      const intelligenceData =
        await intelligenceResponse.json().catch(() => ({}));

      const forecastData =
        await forecastResponse.json().catch(() => ({}));

      if (
        !intelligenceResponse.ok ||
        !intelligenceData.ok
      ) {
        throw new Error(
          `HTTP ${intelligenceResponse.status}: ${intelligenceData.error ?? "Unable to load city intelligence"}`,
        );
      }

      if (
        !forecastResponse.ok ||
        !forecastData.ok
      ) {
        throw new Error(
          `HTTP ${forecastResponse.status}: ${forecastData.error ?? "Unable to load demand forecast"}`,
        );
      }

      if (signal?.aborted) {
        return;
      }

      setIntelligence(
        intelligenceData.intelligence,
      );

      setForecast(forecastData.forecast);

      setError("");
    } catch (err) {
      if (isAbortError(err) || signal?.aborted) {
        return;
      }

      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load city intelligence",
      );
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  async function executeAction(
    zone: string,
    action:
      | "REDIRECT_DEMAND"
      | "CREATE_ZONE_ALERT"
      | "MARK_INTERVENTION",
  ) {
    const actionKey = `${zone}-${action}`;

    try {
      setActionLoading(actionKey);
      setActionMessage("");
      setActionError("");

      const response = await fetch(
        "/api/city/actions",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            zone,
            action,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(
          `HTTP ${response.status}: ${data.error ?? "Unable to execute city action"}`,
        );
      }

      if (data.result?.intervention) {
        setIntelligence((current) =>
          current
            ? {
                ...current,
                interventions: [
                  data.result.intervention,
                  ...current.interventions.filter(
                    (item) =>
                      item.id !==
                      data.result.intervention.id,
                  ),
                ],
              }
            : current,
        );
      }

      setActionMessage(
        data.result?.message ??
          "Operator action completed successfully.",
      );

      if (
        action === "REDIRECT_DEMAND" &&
        data.result?.alternatives
      ) {
        console.log(
          "Recommended alternatives:",
          data.result.alternatives,
        );
      }
    } catch (err) {
      console.error(err);

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to execute city action",
      );
    } finally {
      setActionLoading(null);
    }
  }

  async function captureSnapshot() {
    try {
      setSnapshotLoading(true);
      setSnapshotMessage("");
      setSnapshotError("");

      const response = await fetch(
        "/api/city/intelligence/snapshot",
        {
          method: "POST",
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.ok) {
        throw new Error(
          `HTTP ${response.status}: ${data.error ?? "Unable to record demand observation"}`,
        );
      }

      await Promise.all([
        loadIntelligence(true),
        loadAlerts(),
      ]);

      setSnapshotMessage(
        "Historical demand observation recorded.",
      );
    } catch (error) {
      console.error(
        "Demand snapshot capture error:",
        error,
      );

      setSnapshotError(
        error instanceof Error
          ? error.message
          : "Unable to record demand observation",
      );
    } finally {
      setSnapshotLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    async function poll() {
      if (!active || controller.signal.aborted || pollingRef.current) {
        return;
      }

      pollingRef.current = true;

      try {
        await Promise.all([
          loadIntelligence(false, controller.signal),
          loadAlerts(controller.signal),
        ]);
      } finally {
        pollingRef.current = false;
      }
    }

    void poll();

    const timer = setInterval(() => {
      void poll();
    }, 5000);

    return () => {
      active = false;
      clearInterval(timer);
      controller.abort();
    };
  }, [
    loadIntelligence,
    loadAlerts,
  ]);

  const topZones = useMemo(() => {
    if (!intelligence) {
      return [];
    }

    return [...intelligence.zones]
      .sort(
        (a, b) =>
          b.utilization - a.utilization,
      )
      .slice(0, 5);
  }, [intelligence]);

  const topForecastZones = useMemo(() => {
    if (!forecast) {
      return [];
    }

    return [...forecast.zones]
      .sort(
        (a, b) =>
          b.predictedUtilization -
          a.predictedUtilization,
      )
      .slice(0, 5);
  }, [forecast]);

  const criticalForecasts = useMemo(() => {
    if (!forecast) {
      return [];
    }

    return forecast.zones.filter(
      (zone) =>
        zone.trend !== "INSUFFICIENT_DATA" &&
        zone.samples >= 2 &&
        zone.risk === "CRITICAL" ||
        zone.trend !== "INSUFFICIENT_DATA" &&
        zone.samples >= 2 &&
        zone.risk === "HIGH",
    );
  }, [forecast]);

  if (loading) {
    return (
      <div className="panel flex min-h-64 items-center justify-center p-8">
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <Loader2
            size={18}
            className="animate-spin"
          />
          Loading live city intelligence...
        </div>
      </div>
    );
  }

  if (error && !intelligence) {
    return (
      <div className="panel p-6">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 text-coral" />

          <div>
            <p className="font-bold">
              Intelligence unavailable
            </p>

            <p className="mt-1 text-sm text-slate-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                void loadIntelligence(true)
              }
              className="mt-4 flex items-center gap-2 text-sm font-bold"
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!intelligence) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* CITY SNAPSHOT */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="panel p-5">
          <p className="eyebrow">
            Network capacity
          </p>

          <p className="mt-3 text-2xl font-bold">
            {intelligence.city.capacity}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Verified active spaces
          </p>
        </div>

        <div className="panel p-5">
          <p className="eyebrow">
            Live availability
          </p>

          <p className="mt-3 text-2xl font-bold">
            {intelligence.city.available}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Currently available
          </p>
        </div>

        <div className="panel p-5">
          <p className="eyebrow">
            City utilization
          </p>

          <p className="mt-3 text-2xl font-bold">
            {intelligence.city.utilization}%
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {intelligence.city.occupied} occupied
          </p>
        </div>

        <div className="panel p-5">
          <p className="eyebrow">
            Active alerts
          </p>

          <p className="mt-3 text-2xl font-bold">
            {intelligence.alerts.criticalZones +
              intelligence.alerts.busyZones +
              intelligence.alerts.incidents}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {intelligence.alerts.criticalZones}{" "}
            critical ·{" "}
            {intelligence.alerts.busyZones} busy
          </p>
        </div>
      </div>

      {/* LIVE NETWORK STATE */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        <div className="panel p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="eyebrow">
                Live city network
              </p>

              <h2 className="text-xl font-bold">
                Zone utilization
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Real-time occupancy derived from
                verified active inventory.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                void loadIntelligence(true)
              }
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />
              Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {topZones.map((zone) => (
              <div key={zone.zone}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex min-w-0 items-center gap-2">
                    <MapPin
                      size={15}
                      className="shrink-0 text-slate-400"
                    />

                    <span className="truncate font-semibold">
                      {zone.zone}
                    </span>
                  </div>

                  <span
                    className={
                      zone.status ===
                      "CRITICAL"
                        ? "font-bold text-coral"
                        : zone.status === "BUSY"
                          ? "font-bold text-amber-700"
                          : "font-semibold text-slate-600"
                    }
                  >
                    {zone.utilization}%
                  </span>
                </div>

                <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={
                      zone.status ===
                      "CRITICAL"
                        ? "h-full rounded-full bg-coral"
                        : zone.status === "BUSY"
                          ? "h-full rounded-full bg-amber-400"
                          : "h-full rounded-full bg-signal"
                    }
                    style={{
                      width: `${Math.min(
                        zone.utilization,
                        100,
                      )}%`,
                    }}
                  />
                </div>

                <div className="mt-1 flex justify-between text-xs text-slate-500">
                  <span>
                    {zone.available} available
                  </span>

                  <span>
                    {zone.used}/{zone.capacity}{" "}
                    occupied
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel overflow-hidden">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert
                  size={19}
                  className="text-coral"
                />

                <p className="eyebrow">
                  Proactive operations
                </p>
              </div>

              <h2 className="mt-1 text-xl font-bold">
                Alert Center
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Conditions detected from live occupancy
                and historical demand signals.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              {alertsLoading && (
                <Loader2
                  size={14}
                  className="animate-spin"
                />
              )}

              <span>
                {alerts.length} active{" "}
                {alerts.length === 1
                  ? "alert"
                  : "alerts"}
              </span>
            </div>
          </div>

          {alertsError && (
            <div className="border-t bg-red-50 px-5 py-3 text-sm text-red-700">
              Alert feed unavailable: {alertsError}
            </div>
          )}

          <div className="border-t">
            {alerts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-semibold">
                  No active city alerts
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  The monitored network is currently
                  within operational thresholds.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-5"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`chip ${
                              alert.severity ===
                              "CRITICAL"
                                ? "bg-red-50 text-red-700"
                                : alert.severity ===
                                    "HIGH"
                                  ? "bg-amber-50 text-amber-700"
                                  : "bg-yellow-50 text-yellow-700"
                            }`}
                          >
                            {alert.severity}
                          </span>

                          <span className="chip bg-cloud text-slate-600">
                            {alert.zone}
                          </span>
                        </div>

                        <h3 className="mt-3 font-bold">
                          {alert.title}
                        </h3>

                        <p className="mt-1 text-sm text-slate-600">
                          {alert.message}
                        </p>

                        <div className="mt-3 w-full rounded-xl bg-cloud p-3 text-sm leading-6">
                          <span className="font-semibold">
                            Recommended response:
                          </span>{" "}
                          {alert.recommendation}
                        </div>
                      </div>

                      <div className="grid w-full grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-xl bg-cloud p-3">
                          <p className="text-slate-500">
                            Current
                          </p>

                          <p className="mt-1 text-lg font-bold">
                            {alert.currentUtilization}%
                          </p>
                        </div>

                        <div className="rounded-xl bg-cloud p-3">
                          <p className="text-slate-500">
                            Forecast
                          </p>

                          <p className="mt-1 text-lg font-bold">
                            {alert.predictedUtilization}%
                          </p>
                        </div>

                        <div className="rounded-xl bg-cloud p-3">
                          <p className="text-slate-500">
                            Confidence
                          </p>

                          <p className="mt-1 text-lg font-bold">
                            {alert.confidence}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {alert.severity ===
                        "CRITICAL" && (
                        <button
                          type="button"
                          onClick={() =>
                            executeAction(
                              alert.zone,
                              "REDIRECT_DEMAND",
                            )
                          }
                          disabled={
                            actionLoading ===
                            `${alert.zone}-REDIRECT_DEMAND`
                          }
                          className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {actionLoading ===
                          `${alert.zone}-REDIRECT_DEMAND`
                            ? "Redirecting..."
                            : "Redirect demand"}
                        </button>
                      )}

                      {alert.severity ===
                        "HIGH" && (
                        <button
                          type="button"
                          onClick={() =>
                            executeAction(
                              alert.zone,
                              "CREATE_ZONE_ALERT",
                            )
                          }
                          disabled={
                            actionLoading ===
                            `${alert.zone}-CREATE_ZONE_ALERT`
                          }
                          className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
                        >
                          {actionLoading ===
                          `${alert.zone}-CREATE_ZONE_ALERT`
                            ? "Creating..."
                            : "Create zone alert"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          executeAction(
                            alert.zone,
                            "MARK_INTERVENTION",
                          )
                        }
                        disabled={
                          actionLoading ===
                          `${alert.zone}-MARK_INTERVENTION`
                        }
                        className="rounded-xl border px-4 py-2 text-sm font-bold disabled:opacity-50"
                      >
                        {actionLoading ===
                        `${alert.zone}-MARK_INTERVENTION`
                          ? "Recording..."
                          : "Mark intervention"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {getOperatorAlerts(intelligence.interventions).length > 0 && (
          <div className="border-t bg-cloud p-5 lg:col-span-2">
            <p className="eyebrow">
              Operator alerts
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Created by City Operators; separate from predictive alerts.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {getOperatorAlerts(intelligence.interventions).map((intervention) => (
                  <div
                    className="rounded-xl bg-white p-4"
                    key={intervention.id}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <b>{intervention.zone}</b>
                      <span className="chip bg-mint">
                        {intervention.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-600">
                      Operator-created alert · {intervention.actor}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow">
              Historical demand observation
            </p>

            <p className="mt-1 text-sm text-slate-600">
              Record the current network state as a historical input for explainable forecasting.
            </p>

            {snapshotMessage && (
              <p className="mt-2 text-sm font-semibold text-emerald-700">
                {snapshotMessage}
              </p>
            )}

            {snapshotError && (
              <p className="mt-2 text-sm font-semibold text-red-700">
                {snapshotError}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => void captureSnapshot()}
            disabled={snapshotLoading}
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={15}
              className={
                snapshotLoading ? "animate-spin" : ""
              }
            />
            {snapshotLoading
              ? "Recording..."
              : "Record observation"}
          </button>
        </div>

        {intelligence.interventions.length > 0 && (
          <div className="panel p-6">
            <div>
              <p className="eyebrow">
                Operator-created operational state
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Active city interventions
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                These are recorded operator decisions. They do not represent physical traffic control.
              </p>
            </div>

            <div className="mt-5 space-y-3">
              {intelligence.interventions.map(
                (intervention) => (
                  <div
                    key={intervention.id}
                    className="rounded-2xl bg-cloud p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold">
                          {intervention.zone}
                        </p>

                        <p className="mt-1 text-sm text-slate-600">
                          {intervention.action ===
                          "REDIRECT_DEMAND"
                            ? "Demand redirection ACTIVE"
                            : intervention.action ===
                                "CREATE_ZONE_ALERT"
                              ? "Operator-created alert ACTIVE"
                              : "Intervention ACKNOWLEDGED"}
                        </p>
                      </div>

                      <span className="chip bg-mint">
                        {intervention.status}
                      </span>
                    </div>

                    {intervention.alternatives.length > 0 && (
                      <div className="mt-3 text-sm">
                        <p className="font-semibold">
                          Alternative zones
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                          {intervention.alternatives.map(
                            (alternative) => (
                              <span
                                className="chip bg-white"
                                key={alternative.zone}
                              >
                                {alternative.zone} · {alternative.utilization}% utilization
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    <p className="mt-3 text-xs text-slate-500">
                      Activated by {intervention.actor} · {new Date(intervention.createdAt).toLocaleString()}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* CRITICAL ZONE */}
        <div className="panel p-6">
          <ShieldAlert className="text-coral" />

          <p className="eyebrow mt-4">
            Priority intervention
          </p>

          {intelligence.criticalZones.length >
          0 ? (
            <>
              <h2 className="mt-1 text-xl font-bold">
                Capacity pressure detected
              </h2>

              <div className="mt-5 space-y-3">
                {intelligence.criticalZones.map(
                  (zone) => (
                    <div
                      key={zone.zone}
                      className="rounded-2xl bg-cloud p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <b>{zone.zone}</b>

                          <p className="mt-1 text-sm text-slate-600">
                            Only{" "}
                            <strong>
                              {zone.available}
                            </strong>{" "}
                            space
                            {zone.available === 1
                              ? ""
                              : "s"}{" "}
                            remaining.
                          </p>
                        </div>

                        <span className="chip bg-red-50 text-red-700">
                          {zone.utilization}%
                        </span>
                      </div>
                    </div>
                  ),
                )}
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                Recommended city response: redirect
                incoming demand toward nearby
                underutilized zones and monitor the
                affected zone for further capacity
                degradation.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {intelligence.criticalZones.map(
                  (zone) => {
                    const redirectKey =
                      `${zone.zone}-REDIRECT_DEMAND`;

                    const alertKey =
                      `${zone.zone}-CREATE_ZONE_ALERT`;

                    return (
                      <div
                        key={`${zone.zone}-actions`}
                        className="flex flex-wrap gap-2"
                      >
                        <button
                          type="button"
                          disabled={
                            actionLoading !== null
                          }
                          onClick={() =>
                            void executeAction(
                              zone.zone,
                              "REDIRECT_DEMAND",
                            )
                          }
                          className="flex items-center gap-2 rounded-xl bg-signal px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading ===
                          redirectKey ? (
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <ArrowUpRight size={14} />
                          )}

                          Redirect demand
                        </button>

                        <button
                          type="button"
                          disabled={
                            actionLoading !== null
                          }
                          onClick={() =>
                            void executeAction(
                              zone.zone,
                              "CREATE_ZONE_ALERT",
                            )
                          }
                          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading ===
                          alertKey ? (
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <AlertTriangle size={14} />
                          )}

                          Create alert
                        </button>
                      </div>
                    );
                  },
                )}
              </div>
              {actionMessage && (
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800">
                  <div className="flex items-start gap-2">
                    <Lightbulb
                      size={16}
                      className="mt-0.5 shrink-0"
                    />

                    <p>{actionMessage}</p>
                  </div>
                </div>
              )}

              {actionError && (
                <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-700">
                  <div className="flex items-start gap-2">
                    <AlertTriangle
                      size={16}
                      className="mt-0.5 shrink-0"
                    />

                    <p>{actionError}</p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h2 className="mt-1 text-xl font-bold">
                No critical zones
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                The current network has no zone above
                the critical utilization threshold.
              </p>
            </>
          )}
        </div>
      </div>

      {/* PREDICTIVE INTELLIGENCE */}
      <div className="panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <BrainCircuit className="text-signal" />

              <div>
                <p className="eyebrow">
                  Predictive intelligence
                </p>

                <h2 className="text-xl font-bold">
                  Demand forecast & risk
                </h2>
              </div>
            </div>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              SPARC compares historical availability
              snapshots with current network conditions
              to identify demand direction, forecast
              capacity pressure, and recommend operator
              actions.
            </p>
          </div>

          {forecast && (
            <div className="rounded-xl bg-cloud px-4 py-3 text-right">
              <p className="text-xs text-slate-500">
                Forecast coverage
              </p>

              <p className="mt-1 text-sm font-bold">
                {forecast.zones.length} zones
              </p>
            </div>
          )}
        </div>

        {forecast ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {topForecastZones.map((zone) => (
              <div
                key={zone.zone}
                className="rounded-2xl border border-slate-100 bg-cloud p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-bold">
                      {zone.zone}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {zone.samples} historical samples
                    </p>
                  </div>

                  <span
                    className={
                      forecastDisplayState(zone).className
                    }
                  >
                    {forecastDisplayState(zone).label}
                  </span>
                </div>

                <div className="mt-5">
                  <p className="text-xs text-slate-500">
                    {zone.trend === "INSUFFICIENT_DATA"
                      ? "Current state · trend unavailable"
                      : "Current → forecast"}
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {zone.currentUtilization}%
                    {zone.trend !== "INSUFFICIENT_DATA" && (
                      <>
                        <span className="text-slate-400">
                          {" "}→{" "}
                        </span>
                        {zone.predictedUtilization}%
                      </>
                    )}
                  </p>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-bold">
                  {zone.trend ===
                  "INCREASING_DEMAND" ? (
                    <>
                      <TrendingUp
                        size={15}
                        className="text-coral"
                      />
                      <span className="text-coral">
                        Increasing demand
                      </span>
                    </>
                  ) : zone.trend ===
                    "DECREASING_DEMAND" ? (
                    <>
                      <TrendingDown
                        size={15}
                        className="text-emerald-700"
                      />
                      <span className="text-emerald-700">
                        Demand easing
                      </span>
                    </>
                  ) : zone.trend ===
                    "INSUFFICIENT_DATA" ? (
                    <>
                      <Gauge
                        size={15}
                        className="text-slate-400"
                      />
                      <span className="text-slate-500">
                        Insufficient data
                      </span>
                    </>
                  ) : (
                    <>
                      <Gauge
                        size={15}
                        className="text-slate-500"
                      />
                      <span className="text-slate-600">
                        Stable demand
                      </span>
                    </>
                  )}
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Confidence</span>

                    <span className="font-semibold">
                      {zone.confidence}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-signal"
                      style={{
                        width: `${Math.min(
                          zone.confidence,
                          100,
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-600">
                  {zone.trend === "INSUFFICIENT_DATA"
                    ? "Capture more historical observations before treating this as a demand forecast."
                    : zone.recommendation}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() =>
                      void executeAction(
                        zone.zone,
                        "REDIRECT_DEMAND",
                      )
                    }
                    className="flex items-center gap-2 rounded-xl bg-signal px-3 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ===
                    `${zone.zone}-REDIRECT_DEMAND` ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <ArrowUpRight size={14} />
                    )}

                    Redirect demand
                  </button>

                  <button
                    type="button"
                    disabled={actionLoading !== null}
                    onClick={() =>
                      void executeAction(
                        zone.zone,
                        "MARK_INTERVENTION",
                      )
                    }
                    className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {actionLoading ===
                    `${zone.zone}-MARK_INTERVENTION` ? (
                      <Loader2
                        size={14}
                        className="animate-spin"
                      />
                    ) : (
                      <ShieldAlert size={14} />
                    )}

                    Mark intervention
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-cloud p-5 text-sm text-slate-600">
            Demand forecast is currently unavailable.
          </div>
        )}
      </div>

      {/* PREDICTIVE INTERVENTION */}
      {criticalForecasts.length > 0 && (
        <div className="panel p-6">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 text-coral" />

            <div className="min-w-0">
              <p className="eyebrow">
                Predictive intervention
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Zones requiring operator attention
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                These zones are currently experiencing
                high or critical capacity pressure based
                on the forecast engine.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {criticalForecasts.map((zone) => (
              <div
                key={zone.zone}
                className="rounded-2xl bg-cloud p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">
                      {zone.zone}
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      {zone.currentAvailable} spaces
                      available now · predicted{" "}
                      {zone.predictedUtilization}%
                      utilization
                    </p>
                  </div>

                  <span
                    className={
                      zone.risk === "CRITICAL"
                        ? "chip bg-red-50 text-red-700"
                        : "chip bg-amber-50 text-amber-700"
                    }
                  >
                    {zone.risk}
                  </span>
                </div>

                <div className="mt-4 flex items-start gap-3">
                  <Lightbulb
                    size={17}
                    className="mt-0.5 shrink-0 text-signal"
                  />

                  <p className="text-sm leading-6 text-slate-600">
                    {zone.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BUSY ZONES + OPERATIONAL SIGNALS */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <Gauge className="text-signal" />

            <div>
              <p className="eyebrow">
                Demand pressure
              </p>

              <h2 className="text-xl font-bold">
                Busy zones
              </h2>
            </div>
          </div>

          {intelligence.busyZones.length >
          0 ? (
            <div className="mt-5 space-y-3">
              {intelligence.busyZones.map(
                (zone) => (
                  <div
                    key={zone.zone}
                    className="flex items-center justify-between rounded-2xl bg-cloud p-4"
                  >
                    <div>
                      <b>{zone.zone}</b>

                      <p className="mt-1 text-xs text-slate-500">
                        {zone.available} available ·{" "}
                        {zone.spaces} active spaces
                      </p>
                    </div>

                    <span className="font-bold text-amber-700">
                      {zone.utilization}%
                    </span>
                  </div>
                ),
              )}
            </div>
          ) : (
            <p className="mt-5 text-sm text-slate-600">
              No busy zones detected.
            </p>
          )}
        </div>

        <div className="panel p-6">
          <BrainCircuit className="text-signal" />

          <p className="eyebrow mt-4">
            Intelligence layer
          </p>

          <h2 className="text-xl font-bold">
            Operational recommendation
          </h2>

          <p className="mt-3 text-sm leading-6 text-slate-600">
            SPARC continuously evaluates live
            availability and historical demand signals
            to identify capacity pressure before it
            becomes a wider network shortage.
          </p>

          <div className="mt-5 rounded-2xl bg-cloud p-4">
            <div className="flex items-start gap-3">
              <Lightbulb
                size={18}
                className="mt-0.5 text-signal"
              />

              <div>
                <p className="font-semibold">
                  Current network signal
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {intelligence.alerts.criticalZones >
                  0
                    ? "Immediate attention is required in critical zones."
                    : intelligence.alerts.busyZones >
                        0
                      ? "Demand pressure is concentrated in busy zones."
                      : "Network capacity is currently stable."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* INCIDENTS */}
      {intelligence.incidents.length > 0 && (
        <div className="panel p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-coral" />

            <div>
              <p className="eyebrow">
                Operational incidents
              </p>

              <h2 className="text-xl font-bold">
                Active incidents
              </h2>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {intelligence.incidents.map(
              (incident, index) => (
                <div
                  key={
                    incident._id ??
                    `incident-${index}`
                  }
                  className="rounded-2xl bg-cloud p-4"
                >
                  <b>
                    {incident.title ??
                      "Operational incident"}
                  </b>

                  {incident.description && (
                    <p className="mt-1 text-sm text-slate-600">
                      {incident.description}
                    </p>
                  )}
                </div>
              ),
            )}
          </div>
        </div>
      )}

      <p className="text-right text-xs text-slate-400">
        Live data · Updated{" "}
        {new Date(
          intelligence.generatedAt,
        ).toLocaleTimeString()}
        {refreshing ? " · refreshing..." : ""}
      </p>
    </div>
  );
}