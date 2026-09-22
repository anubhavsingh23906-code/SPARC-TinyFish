import fs from "node:fs";

function write(file, content) {
  fs.mkdirSync(file.substring(0, file.lastIndexOf("/")), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  console.log(`Wrote ${file}`);
}

/* =========================================================
   1. OWNER SPACE SERVICE
   ========================================================= */

write("src/lib/services/owner-space-service.ts", `import { randomUUID } from "node:crypto";
import { connectDb } from "@/lib/db";
import {
  ActivityLog,
  Space,
  SpaceOwner,
  Verification,
} from "@/lib/models";
import { requireRole, type SessionUser } from "@/lib/auth";

export type CreateOwnerSpaceInput = {
  title: string;
  address: string;
  zone: string;
  mode: "PARKING" | "LOADING" | "PICKUP" | "EV" | "ACCESSIBILITY";
  capacity: number;
  hourly: number;
  daily: number;
  monthly?: number;
  amenities: string[];
  restrictions: string[];
  lat?: number;
  lng?: number;
};

export async function createOwnerSpace(
  actor: SessionUser,
  input: CreateOwnerSpaceInput,
) {
  requireRole(actor, "OWNER");
  await connectDb();

  const owner = await SpaceOwner.findOne({
    userId: actor.id,
  });

  if (!owner) {
    throw new Error("SPACE_OWNER_NOT_FOUND");
  }

  if (!input.title.trim() || !input.address.trim()) {
    throw new Error("TITLE_AND_ADDRESS_REQUIRED");
  }

  if (!Number.isFinite(input.capacity) || input.capacity <= 0) {
    throw new Error("INVALID_CAPACITY");
  }

  if (!Number.isFinite(input.hourly) || input.hourly < 0) {
    throw new Error("INVALID_HOURLY_PRICE");
  }

  const now = new Date();

  const space = await Space.create({
    externalId: \`owner-\${randomUUID()}\`,
    ownerId: owner._id,
    title: input.title.trim(),
    address: input.address.trim(),
    zone: input.zone.trim() || "Unspecified zone",
    coordinates: {
      lat: Number.isFinite(input.lat) ? input.lat : 0,
      lng: Number.isFinite(input.lng) ? input.lng : 0,
    },
    mode: input.mode,
    capacity: input.capacity,
    available: input.capacity,
    amenities: input.amenities,
    restrictions: input.restrictions,
    pricing: {
      hourly: input.hourly,
      daily: input.daily,
      monthly:
        input.monthly !== undefined && input.monthly >= 0
          ? input.monthly
          : undefined,
    },
    verificationStatus: "PENDING",
    operationalStatus: "INACTIVE",
    reliabilityScore: 80,
    lastUpdatedAt: now,
  });

  const verification = await Verification.create({
    ownerId: owner._id,
    spaceId: space._id,
    status: "PENDING",
    demoEvidenceSummary: "Owner-submitted space awaiting administrator verification.",
  });

  await ActivityLog.create({
    actorId: actor.id,
    action: "SPACE_SUBMITTED_FOR_VERIFICATION",
    entityType: "Space",
    entityId: space.id,
    metadata: {
      verificationId: verification.id,
      title: space.title,
    },
  });

  return {
    space,
    verification,
  };
}

export async function getOwnerSpaces(actor: SessionUser) {
  requireRole(actor, "OWNER");
  await connectDb();

  const owner = await SpaceOwner.findOne({
    userId: actor.id,
  });

  if (!owner) {
    throw new Error("SPACE_OWNER_NOT_FOUND");
  }

  const spaces = await Space.find({
    ownerId: owner._id,
  })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  return spaces.map((space: any) => ({
    id: String(space.externalId ?? space._id),
    title: String(space.title ?? "Untitled space"),
    address: String(space.address ?? ""),
    zone: String(space.zone ?? ""),
    mode: String(space.mode ?? "PARKING"),
    capacity: Number(space.capacity ?? 0),
    available: Number(space.available ?? 0),
    hourly: Number(space.pricing?.hourly ?? 0),
    daily: Number(space.pricing?.daily ?? 0),
    monthly:
      typeof space.pricing?.monthly === "number"
        ? Number(space.pricing.monthly)
        : null,
    verificationStatus: String(
      space.verificationStatus ?? "PENDING",
    ),
    operationalStatus: String(
      space.operationalStatus ?? "INACTIVE",
    ),
  }));
}
`);

/* =========================================================
   2. OWNER SPACES API
   ========================================================= */

write("src/app/api/owner/spaces/route.ts", `import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  createOwnerSpace,
  getOwnerSpaces,
} from "@/lib/services/owner-space-service";

const inputSchema = z.object({
  title: z.string().min(2),
  address: z.string().min(3),
  zone: z.string().default(""),
  mode: z.enum([
    "PARKING",
    "LOADING",
    "PICKUP",
    "EV",
    "ACCESSIBILITY",
  ]),
  capacity: z.number().int().positive(),
  hourly: z.number().nonnegative(),
  daily: z.number().nonnegative(),
  monthly: z.number().nonnegative().optional(),
  amenities: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function GET() {
  try {
    const actor = await getCurrentUser();
    const spaces = await getOwnerSpaces(actor);

    return NextResponse.json({
      ok: true,
      spaces,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OWNER_SPACES_LOAD_FAILED";

    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "SPACE_OWNER_NOT_FOUND"
          ? 404
          : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    const body = inputSchema.parse(await request.json());

    const result = await createOwnerSpace(actor, body);

    return NextResponse.json(
      {
        ok: true,
        message: "SPACE_SUBMITTED_FOR_VERIFICATION",
        space: result.space,
        verification: result.verification,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "SPACE_CREATE_FAILED";

    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "SPACE_OWNER_NOT_FOUND"
          ? 404
          : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
`);

/* =========================================================
   3. OWNER ADD SPACE COMPONENT
   ========================================================= */

write("src/components/owner-space-form.tsx", `"use client";

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
                    className={\`chip \${statusClass(
                      space.verificationStatus,
                    )}\`}
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
`);

/* =========================================================
   4. REPLACE OWNER SPACES PAGE
   ========================================================= */

write("src/app/owner/spaces/page.tsx", `import { DashboardShell } from "@/components/dashboard-shell";
import { OwnerSpaceForm } from "@/components/owner-space-form";

export default function Page() {
  return (
    <DashboardShell role="OWNER">
      <section>
        <p className="eyebrow">Owner operations</p>

        <h1 className="mb-6 text-3xl font-bold">
          Spaces & availability
        </h1>

        <OwnerSpaceForm />
      </section>
    </DashboardShell>
  );
}
`);

console.log("M8 owner onboarding implementation complete.");
