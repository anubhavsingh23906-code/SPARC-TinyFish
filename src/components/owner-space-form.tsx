"use client";

import { useEffect, useState } from "react";

type OwnerSpace = {
  id: string;
  title: string;
  address: string;
  zone: string;
  mode: string;
  capacity: number;
  available: number;
  hourly: number;
  daily: number;
  monthly: number | null;
  verificationStatus: string;
  operationalStatus: string;
};

const initialForm = {
  title: "",
  address: "",
  zone: "",
  mode: "PARKING",
  capacity: "10",
  hourly: "50",
  daily: "300",
  monthly: "",
  amenities: "",
  restrictions: "",
  lat: "12.9716",
  lng: "77.5946",
};

function statusClass(status: string) {
  if (status === "APPROVED") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    status === "REJECTED" ||
    status === "CHANGES_REQUESTED"
  ) {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-700";
}

export function OwnerSpaceForm() {
  const [form, setForm] = useState(initialForm);
  const [spaces, setSpaces] = useState<OwnerSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadSpaces() {
    try {
      setLoading(true);

      const response = await fetch("/api/owner/spaces", {
        cache: "no-store",
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "OWNER_SPACES_LOAD_FAILED");
      }

      setSpaces(body.spaces ?? []);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "OWNER_SPACES_LOAD_FAILED",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadSpaces();
  }, []);

  function update(field: keyof typeof initialForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage(null);
      setError(null);

      const response = await fetch("/api/owner/spaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          address: form.address,
          zone: form.zone,
          mode: form.mode,
          capacity: Number(form.capacity),
          hourly: Number(form.hourly),
          daily: Number(form.daily),
          monthly:
            form.monthly.trim() === ""
              ? undefined
              : Number(form.monthly),
          amenities: form.amenities
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          restrictions: form.restrictions
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean),
          lat: Number(form.lat),
          lng: Number(form.lng),
        }),
      });

      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error ?? "SPACE_CREATE_FAILED");
      }

      setForm(initialForm);
      setMessage(
        "Space submitted successfully. It is now pending administrator verification.",
      );

      await loadSpaces();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "SPACE_CREATE_FAILED",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="panel p-6">
        <div className="mb-6">
          <p className="eyebrow">Owner onboarding</p>
          <h2 className="mt-1 text-2xl font-bold">
            Add a new space
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Submit your space for SPARC administrator verification.
            Approved spaces become visible to users.
          </p>
        </div>

        {message && (
          <div className="mb-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={submit}
          className="grid gap-4 md:grid-cols-2"
        >
          <label className="text-sm font-medium">
            Space name
            <input
              required
              value={form.title}
              onChange={(event) =>
                update("title", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="Central Market Parking"
            />
          </label>

          <label className="text-sm font-medium">
            Zone
            <input
              value={form.zone}
              onChange={(event) =>
                update("zone", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="Central Market"
            />
          </label>

          <label className="text-sm font-medium md:col-span-2">
            Address
            <input
              required
              value={form.address}
              onChange={(event) =>
                update("address", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="Full address of the space"
            />
          </label>

          <label className="text-sm font-medium">
            Space type
            <select
              value={form.mode}
              onChange={(event) =>
                update("mode", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            >
              <option value="PARKING">Parking</option>
              <option value="LOADING">Loading & Delivery</option>
              <option value="PICKUP">Pickup & Drop-off</option>
              <option value="EV">EV</option>
              <option value="ACCESSIBILITY">Accessibility</option>
            </select>
          </label>

          <label className="text-sm font-medium">
            Capacity
            <input
              required
              type="number"
              min="1"
              value={form.capacity}
              onChange={(event) =>
                update("capacity", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            />
          </label>

          <label className="text-sm font-medium">
            Hourly price (₹)
            <input
              required
              type="number"
              min="0"
              value={form.hourly}
              onChange={(event) =>
                update("hourly", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            />
          </label>

          <label className="text-sm font-medium">
            Daily price (₹)
            <input
              required
              type="number"
              min="0"
              value={form.daily}
              onChange={(event) =>
                update("daily", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            />
          </label>

          <label className="text-sm font-medium">
            Monthly price (₹)
            <input
              type="number"
              min="0"
              value={form.monthly}
              onChange={(event) =>
                update("monthly", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="Optional"
            />
          </label>

          <label className="text-sm font-medium">
            Amenities
            <input
              value={form.amenities}
              onChange={(event) =>
                update("amenities", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="Covered, CCTV, Security"
            />
            <span className="mt-1 block text-xs text-slate-400">
              Separate multiple items with commas.
            </span>
          </label>

          <label className="text-sm font-medium">
            Restrictions
            <input
              value={form.restrictions}
              onChange={(event) =>
                update("restrictions", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
              placeholder="No heavy vehicles"
            />
          </label>

          <label className="text-sm font-medium">
            Latitude
            <input
              type="number"
              step="any"
              value={form.lat}
              onChange={(event) =>
                update("lat", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            />
          </label>

          <label className="text-sm font-medium">
            Longitude
            <input
              type="number"
              step="any"
              value={form.lng}
              onChange={(event) =>
                update("lng", event.target.value)
              }
              className="mt-2 w-full rounded-xl border px-4 py-3"
            />
          </label>

          <div className="md:col-span-2 flex items-center justify-between gap-4 rounded-xl bg-cloud p-4">
            <div>
              <p className="font-semibold">
                Verification required
              </p>
              <p className="text-sm text-slate-500">
                Your space will remain hidden from users until an
                administrator approves it.
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {saving
                ? "Submitting..."
                : "Submit for Verification"}
            </button>
          </div>
        </form>
      </div>

      <div className="panel overflow-hidden">
        <div className="p-5">
          <p className="eyebrow">Owner portfolio</p>
          <h2 className="mt-1 text-xl font-bold">
            My spaces
          </h2>
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-500">
            Loading your spaces...
          </div>
        ) : spaces.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No spaces submitted yet.
          </div>
        ) : (
          <div className="divide-y">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <div>
                  <p className="font-semibold">
                    {space.title}
                  </p>
                  <p className="text-sm text-slate-500">
                    {space.address}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {space.mode} · {space.available}/
                    {space.capacity} available
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`chip ${statusClass(
                      space.verificationStatus,
                    )}`}
                  >
                    {space.verificationStatus}
                  </span>

                  {space.operationalStatus === "ACTIVE" && (
                    <span className="chip bg-emerald-50 text-emerald-700">
                      ACTIVE
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
