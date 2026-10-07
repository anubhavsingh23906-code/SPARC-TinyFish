"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { LiveWebVerification } from "@/components/live-web-verification";
import { ModeSelector } from "@/components/mode-selector";
import { MapPanel } from "@/components/map-panel";
import { SpaceMode, SpaceSummary } from "@/lib/types";
import { rankSpaces } from "@/lib/domain/recommendation";
import {
  ArrowUpRight,
  Clock,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function Home() {
  const [mode, setMode] =
    useState<SpaceMode>("PARKING");

  const [spaces, setSpaces] =
    useState<SpaceSummary[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const response = await fetch(
          "/api/spaces",
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error ?? "Unable to load spaces",
          );
        }

        if (active) {
          setSpaces(data.spaces ?? []);
          setError("");
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load spaces",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    const interval = window.setInterval(() => {
      void load();
    }, 15000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const rankedSpaces = useMemo(
    () =>
      rankSpaces(
        spaces,
        mode,
        80,
      ),
    [spaces, mode],
  );

  return (
    <DashboardShell>
      <section className="space-y-6">
        <div className="panel overflow-hidden bg-ink p-6 text-white md:p-9">
          <p className="eyebrow text-mint">
            Urban space, coordinated
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row">
            <div>
              <h1 className="max-w-xl text-3xl font-bold tracking-tight md:text-5xl">
                Find verified capacity before the city slows you down.
              </h1>

              <p className="mt-3 max-w-lg text-slate-300">
                Live availability, transparent forecasts,
                and explainable choices across every
                urban-space need.
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-4 text-sm">
              <span className="chip bg-mint text-ink">
                <Zap size={13} />
                DATABASE LIVE
              </span>

              <p className="mt-3 font-semibold">
                {spaces.length} verified spaces available
              </p>

              <p className="text-slate-300">
                Sourced from the SPARC database
              </p>
            </div>
          </div>
        </div>

        <LiveWebVerification />

        <div className="panel p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">
                Choose a need
              </p>

              <h2 className="text-xl font-bold">
                Where do you need space?
              </h2>
            </div>

            <span className="hidden chip bg-mint md:flex">
              Forecast shown separately
            </span>
          </div>

          <div className="mt-4">
            <ModeSelector
              active={mode}
              onChange={setMode}
            />
          </div>
        </div>

        {loading ? (
          <div className="panel flex items-center justify-center gap-3 p-12 text-slate-500">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Loading verified spaces...
          </div>
        ) : error ? (
          <div className="panel p-10 text-center">
            <h3 className="font-bold">
              Unable to load marketplace
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {error}
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
              <MapPanel spaces={rankedSpaces} />

              <div className="panel p-5">
                <p className="eyebrow">
                  Next 30 minutes
                </p>

                <h2 className="text-xl font-bold">
                  Demand outlook
                </h2>

                <div className="mt-6 flex h-40 items-end gap-3">
                  {[21, 16, 9, 12, 19].map(
                    (value, index) => (
                      <div
                        className="flex flex-1 flex-col items-center gap-2"
                        key={`${value}-${index}`}
                      >
                        <div
                          className="w-full rounded-t-xl bg-signal"
                          style={{
                            height: `${value * 5}px`,
                            opacity:
                              0.55 +
                              index * 0.1,
                          }}
                        />

                        <span className="text-xs text-slate-500">
                          {7 + index * 15}:00
                        </span>
                      </div>
                    ),
                  )}
                </div>

                <p className="mt-4 text-sm text-slate-500">
                  FORECAST · deterministic demo estimate,
                  not live sensor data.
                </p>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-end justify-between">
                <div>
                  <p className="eyebrow">
                    Recommended spaces
                  </p>

                  <h2 className="text-2xl font-bold">
                    Made explainable
                  </h2>
                </div>

                <Link
                  href="/parking"
                  className="flex items-center gap-1 text-sm font-semibold"
                >
                  View map
                  <ArrowUpRight size={15} />
                </Link>
              </div>

              <div className="grid gap-3">
                {rankedSpaces.length ? (
                  rankedSpaces.map((space) => (
                    <article
                      className="panel flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
                      key={space.id}
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-mint text-ink">
                        <ShieldCheck />
                      </div>

                      <Link
                        href={`/parking/${space.id}`}
                        className="flex-1"
                      >
                        <div className="flex justify-between">
                          <h3 className="font-bold">
                            {space.title}
                          </h3>

                          <strong>
                            ₹{space.price}
                            <span className="font-normal text-slate-500">
                              /hr
                            </span>
                          </strong>
                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          {space.zone} ·{" "}
                          {space.distanceKm} km ·{" "}
                          <span className="font-semibold text-signal">
                            {space.freshness}
                          </span>{" "}
                          {space.available} available
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          Why this fits: verified,{" "}
                          {space.reliability}% reliable,
                          forecast {space.forecast} spaces
                          free.
                        </p>
                      </Link>

                      <Link
                        href={`/parking/${space.id}`}
                        className="rounded-xl bg-ink px-4 py-2 text-center text-sm font-semibold text-white"
                      >
                        Reserve
                      </Link>
                    </article>
                  ))
                ) : (
                  <div className="panel p-10 text-center text-slate-500">
                    <Clock className="mx-auto mb-3" />
                    No verified availability for this
                    mode nearby yet.
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </DashboardShell>
  );
}
