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

    const interval = window.setInterval(() => {
      void load();
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(interval);
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
            className={`chip ${
              available
                ? "bg-ink text-white"
                : "bg-slate-100"
            }`}
          >
            Available now
          </button>

          <button
            onClick={() => setCovered(!covered)}
            className={`chip ${
              covered
                ? "bg-ink text-white"
                : "bg-slate-100"
            }`}
          >
            Covered
          </button>

          <button
            onClick={() => setMonthly(!monthly)}
            className={`chip ${
              monthly
                ? "bg-ink text-white"
                : "bg-slate-100"
            }`}
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
                  href={`/parking/${space.id}`}
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
                        className={`chip ${
                          space.available === 0
                            ? "bg-rose-50 text-rose-700"
                            : "bg-slate-100"
                        }`}
                      >
                        {space.available === 0
                          ? "FULL"
                          : `${space.available} available`}
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

