import { connectDb } from "@/lib/db";
import { Space } from "@/lib/models";
import type { SpaceMode, VerificationStatus, OperationalStatus } from "@/lib/types";

export type MarketplaceSpace = {
  id: string;
  title: string;
  zone: string;
  address: string;
  price: number;
  monthlyPrice: number | undefined;
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
  mode: SpaceMode;
  coordinates: {
    lat: number;
    lng: number;
  };
  verificationStatus: VerificationStatus;
  operationalStatus: OperationalStatus;
  verified: boolean;
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

  const monthly = typeof space.pricing?.monthly === "number" ? Number(space.pricing.monthly) : undefined;

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

  const verificationStatus = (space.verificationStatus ?? "PENDING") as VerificationStatus;

  const operationalStatus = (space.operationalStatus ?? "INACTIVE") as OperationalStatus;

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
    monthly: monthly !== undefined,
    reliability,
    freshness: freshness(space.lastUpdatedAt),
    forecast,
    amenities,
    restrictions,
    owner:
      space.ownerId?.userId?.name ??
      "Verified operator",
    mode: (space.mode ?? "PARKING") as SpaceMode,
    coordinates,
    verificationStatus,
    operationalStatus,
    verified:
      verificationStatus === "APPROVED" &&
      operationalStatus === "ACTIVE",
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


