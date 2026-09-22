import fs from "node:fs";

function write(file, content) {
  fs.mkdirSync(file.substring(0, file.lastIndexOf("/")), { recursive: true });
  fs.writeFileSync(file, content.trimStart() + "\n", "utf8");
  console.log(`WROTE ${file}`);
}

/* =========================================================
   1. FIX REMAINING ENCODING/SYNTAX CORRUPTION
   ========================================================= */

const engineFile = "src/lib/intelligence/engine.ts";
let engine = fs.readFileSync(engineFile, "utf8");

engine = engine.replace(
  "input.eventMultiplier?₹0",
  "input.eventMultiplier ?? 0",
);

write(engineFile, engine);


/* =========================================================
   2. SERVER-SIDE SPACE SERVICE
   ========================================================= */

write(
  "src/lib/services/space-service.ts",
  `
import { connectDb } from "@/lib/db";
import { Space } from "@/lib/models";

export type MarketplaceSpace = {
  id: string;
  title: string;
  zone: string;
  address: string;
  price: number;
  monthlyPrice: number | null;
  available: number;
  capacity: number;
  distanceKm: number;
  covered: boolean;
  monthly: boolean;
  reliability: number;
  freshness: "LIVE" | "RECENT" | "STALE";
  forecast: number;
  amenities: string[];
  restrictions: string[];
  owner: string;
  mode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  verificationStatus: string;
  operationalStatus: string;
};

const DEMO_ORIGIN = {
  lat: 12.9716,
  lng: 77.5946,
};

function distanceKm(
  lat: number | undefined,
  lng: number | undefined,
) {
  if (
    typeof lat !== "number" ||
    typeof lng !== "number"
  ) {
    return 0;
  }

  const earthRadius = 6371;

  const dLat =
    ((lat - DEMO_ORIGIN.lat) * Math.PI) / 180;

  const dLng =
    ((lng - DEMO_ORIGIN.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((DEMO_ORIGIN.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return Number(
    (
      earthRadius *
      2 *
      Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    ).toFixed(1),
  );
}

function freshness(
  lastUpdatedAt: Date | null | undefined,
): "LIVE" | "RECENT" | "STALE" {
  if (!lastUpdatedAt) {
    return "STALE";
  }

  const age =
    (Date.now() - new Date(lastUpdatedAt).getTime()) /
    1000;

  if (age <= 60) {
    return "LIVE";
  }

  if (age <= 600) {
    return "RECENT";
  }

  return "STALE";
}

function mapSpace(space: any): MarketplaceSpace {
  const capacity = Number(space.capacity ?? 0);
  const available = Math.max(
    0,
    Math.min(capacity, Number(space.available ?? 0)),
  );

  const hourly = Number(
    space.pricing?.hourly ?? 0,
  );

  const monthly =
    typeof space.pricing?.monthly === "number"
      ? Number(space.pricing.monthly)
      : null;

  const reliability = Number(
    space.reliabilityScore ?? 80,
  );

  const coordinates = {
    lat: Number(space.coordinates?.lat ?? 0),
    lng: Number(space.coordinates?.lng ?? 0),
  };

  const amenities = Array.isArray(space.amenities)
    ? space.amenities
    : [];

  const restrictions = Array.isArray(
    space.restrictions,
  )
    ? space.restrictions
    : [];

  const covered =
    amenities.some((item: string) =>
      item.toLowerCase().includes("covered"),
    ) ||
    amenities.some((item: string) =>
      item.toLowerCase().includes("roof"),
    );

  const forecast = Math.min(
    capacity,
    available +
      Math.max(
        1,
        Math.round(capacity * 0.08),
      ),
  );

  return {
    id: String(space.externalId ?? space._id),
    title: String(space.title ?? "Verified urban space"),
    zone: String(space.zone ?? "Unknown zone"),
    address: String(space.address ?? ""),
    price: hourly,
    monthlyPrice: monthly,
    available,
    capacity,
    distanceKm: distanceKm(
      coordinates.lat,
      coordinates.lng,
    ),
    covered,
    monthly: monthly !== null,
    reliability,
    freshness: freshness(space.lastUpdatedAt),
    forecast,
    amenities,
    restrictions,
    owner:
      space.ownerId?.userId?.name ??
      "Verified operator",
    mode: String(space.mode ?? "PARKING"),
    coordinates,
    verificationStatus: String(
      space.verificationStatus ?? "PENDING",
    ),
    operationalStatus: String(
      space.operationalStatus ?? "INACTIVE",
    ),
  };
}

export async function getMarketplaceSpaces(
  mode?: string,
) {
  await connectDb();

  const filter: Record<string, unknown> = {
    verificationStatus: "APPROVED",
    operationalStatus: "ACTIVE",
  };

  if (mode) {
    filter.mode = mode;
  }

  const spaces = await Space.find(filter)
    .populate({
      path: "ownerId",
      populate: {
        path: "userId",
        select: "name email",
      },
    })
    .sort({
      updatedAt: -1,
    })
    .lean()
    .exec();

  return spaces.map(mapSpace);
}

export async function getMarketplaceSpace(
  externalId: string,
) {
  await connectDb();

  const space = await Space.findOne({
    externalId,
    verificationStatus: "APPROVED",
    operationalStatus: "ACTIVE",
  })
    .populate({
      path: "ownerId",
      populate: {
        path: "userId",
        select: "name email",
      },
    })
    .lean()
    .exec();

  if (!space) {
    return null;
  }

  return mapSpace(space);
}
`,
);


