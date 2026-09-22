import { connectDb } from "@/lib/db";
import {
  DemandSnapshot,
  Incident,
  Space,
} from "@/lib/models";
import { getActiveCityInterventions } from "@/lib/services/city-action-service";

export async function getCityIntelligence() {
  await connectDb();

  const spaces = await Space.find({
    verificationStatus: "APPROVED",
    operationalStatus: "ACTIVE",
  })
    .lean();

  const zones = new Map<
    string,
    {
      zone: string;
      capacity: number;
      available: number;
      used: number;
      spaces: number;
    }
  >();

  for (const space of spaces) {
    const zone = space.zone || "UNKNOWN";

    const current = zones.get(zone) ?? {
      zone,
      capacity: 0,
      available: 0,
      used: 0,
      spaces: 0,
    };

    const capacity = Number(space.capacity ?? 0);
    const available = Number(space.available ?? 0);

    current.capacity += capacity;
    current.available += available;
    current.used += Math.max(
      0,
      capacity - available,
    );
    current.spaces += 1;

    zones.set(zone, current);
  }

  const zoneData = Array.from(zones.values()).map(
    (zone) => {
      const utilization =
        zone.capacity > 0
          ? Math.round(
              (zone.used / zone.capacity) * 100,
            )
          : 0;

      let status:
        | "NORMAL"
        | "BUSY"
        | "CRITICAL";

      if (utilization >= 90) {
        status = "CRITICAL";
      } else if (utilization >= 70) {
        status = "BUSY";
      } else {
        status = "NORMAL";
      }

      return {
        ...zone,
        utilization,
        status,
      };
    },
  );

  const totalCapacity = zoneData.reduce(
    (sum, zone) => sum + zone.capacity,
    0,
  );

  const totalAvailable = zoneData.reduce(
    (sum, zone) => sum + zone.available,
    0,
  );

  const totalUsed =
    totalCapacity - totalAvailable;

  const cityUtilization =
    totalCapacity > 0
      ? Math.round(
          (totalUsed / totalCapacity) * 100,
        )
      : 0;

  const criticalZones = zoneData.filter(
    (zone) => zone.status === "CRITICAL",
  );

  const busyZones = zoneData.filter(
    (zone) => zone.status === "BUSY",
  );

  const incidents = await Incident.find({
    status: {
      $in: ["OPEN", "ACKNOWLEDGED"],
    },
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  const latestDemand = await DemandSnapshot.find({})
    .sort({ timestamp: -1 })
    .limit(20)
    .lean();

  const interventions =
    await getActiveCityInterventions();

  return {
    generatedAt: new Date().toISOString(),

    city: {
      capacity: totalCapacity,
      available: totalAvailable,
      occupied: totalUsed,
      utilization: cityUtilization,
    },

    zones: zoneData,

    alerts: {
      criticalZones: criticalZones.length,
      busyZones: busyZones.length,
      incidents: incidents.length,
    },

    criticalZones,

    busyZones,

    incidents,

    latestDemand,
    interventions,
  };
}