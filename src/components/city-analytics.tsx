"use client";

import {
  Activity,
  BarChart3,
  CheckCircle2,
  Database,
  Gauge,
  MapPinned,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Analytics = {
  generatedAt: string;

  network: {
    capacity: number;
    available: number;
    occupied: number;
    utilization: number;
    activeZones: number;
    activeSpaces: number;
  };

  reservations: {
    total: number;
    completed: number;
    cancelled: number;
    failed: number;
    terminalOutcomes: number;
    reserved: number;
    checkedIn: number;
    occupied: number;
    fulfillmentRate: number;
  };

  operations: {
    interventions: number;
  };

  intelligence: {
    demandSnapshots: number;
  };
};

export function CityAnalytics() {
  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const loadAnalytics = useCallback(
    async (showRefreshing = false) => {
      try {
        if (showRefreshing) {
          setRefreshing(true);
        }

        setError("");

        const response = await fetch(
          "/api/city/analytics",
          {
            cache: "no-store",
          },
        );

        const data =
          await response.json();

        if (
          !response.ok ||
          !data.ok
        ) {
          throw new Error(
            data.error ||
              "Unable to load analytics",
          );
        }

        setAnalytics(data.analytics);
      } catch (error) {
        console.error(
          "Analytics loading error:",
          error,
        );

        setError(
          error instanceof Error
            ? error.message
            : "Unable to load analytics",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadAnalytics();

    const timer = setInterval(
      loadAnalytics,
      10000,
    );

    return () =>
      clearInterval(timer);
  }, [loadAnalytics]);

  if (loading && !analytics) {
    return (
      <div className="panel p-8">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <RefreshCw
            size={16}
            className="animate-spin"
          />
          Loading city analytics...
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="panel border border-red-200 p-6">
        <p className="font-bold text-red-700">
          Unable to load analytics
        </p>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>

        <button
          type="button"
          onClick={() =>
            void loadAnalytics()
          }
          className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const {
    network,
    reservations,
    operations,
    intelligence,
  } = analytics;

  return (
    <div className="space-y-6">
      {/* HEADER */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">
            SPARC analytics · measured system activity
          </p>

          <h1 className="mt-1 text-3xl font-bold">
            Measure the network, not just the traffic.
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Analytics = what SPARC has measured:
            verified inventory, reservations,
            occupancy, demand snapshots and recorded
            operator actions. Intelligence remains
            separate: it explains what is happening
            and what may happen.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadAnalytics(true)
          }
          disabled={refreshing}
          aria-busy={refreshing}
          className="flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            size={15}
            className={
              refreshing ? "animate-spin" : ""
            }
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className="flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          Last measured: {new Date(analytics.generatedAt).toLocaleString()}
        </span>

        {error && (
          <span className="rounded-lg bg-amber-50 px-3 py-2 font-semibold text-amber-800">
            Refresh failed. Displayed data may be stale.
          </span>
        )}
      </div>

      {/* NETWORK KPI CARDS */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">
              Network capacity
            </p>

            <Gauge
              size={19}
              className="text-signal"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {network.capacity}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            measured capacity units from verified
            active inventory
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">
              Utilization
            </p>

            <TrendingUp
              size={19}
              className="text-signal"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {network.utilization}%
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {network.occupied} occupied capacity units ·{" "}
            {network.available} available capacity units
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">
              Reservations
            </p>

            <BarChart3
              size={19}
              className="text-signal"
            />
          </div>

          <p className="mt-3 text-3xl font-bold">
            {reservations.total}
          </p>

          <p className="mt-1 text-sm text-slate-500">
            total booking records
          </p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <p className="eyebrow">
              Terminal completion rate
            </p>

            <CheckCircle2
              size={19}
              className="text-signal"
            />
          </div>

          {reservations.terminalOutcomes === 0 ? (
            <p className="mt-3 text-lg font-bold">
              No terminal outcomes yet
            </p>
          ) : (
            <p className="mt-3 text-3xl font-bold">
              {reservations.fulfillmentRate}%
            </p>
          )}

          <p className="mt-1 text-sm text-slate-500">
            checked out / terminal outcomes ({reservations.terminalOutcomes})
          </p>
        </div>
      </div>

      {/* NETWORK + RESERVATION PERFORMANCE */}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <div className="flex items-center gap-2">
            <MapPinned
              size={19}
              className="text-signal"
            />

            <p className="eyebrow">
              Network footprint
            </p>
          </div>

          <h2 className="mt-1 text-xl font-bold">
            Verified supply coverage
          </h2>

          <div className="mt-6 space-y-4">
            <MetricRow
              label="Active spaces"
              value={network.activeSpaces}
            />

            <MetricRow
              label="Active zones"
              value={network.activeZones}
            />

            <MetricRow
              label="Available capacity units"
              value={network.available}
            />

            <MetricRow
              label="Occupied capacity units"
              value={network.occupied}
            />
          </div>

          <div className="mt-6 rounded-2xl bg-cloud p-4">
            <p className="text-sm text-slate-600">
              SPARC currently measures{" "}
              <b>
                {network.activeSpaces}
              </b>{" "}
              verified spaces across{" "}
              <b>
                {network.activeZones}
              </b>{" "}
              active zones.
            </p>
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-2">
            <Activity
              size={19}
              className="text-signal"
            />

            <p className="eyebrow">
              Reservation performance
            </p>
          </div>

          <h2 className="mt-1 text-xl font-bold">
            Booking lifecycle
          </h2>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <StatBox
              label="Completed"
              value={reservations.completed}
              icon={
                <CheckCircle2 size={16} />
              }
            />

            <StatBox
              label="Reserved"
              value={reservations.reserved}
              icon={
                <Activity size={16} />
              }
            />

            <StatBox
              label="Checked in"
              value={reservations.checkedIn}
              icon={
                <Gauge size={16} />
              }
            />

            <StatBox
              label="Occupied"
              value={reservations.occupied}
              icon={
                <BarChart3 size={16} />
              }
            />

            <StatBox
              label="Cancelled"
              value={reservations.cancelled}
              icon={
                <XCircle size={16} />
              }
            />

            <StatBox
              label="Failed"
              value={reservations.failed}
              icon={
                <XCircle size={16} />
              }
            />
          </div>
        </div>
      </div>

      {/* UTILIZATION VISUAL */}

      <div className="panel p-6">
        <div className="flex items-center gap-2">
          <Gauge
            size={19}
            className="text-signal"
          />

          <p className="eyebrow">
            Capacity utilization
          </p>
        </div>

        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">
                Occupied
              </span>

              <span className="font-bold">
                {network.utilization}%
              </span>
            </div>

            <div className="mt-3 h-4 overflow-hidden rounded-full bg-cloud">
              <div
                className="h-full rounded-full bg-signal"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(
                      0,
                      network.utilization,
                    ),
                  )}%`,
                }}
              />
            </div>

            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>
                {network.occupied} occupied
              </span>

              <span>
                {network.available} available
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-cloud px-6 py-4 text-center">
            <p className="text-3xl font-bold">
              {network.capacity}
            </p>

            <p className="text-xs text-slate-500">
              measured capacity units
            </p>
          </div>
        </div>
      </div>

      {/* RECORDED ACTIVITY AND DATA COVERAGE */}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-6">
          <p className="eyebrow">
            Operator activity
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Recorded city actions
          </h2>

          <p className="mt-5 text-4xl font-bold">
            {operations.interventions}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Demand redirects, zone alerts and
            intervention decisions recorded as
            city-action events.
          </p>

          {operations.interventions === 0 && (
            <div className="mt-4 rounded-xl bg-cloud p-3 text-xs text-slate-500">
                No city actions have been
              recorded in the current demo dataset.
            </div>
          )}
        </div>

        <div className="panel p-6">
          <div className="flex items-center gap-2">
            <Database
              size={19}
              className="text-signal"
            />

            <p className="eyebrow">
              Historical demand data
            </p>
          </div>

          <h2 className="mt-1 text-xl font-bold">
            Historical demand signals
          </h2>

          <p className="mt-5 text-4xl font-bold">
            {intelligence.demandSnapshots}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-600">
            Demand snapshots are historical data
            coverage only. They are not forecast
            accuracy or an ML/model performance metric.
          </p>
        </div>
      </div>

      {/* TRUST STATEMENT */}

      <div className="panel border border-slate-200 p-6">
        <p className="eyebrow">
          Measurement principle
        </p>

        <h2 className="mt-1 text-xl font-bold">
          SPARC reports measured system activity,
          not invented impact.
        </h2>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
          Current analytics are calculated from
          verified spaces, real reservation states,
          recorded operator actions and stored
          demand snapshots. Future impact estimates
          can be added when validated city-level data
          becomes available.
        </p>
      </div>
    </div>
  );
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-cloud px-4 py-3">
      <span className="text-sm text-slate-600">
        {label}
      </span>

      <span className="font-bold">
        {value}
      </span>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-cloud p-4">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs">
          {label}
        </span>
      </div>

      <p className="mt-2 text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}