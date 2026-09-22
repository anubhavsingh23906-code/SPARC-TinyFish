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
                  key={`${value}-${index}`}
                >
                  <div
                    className="w-full rounded-t-lg bg-signal"
                    style={{
                      height: `${20 + value * 8}px`,
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
                    ? `From ₹${space.monthlyPrice}/month`
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

