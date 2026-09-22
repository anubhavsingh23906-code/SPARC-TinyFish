"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";

type Reservation = {
  _id: string;
  reference: string;
  startAt: string;
  endAt: string;
  amount: number;
  status: string;
  spaceId?: {
    title?: string;
    zone?: string;
    address?: string;
  };
};

export default function Page() {
  const [reservations, setReservations] =
    useState<Reservation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function load() {
      try {
        const response =
          await fetch("/api/bookings", {
            cache: "no-store",
          });

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ??
              "Unable to load bookings.",
          );
        }

        setReservations(
          data.reservations ?? [],
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load bookings.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  const activeReservations =
    reservations.filter(
      (reservation) =>
        ![
          "CHECKED_OUT",
          "CANCELLED",
          "FAILED",
        ].includes(reservation.status),
    );

  return (
    <DashboardShell>
      <section>
        <p className="eyebrow">
          My reservations
        </p>

        <h1 className="mt-1 text-3xl font-bold">
          Your parking, in one place.
        </h1>

        {loading ? (
          <div className="panel mt-6 p-10 text-center">
            <p className="font-semibold">
              Loading your reservations...
            </p>
          </div>
        ) : error ? (
          <div className="panel mt-6 border border-red-200 p-6">
            <h2 className="font-bold">
              Unable to load reservations
            </h2>

            <p className="mt-2 text-sm text-red-700">
              {error}
            </p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="panel mt-6 p-10 text-center">
            <h2 className="font-bold">
              No reservations yet
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Your confirmed parking passes
              will appear here.
            </p>

            <Link
              className="mt-5 inline-block rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white"
              href="/parking"
            >
              Find parking
            </Link>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {activeReservations.length >
              0 && (
              <div>
                <p className="eyebrow mb-3">
                  Active & upcoming
                </p>

                <div className="space-y-3">
                  {activeReservations.map(
                    (reservation) => (
                      <ReservationCard
                        key={reservation._id}
                        reservation={
                          reservation
                        }
                      />
                    ),
                  )}
                </div>
              </div>
            )}

            {reservations.some(
              (reservation) =>
                [
                  "CHECKED_OUT",
                  "CANCELLED",
                  "FAILED",
                ].includes(
                  reservation.status,
                ),
            ) && (
              <div className="pt-3">
                <p className="eyebrow mb-3">
                  History
                </p>

                <div className="space-y-3">
                  {reservations
                    .filter(
                      (reservation) =>
                        [
                          "CHECKED_OUT",
                          "CANCELLED",
                          "FAILED",
                        ].includes(
                          reservation.status,
                        ),
                    )
                    .map(
                      (reservation) => (
                        <ReservationCard
                          key={
                            reservation._id
                          }
                          reservation={
                            reservation
                          }
                        />
                      ),
                    )}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </DashboardShell>
  );
}

function ReservationCard({
  reservation,
}: {
  reservation: Reservation;
}) {
  return (
    <Link
      href={`/bookings/${reservation._id}`}
      className="panel block p-5 transition hover:-translate-y-0.5"
    >
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="eyebrow">
            {reservation.status.replace(
              "_",
              " ",
            )}
          </p>

          <h2 className="mt-1 text-lg font-bold">
            {reservation.spaceId?.title ??
              "Reserved space"}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {reservation.spaceId?.zone ??
              "Urban zone"}
          </p>

          <p className="mt-3 text-sm">
            {new Date(
              reservation.startAt,
            ).toLocaleString()}
          </p>
        </div>

        <div className="text-left sm:text-right">
          <p className="text-lg font-bold">
            ₹{reservation.amount}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {reservation.reference}
          </p>

          <p className="mt-2 text-sm font-semibold">
            Open pass →
          </p>
        </div>
      </div>
    </Link>
  );
}

