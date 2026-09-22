"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CheckCircle2, QrCode } from "lucide-react";

type Reservation = {
  _id: string;
  reference: string;
  startAt: string;
  endAt: string;
  amount: number;
  status:
    | "RESERVED"
    | "CHECKED_IN"
    | "OCCUPIED"
    | "CHECKED_OUT"
    | "CANCELLED"
    | "FAILED";
  qrPayload?: string;
  spaceId?: {
    title?: string;
    zone?: string;
    address?: string;
  };
};

export function ReservationPass({ id }: { id: string }) {
  const [reservation, setReservation] =
    useState<Reservation | null>(null);

  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionTarget, setTransitionTarget] =
    useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadReservation() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`/api/reservations/${id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "RESERVATION_NOT_FOUND");
      }

      setReservation(data.reservation);

      const payload =
        data.reservation.qrPayload ??
        `sparc://reservation/${data.reservation.reference}`;

      const image = await QRCode.toDataURL(payload, {
        width: 220,
        margin: 1,
      });

      setQr(image);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load reservation."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReservation();
  }, [id]);

  async function transitionTo(nextStatus: string) {
    if (!reservation) return;

    setTransitioning(true);
    setTransitionTarget(nextStatus);
    setError("");

    try {
      const response = await fetch(
        `/api/reservations/${reservation._id}/transition`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "TRANSITION_FAILED");
      }

      setReservation(data.reservation);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update reservation."
      );
    } finally {
      setTransitioning(false);
      setTransitionTarget(null);
    }
  }

  async function advance() {
    if (!reservation) return;

    const next: Record<string, string> = {
      RESERVED: "CHECKED_IN",
      CHECKED_IN: "OCCUPIED",
      OCCUPIED: "CHECKED_OUT",
    };

    const nextStatus = next[reservation.status];

    if (nextStatus) {
      await transitionTo(nextStatus);
    }
  }

  if (loading) {
    return (
      <div className="panel p-10 text-center">
        <p className="font-semibold">
          Loading reservation...
        </p>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="panel p-10 text-center">
        <h1 className="text-xl font-bold">
          Reservation unavailable
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          {error || "Reservation not found."}
        </p>
      </div>
    );
  }

  const steps = [
    "RESERVED",
    "CHECKED_IN",
    "OCCUPIED",
    "CHECKED_OUT",
  ] as const;

  const currentIndex = steps.indexOf(
    reservation.status as (typeof steps)[number]
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="panel overflow-hidden">
        <div className="bg-ink p-6 text-white">
          <p className="eyebrow text-mint">
            SPARC · Parking reservation
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            You&apos;re confirmed.
          </h1>

          <p className="mt-1 text-slate-300">
            Payment recorded · ₹{reservation.amount}
          </p>
        </div>

        <div className="grid gap-5 p-6 sm:grid-cols-[1fr_190px]">
          <div>
            <span className="chip bg-emerald-50 text-emerald-700">
              <CheckCircle2 size={13} />
              {reservation.status.replace("_", " ")}
            </span>

            <h2 className="mt-4 text-xl font-bold">
              {reservation.spaceId?.title ?? "Reserved space"}
            </h2>

            <p className="mt-1 text-slate-500">
              {reservation.spaceId?.zone ?? "Urban zone"}
            </p>

            <dl className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt>Date & time</dt>
                <dd className="text-right font-semibold">
                  {new Date(
                    reservation.startAt
                  ).toLocaleString()}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt>Reservation ID</dt>
                <dd className="font-semibold">
                  {reservation.reference}
                </dd>
              </div>

              <div className="flex justify-between">
                <dt>Total</dt>
                <dd className="font-semibold">
                  ₹{reservation.amount}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl bg-cloud p-3 text-center">
            {qr ? (
              <img
                src={qr}
                alt="Reservation QR"
                className="mx-auto w-full"
              />
            ) : (
              <QrCode className="mx-auto m-10" />
            )}

            <p className="mt-2 text-xs text-slate-500">
              Scan at entry
            </p>
          </div>
        </div>
      </div>

      <div className="panel p-5">
        <p className="eyebrow">
          Reservation lifecycle
        </p>

        <div className="mt-4 grid grid-cols-4 gap-1">
          {steps.map((step, index) => {
            const done = currentIndex >= index;

            return (
              <div key={step}>
                <div
                  className={`h-2 rounded-full ${
                    done ? "bg-signal" : "bg-slate-200"
                  }`}
                />

                <p className="mt-2 text-[10px] font-bold text-slate-500">
                  {step.replace("_", " ")}
                </p>
              </div>
            );
          })}
        </div>

        {reservation.status !== "CHECKED_OUT" &&
          !["CANCELLED", "FAILED"].includes(
            reservation.status
          ) && (
            <>
              <button
                onClick={advance}
                disabled={transitioning}
                className="mt-6 w-full rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:bg-slate-300"
              >
                {transitioning
                  ? transitionTarget === "CANCELLED"
                    ? "Cancelling..."
                    : "Updating..."
                  : reservation.status === "RESERVED"
                    ? "Simulate check-in"
                    : reservation.status === "CHECKED_IN"
                      ? "Confirm occupancy"
                      : "Simulate check-out"}
              </button>

              {reservation.status === "RESERVED" && (
                <button
                  type="button"
                  onClick={() =>
                    void transitionTo("CANCELLED")
                  }
                  disabled={transitioning}
                  className="mt-3 w-full rounded-xl border border-red-200 py-3 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {transitioning &&
                  transitionTarget === "CANCELLED"
                    ? "Cancelling..."
                    : "Cancel reservation"}
                </button>
              )}
            </>
          )}

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {error}
          </div>
        )}

        <p className="mt-3 text-xs text-slate-500">
          Lifecycle transitions are validated by the server.
        </p>
      </div>
    </div>
  );
}

