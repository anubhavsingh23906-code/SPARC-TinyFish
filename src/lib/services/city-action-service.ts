import { connectDb } from "@/lib/db";
import {
  ActivityLog,
  CityIntervention,
  Space,
} from "@/lib/models";
import { requireRole, SessionUser } from "@/lib/auth";

export type CityAction =
  | "REDIRECT_DEMAND"
  | "CREATE_ZONE_ALERT"
  | "MARK_INTERVENTION";

export interface CityActionInput {
  zone: string;
  action: CityAction;
}

function getUtilization(
  capacity: number,
  available: number,
) {
  if (capacity <= 0) {
    return 0;
  }

  return Math.round(
    ((capacity - available) / capacity) * 100,
  );
}

export async function executeCityAction(
  actor: SessionUser,
  input: CityActionInput,
) {
  requireRole(actor, "CITY_OPERATOR");

  const zone = input.zone.trim();

  if (!zone) {
    throw new Error("ZONE_REQUIRED");
  }

  if (zone.length > 100) {
    throw new Error("ZONE_INVALID");
  }

  const validActions: CityAction[] = [
    "REDIRECT_DEMAND",
    "CREATE_ZONE_ALERT",
    "MARK_INTERVENTION",
  ];

  if (!validActions.includes(input.action)) {
    throw new Error("INVALID_CITY_ACTION");
  }

  await connectDb();

  const zoneSpaces = await Space.find({
    zone,
    verificationStatus: "APPROVED",
    operationalStatus: "ACTIVE",
  })
    .lean()
    .exec();

  if (zoneSpaces.length === 0) {
    throw new Error("ZONE_NOT_FOUND");
  }

  const anchorSpace = zoneSpaces[0];

  const alternatives =
    input.action === "REDIRECT_DEMAND"
      ? await getAlternativeZones(zone)
      : [];

  const status =
    input.action === "REDIRECT_DEMAND"
      ? "ACTIVE"
      : input.action === "MARK_INTERVENTION"
        ? "ACKNOWLEDGED"
        : "ACTIVE";

  let message: string;

  switch (input.action) {
    case "REDIRECT_DEMAND":
      message =
        alternatives.length > 0
          ? `Demand redirection ACTIVE for ${zone}.`
          : `Demand redirection ACTIVE for ${zone}; no suitable alternative capacity was found.`;
      break;

    case "CREATE_ZONE_ALERT":
      message = `Operational alert created for ${zone}.`;
      break;

    case "MARK_INTERVENTION":
      message = `Operator intervention recorded for ${zone}.`;
      break;
  }

  await ActivityLog.create({
    actorId: actor.id,
    action: `CITY_${input.action}`,
    entityType: "Space",
    entityId: anchorSpace._id,
    metadata: {
      zone,
      action: input.action,
      message,
      alternatives,
      timestamp: new Date().toISOString(),
    },
  });

  const intervention = await CityIntervention.create({
    zone,
    action: input.action,
    alternatives,
    status,
    actorId: actor.id,
  });

  return {
    action: input.action,
    zone,
    message,
    alternatives,
    intervention: {
      id: String(intervention._id),
      zone: intervention.zone,
      action: intervention.action,
      alternatives: intervention.alternatives,
      status: intervention.status,
      actor: actor.name,
      createdAt: intervention.createdAt,
      updatedAt: intervention.updatedAt,
    },
  };
}

export async function getActiveCityInterventions() {
  await connectDb();

  const interventions = await CityIntervention.find({
    status: {
      $in: ["ACTIVE", "ACKNOWLEDGED"],
    },
  })
    .populate({
      path: "actorId",
      select: "name role",
    })
    .sort({ updatedAt: -1 })
    .limit(50)
    .lean()
    .exec();

  return interventions.map((intervention: any) => ({
    id: String(intervention._id),
    zone: String(intervention.zone),
    action: String(intervention.action),
    alternatives: intervention.alternatives ?? [],
    status: String(intervention.status),
    actor:
      intervention.actorId?.name ??
      "City operator",
    actorRole:
      intervention.actorId?.role ??
      "CITY_OPERATOR",
    createdAt: intervention.createdAt,
    updatedAt: intervention.updatedAt,
  }));
}

async function getAlternativeZones(
  excludedZone: string,
) {
  const spaces = await Space.find({
    zone: {
      $ne: excludedZone,
    },
    verificationStatus: "APPROVED",
    operationalStatus: "ACTIVE",
    available: {
      $gt: 0,
    },
  })
    .lean()
    .exec();

  const zoneMap = new Map<
    string,
    {
      zone: string;
      capacity: number;
      available: number;
      spaces: number;
      utilization: number;
    }
  >();

  for (const space of spaces) {
    const zone = space.zone || "UNKNOWN";

    const capacity = Number(
      space.capacity ?? 0,
    );

    const available = Number(
      space.available ?? 0,
    );

    const current = zoneMap.get(zone) ?? {
      zone,
      capacity: 0,
      available: 0,
      spaces: 0,
      utilization: 0,
    };

    current.capacity += capacity;
    current.available += available;
    current.spaces += 1;

    zoneMap.set(zone, current);
  }

  return Array.from(zoneMap.values())
    .map((zone) => ({
      ...zone,
      utilization: getUtilization(
        zone.capacity,
        zone.available,
      ),
    }))
    .sort((a, b) => {
      if (a.utilization !== b.utilization) {
        return (
          a.utilization - b.utilization
        );
      }

      return (
        b.available - a.available
      );
    })
    .slice(0, 3);
}