/* =========================================================
   3. DB-BACKED /api/spaces
   ========================================================= */

write(
  "src/app/api/spaces/route.ts",
  `
import { NextResponse } from "next/server";
import { getMarketplaceSpaces } from "@/lib/services/space-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") ?? undefined;

    const spaces = await getMarketplaceSpaces(mode);

    return NextResponse.json({
      ok: true,
      count: spaces.length,
      spaces,
    });
  } catch (error) {
    console.error("GET /api/spaces failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "SPACES_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}
`,
);


/* =========================================================
   4. REPLACE PARKING MARKETPLACE WITH DB-BACKED VERSION
   ========================================================= */

write(
  "src/components/parking-marketplace.tsx",
  `
"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CalendarDays,
  Car,
  CircleAlert,
  Clock,
  Loader2,
  MapPin,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { MapPanel } from "./map-panel";
import { filterParking } from "@/lib/domain/marketplace";
import type { SpaceSummary } from "@/lib/types";

export function ParkingMarketplace() {
  const [spaces, setSpaces] = useState<SpaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");

  const [sort, setSort] = useState<
    "recommended" |
    "nearest" |
    "price" |
    "availability" |
    "reliable"
  >("recommended");

  const [available, setAvailable] =
    useState(true);

  const [covered, setCovered] =
    useState(false);

  const [monthly, setMonthly] =
    useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "/api/spaces?mode=PARKING",
          {
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(
            data.error ?? "Unable to load parking",
          );
        }

        if (active) {
          setSpaces(data.spaces ?? []);
        }
      } catch (err) {
        console.error(err);

        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load parking",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredSpaces = useMemo(
    () =>
      filterParking(spaces, {
        query,
        sort,
        availableOnly: available,
        covered,
        verified: true,
        monthly,
      }),
    [
      spaces,
      query,
      sort,
      available,
      covered,
      monthly,
    ],
  );

  return (
    <div className="space-y-5">
      <div className="panel p-5">
        <div className="flex flex-col gap-4 lg:flex-row">
          <label className="flex flex-1 items-center gap-3 rounded-2xl bg-cloud px-4 py-3">
            <MapPin
              size={18}
              className="text-signal"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              className="w-full bg-transparent text-sm outline-none"
              placeholder="Search Indiranagar, MG Road, landmark..."
            />
          </label>

          <label className="flex items-center gap-2 rounded-2xl bg-cloud px-4 py-3 text-sm">
            <CalendarDays size={17} />
            <span>Today · 6:30 PM</span>
          </label>

          <label className="flex items-center gap-2 rounded-2xl bg-cloud px-4 py-3 text-sm">
            <Clock size={17} />
            <span>2 hours</span>
          </label>

          <button className="rounded-2xl bg-ink px-5 py-3 text-sm font-bold text-white">
            Search parking
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <SlidersHorizontal size={16} />

          <button
            onClick={() =>
              setAvailable(!available)
            }
            className={\`chip \${
              available
                ? "bg-ink text-white"
                : "bg-slate-100"
            }\`}
          >
            Available now
          </button>

          <button
            onClick={() => setCovered(!covered)}
            className={\`chip \${
              covered
                ? "bg-ink text-white"
                : "bg-slate-100"
            }\`}
          >
            Covered
          </button>

          <button
            onClick={() => setMonthly(!monthly)}
            className={\`chip \${
              monthly
                ? "bg-ink text-white"
                : "bg-slate-100"
            }\`}
          >
            Monthly
          </button>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value as typeof sort,
              )
            }
            className="ml-auto rounded-xl border bg-white px-3 py-1.5 text-sm"
          >
            <option value="recommended">
              Recommended
            </option>
            <option value="nearest">
              Nearest
            </option>
            <option value="price">
              Lowest price
            </option>
            <option value="availability">
              Most availability
            </option>
            <option value="reliable">
              Most reliable
            </option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="panel flex items-center justify-center gap-3 p-12 text-slate-500">
          <Loader2
            size={20}
            className="animate-spin"
          />
          Loading verified spaces from SPARC...
        </div>
      ) : error ? (
        <div className="panel p-10 text-center">
          <CircleAlert className="mx-auto mb-3 text-coral" />
          <h3 className="font-bold">
            Marketplace unavailable
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            {error}
          </p>
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[.88fr_1.12fr]">
          <MapPanel spaces={filteredSpaces} />

          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="eyebrow">
                  Live database marketplace
                </p>

                <h2 className="text-xl font-bold">
                  {filteredSpaces.length} verified parking
                  options
                </h2>
              </div>

              <span className="chip bg-mint">
                DB VERIFIED
              </span>
            </div>

            <div className="space-y-3">
              {filteredSpaces.map((space) => (
                <Link
                  href={\`/parking/\${space.id}\`}
                  key={space.id}
                  className="panel flex gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint">
                    <Car size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between gap-3">
                      <h3 className="truncate font-bold">
                        {space.title}
                      </h3>

                      <b>
                        ₹{space.price}
                        <small className="font-normal text-slate-500">
                          /hr
                        </small>
                      </b>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {space.zone} ·{" "}
                      {space.distanceKm} km away
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="chip bg-emerald-50 text-emerald-700">
                        <ShieldCheck size={12} />
                        VERIFIED
                      </span>

                      <span
                        className={\`chip \${
                          space.available === 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100"
                        }\`}
                      >
                        {space.available === 0
                          ? "FULL"
                          : \`\${space.available} available\`}
                      </span>

                      {space.covered && (
                        <span className="chip bg-slate-100">
                          Covered
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      <b className="text-ink">
                        {space.freshness}
                      </b>{" "}
                      database status ·{" "}
                      {space.reliability}% reliability ·
                      forecast {space.forecast} free
                    </p>
                  </div>
                </Link>
              ))}

              {!filteredSpaces.length && (
                <div className="panel p-9 text-center">
                  <CircleAlert className="mx-auto mb-3 text-coral" />

                  <h3 className="font-bold">
                    No matching parking found
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Try widening your filters.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
`,
);


