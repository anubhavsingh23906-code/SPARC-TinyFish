"use client";

import { FormEvent, useState } from "react";
import {
  BadgeCheck,
  ExternalLink,
  Loader2,
  SearchCheck,
} from "lucide-react";

const DEFAULT_GOAL =
  "Find the latest parking information on this website. Extract current parking availability, price, operating hours, EV charging availability, and parking restrictions. Do not guess information that is not present on the website.";

const RESULT_FIELDS = [
  {
    label: "Availability",
    keys: [
      "availability",
      "parkingavailability",
      "currentavailability",
      "currentparkingavailability",
      "available",
      "availablespaces",
      "spacesavailable",
    ],
  },
  {
    label: "Price",
    keys: [
      "price",
      "pricing",
      "currentprice",
      "cost",
      "rate",
      "hourlyrate",
      "hourlyprice",
      "priceperhour",
      "parkingprice",
    ],
  },
  {
    label: "Operating hours",
    keys: ["operatinghours", "hours", "openinghours", "businesshours"],
  },
  {
    label: "EV charging",
    keys: [
      "evcharging",
      "evchargingavailability",
      "evchargingavailable",
      "electricvehiclecharging",
      "electricvehiclechargingavailability",
      "chargers",
    ],
  },
  {
    label: "Restrictions",
    keys: ["restrictions", "parkingrestrictions", "rules", "conditions"],
  },
] as const;

type Verification = {
  url: string;
  data: unknown;
};

function normalizeKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function findResultFields(value: unknown) {
  const entries = new Map<string, unknown>();

  function visit(current: unknown) {
    if (Array.isArray(current)) {
      current.forEach(visit);
      return;
    }

    if (!current || typeof current !== "object") {
      return;
    }

    for (const [key, nested] of Object.entries(current)) {
      const normalizedKey = normalizeKey(key);

      for (const field of RESULT_FIELDS) {
        if (field.keys.some((candidate) => candidate === normalizedKey)) {
          if (!entries.has(field.label)) {
            entries.set(field.label, nested);
          }
          break;
        }
      }

      visit(nested);
    }
  }

  visit(value);
  return entries;
}

function formatValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  if (value === null || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return JSON.stringify(value, null, 2) ?? String(value);
}

export function LiveWebVerification() {
  const [url, setUrl] = useState("");
  const [goal, setGoal] = useState(DEFAULT_GOAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verification, setVerification] = useState<Verification | null>(null);

  async function verifyWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setVerification(null);

    try {
      const response = await fetch("/api/tinyfish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, goal }),
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : `TinyFish request failed (${response.status}). Please try again.`;
        throw new Error(message);
      }

      setVerification({ url, data: payload });

      if (findResultFields(payload).size === 0) {
        console.debug("TinyFish returned an unrecognized result format:", payload);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to verify this website. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  const resultFields = verification
    ? findResultFields(verification.data)
    : new Map<string, unknown>();

  return (
    <section className="panel overflow-hidden">
      <div className="border-b border-slate-100 bg-cloud/60 p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-mint text-ink">
              <SearchCheck size={21} />
            </div>
            <div>
              <p className="eyebrow">Live parking intelligence</p>
              <h2 className="mt-1 text-xl font-bold">
                Live Web Verification
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-500">
                Ask TinyFish to check a parking provider&apos;s public website
                and return the information it finds.
              </p>
            </div>
          </div>
          <span className="chip bg-white text-signal">
            <span className="h-2 w-2 rounded-full bg-signal" />
            TinyFish web agent
          </span>
        </div>
      </div>

      <form className="space-y-4 p-5 md:p-6" onSubmit={verifyWebsite}>
        <div>
          <label
            className="mb-1.5 block text-sm font-semibold"
            htmlFor="tinyfish-url"
          >
            Public parking or provider website
          </label>
          <input
            autoComplete="url"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/20"
            id="tinyfish-url"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/parking"
            required
            type="url"
            value={url}
          />
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-semibold"
            htmlFor="tinyfish-goal"
          >
            What should TinyFish look for?
          </label>
          <textarea
            className="min-h-28 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/20"
            id="tinyfish-goal"
            onChange={(event) => setGoal(event.target.value)}
            required
            value={goal}
          />
        </div>

        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p className="text-xs text-slate-500">
            Runs only when you click. Results come from the live TinyFish
            response.
          </p>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-5 py-3 text-sm font-bold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={17} />
                TinyFish is checking the website...
              </>
            ) : (
              <>
                <SearchCheck size={17} />
                Verify with TinyFish
              </>
            )}
          </button>
        </div>

        {error && (
          <p
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
      </form>

      {verification && (
        <article
          aria-live="polite"
          className="border-t border-slate-100 p-5 md:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Website verification result</p>
              <h3 className="mt-1 text-lg font-bold">Parking information</h3>
            </div>
            <span className="chip bg-mint text-ink">
              <BadgeCheck size={15} />
              Verified by TinyFish
            </span>
          </div>

          <a
            className="mt-3 inline-flex max-w-full items-center gap-1.5 break-all text-sm font-medium text-signal hover:underline"
            href={verification.url}
            rel="noreferrer"
            target="_blank"
          >
            {verification.url}
            <ExternalLink className="shrink-0" size={14} />
          </a>

          {resultFields.size > 0 ? (
            <dl className="mt-5 grid gap-3 sm:grid-cols-2">
              {[...resultFields.entries()].map(([label, value]) => (
                <div
                  className="rounded-2xl bg-cloud p-4"
                  key={label}
                >
                  <dt className="eyebrow">{label}</dt>
                  <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink">
                    {formatValue(value)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <pre className="mt-5 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-cloud p-4 font-sans text-sm leading-6 text-ink">
              {formatValue(verification.data)}
            </pre>
          )}

          {resultFields.size > 0 && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-slate-500">
                View complete TinyFish response
              </summary>
              <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-2xl bg-cloud p-4 font-mono text-xs leading-5 text-slate-700">
                {formatValue(verification.data)}
              </pre>
            </details>
          )}
        </article>
      )}
    </section>
  );
}
