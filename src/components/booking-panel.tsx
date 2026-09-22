"use client";

import { useState } from "react";
import { SpaceSummary } from "@/lib/types";
import { calculateCharge } from "@/lib/domain/reservation";
import { CheckCircle2, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export function BookingPanel({
  space,
}: {
  space: SpaceSummary;
}) {
  const [hours, setHours] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const total = calculateCharge(space.price, hours);

  async function book() {
    setLoading(true);
    setError("");

    try {
      const now = new Date();

      const startAt = new Date(now);
      startAt.setMinutes(0, 0, 0);
      startAt.setHours(startAt.getHours() + 1);

      const endAt = new Date(startAt);
      endAt.setHours(
        endAt.getHours() + hours,
      );

      const response = await fetch(
        "/api/reservations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            spaceId: space.id,
            startAt: startAt.toISOString(),
            endAt: endAt.toISOString(),
            mode: space.mode,
            requiresCharging:
              space.mode === "EV",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "BOOKING_FAILED",
        );
      }

      const reservation =
        data.reservation;

      localStorage.setItem(
        "sparc-last-booking",
        reservation._id,
      );

      router.push(
        `/bookings/${reservation._id}`,
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "BOOKING_FAILED";

      setError(
        message === "SPACE_NOT_BOOKABLE"
          ? "This space is no longer available for booking."
          : message === "SPACE_FULL"
            ? "This space is currently full."
            : message === "RESERVATION_CONFLICT"
              ? "This space is already reserved for that time."
              : message === "MODE_MISMATCH"
                ? "This space is not compatible with the selected mobility mode."
                : message === "PAYMENT_FAILED"
                  ? "Demo payment could not be completed."
                  : message,
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <aside className="panel h-fit p-5 lg:sticky lg:top-5">
      <p className="eyebrow">
        Reserve a space
      </p>

      <h2 className="mt-1 text-xl font-bold">
        ₹{space.price}{" "}
        <span className="text-sm font-normal text-slate-500">
          per hour
        </span>
      </h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <label className="rounded-xl bg-cloud p-3 text-xs font-semibold">
          DATE
          <span className="mt-1 block text-sm font-normal">
            Today
          </span>
        </label>

        <label className="rounded-xl bg-cloud p-3 text-xs font-semibold">
          START
          <span className="mt-1 block text-sm font-normal">
            Next available hour
          </span>
        </label>
      </div>

      <label className="mt-3 block text-xs font-semibold">
        DURATION

        <select
          value={hours}
          onChange={(e) =>
            setHours(Number(e.target.value))
          }
          className="mt-1 w-full rounded-xl border bg-white p-3 text-sm font-normal"
        >
          <option value={1}>
            1 hour
          </option>
          <option value={2}>
            2 hours
          </option>
          <option value={3}>
            3 hours
          </option>
        </select>
      </label>

      <div className="mt-5 space-y-2 border-y py-4 text-sm">
        <div className="flex justify-between">
          <span>Parking charge</span>
          <span>₹{total.amount}</span>
        </div>

        <div className="flex justify-between">
          <span>Service fee</span>
          <span>Included</span>
        </div>

        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>₹{total.amount}</span>
        </div>
      </div>

      <div className="mt-4 rounded-xl bg-mint p-3 text-xs">
        <span className="flex items-center gap-1 font-bold">
          <Star size={14} />
          STAR MEMBER
        </span>

        <p className="mt-1">
          Priority booking and reduced platform fee
          apply at confirmation.
        </p>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
          {error}
        </div>
      )}

      <button
        disabled={
          space.available === 0 ||
          loading
        }
        onClick={book}
        className="mt-5 w-full rounded-xl bg-ink py-3 text-sm font-bold text-white disabled:bg-slate-300"
      >
        {loading
          ? "Confirming reservation..."
          : space.available === 0
            ? "Currently full"
            : `Pay ₹${total.amount} & reserve`}
      </button>

      <p className="mt-3 flex gap-1 text-xs text-slate-500">
        <CheckCircle2
          size={14}
          className="text-signal"
        />
        Server validates availability and
        conflicts at confirmation.
      </p>
    </aside>
  );
}

