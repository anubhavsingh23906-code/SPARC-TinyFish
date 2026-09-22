import { randomUUID } from "node:crypto";
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
    externalId: `owner-${randomUUID()}`,
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