/* =========================================================
   5. DB-BACKED HOME PAGE
   ========================================================= */

write(
  "src/app/page.tsx",
  `
"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
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
          { cache: "no-store" },
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

    return () => {
      active = false;
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
                        key={\`\${value}-\${index}\`}
                      >
                        <div
                          className="w-full rounded-t-xl bg-signal"
                          style={{
                            height: \`\${value * 5}px\`,
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
                        href={\`/parking/\${space.id}\`}
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
                        href={\`/parking/\${space.id}\`}
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
`,
);


/* =========================================================
   6. DB-BACKED SPACE DETAIL PAGE
   ========================================================= */

write(
  "src/app/parking/[id]/page.tsx",
  `
import { notFound } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getMarketplaceSpace } from "@/lib/services/space-service";
import { BookingPanel } from "@/components/booking-panel";
import { MapPanel } from "@/components/map-panel";
import { ShieldCheck } from "lucide-react";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const space = await getMarketplaceSpace(id);

  if (!space) {
    return notFound();
  }

  return (
    <DashboardShell>
      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div>
            <p className="eyebrow">
              {space.zone} · {space.distanceKm} km away
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              {space.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {space.address}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip bg-emerald-50 text-emerald-700">
                <ShieldCheck size={13} />
                VERIFIED SPACE
              </span>

              <span className="chip bg-slate-100">
                {space.reliability}% reliability
              </span>

              <span className="chip bg-slate-100">
                {space.covered
                  ? "Covered"
                  : "Open-air"}
              </span>
            </div>
          </div>

          <MapPanel spaces={[space]} />

          <div className="panel p-6">
            <p className="eyebrow">
              Availability, clearly separated
            </p>

            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-emerald-50 p-4">
                <span className="chip bg-emerald-100 text-emerald-800">
                  {space.freshness} · DATABASE
                </span>

                <p className="mt-3 text-3xl font-bold">
                  {space.available}{" "}
                  <small className="text-sm font-normal">
                    spaces free
                  </small>
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Availability stored in the SPARC
                  operational database.
                </p>
              </div>

              <div className="rounded-2xl bg-slate-100 p-4">
                <span className="chip bg-white">
                  FORECAST ·{" "}
                  {space.reliability}% confidence
                </span>

                <p className="mt-3 text-3xl font-bold">
                  {space.forecast}{" "}
                  <small className="text-sm font-normal">
                    likely free
                  </small>
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  Deterministic forecast based on
                  current availability.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-end gap-3">
              {[
                space.available,
                space.forecast,
                Math.max(
                  0,
                  space.forecast - 2,
                ),
                Math.max(
                  0,
                  space.forecast - 4,
                ),
              ].map((value, index) => (
                <div
                  className="flex flex-1 flex-col items-center gap-2"
                  key={\`\${value}-\${index}\`}
                >
                  <div
                    className="w-full rounded-t-lg bg-signal"
                    style={{
                      height: \`\${20 + value * 8}px\`,
                      opacity:
                        1 - index * 0.15,
                    }}
                  />

                  <span className="text-xs text-slate-500">
                    {7 + index * 15}:00
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-6">
            <p className="eyebrow">
              Space information
            </p>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="font-semibold">
                  Amenities
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {space.amenities.length
                    ? space.amenities.join(" · ")
                    : "Standard facilities"}
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  Operator
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {space.owner} · verified operator
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  Operating status
                </p>

                <p className="mt-1 text-sm text-emerald-700">
                  ACTIVE · verified by SPARC
                </p>
              </div>

              <div>
                <p className="font-semibold">
                  Monthly parking
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {space.monthlyPrice !== null
                    ? \`From ₹\${space.monthlyPrice}/month\`
                    : "Not offered at this location"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <BookingPanel space={space} />
      </section>
    </DashboardShell>
  );
}
`,
);


/* =========================================================
   7. REMOVE TEMPORARY REPAIR SCRIPTS
   ========================================================= */

for (const file of [
  "scripts/fix-remaining-syntax.mjs",
  "scripts/repair-operators.mjs",
]) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`REMOVED ${file}`);
  }
}

console.log("");
console.log("==============================================");
console.log("SPARC M7 FINAL INTEGRATION PATCH COMPLETE");
console.log("==============================================");
