import { connectDb } from "@/lib/db";
import { DemandSnapshot, Space } from "@/lib/models";

type ZoneSnapshot = {
  zone: string;
  capacity: number;
  available: number;
  occupied: number;
  utilization: number;
};

type TrendResult = {
  direction:
    | "INCREASING_DEMAND"
    | "DECREASING_DEMAND"
    | "STABLE"
    | "INSUFFICIENT_DATA";
  changePerSnapshot: number;
  confidence: number;
};

function calculateTrend(
  snapshots: Array<{
    available: number;
    timestamp: Date;
  }>,
) {
  if (snapshots.length < 2) {
    return {
      direction: "INSUFFICIENT_DATA" as const,
      changePerSnapshot: 0,
      confidence: 30,
    };
  }

  const ordered = [...snapshots].sort(
    (a, b) =>
      new Date(a.timestamp).getTime() -
      new Date(b.timestamp).getTime(),
  );

  const first = ordered[0];
  const last = ordered[ordered.length - 1];

  const totalChange =
    last.available - first.available;

  const intervals = Math.max(
    1,
    ordered.length - 1,
  );

  const changePerSnapshot =
    totalChange / intervals;

  let direction:
    | "INCREASING_DEMAND"
    | "DECREASING_DEMAND"
    | "STABLE";

  if (totalChange < 0) {
    direction = "INCREASING_DEMAND";
  } else if (totalChange > 0) {
    direction = "DECREASING_DEMAND";
  } else {
    direction = "STABLE";
  }

  const confidence = Math.min(
    95,
    40 + ordered.length * 10,
  );

  return {
    direction,
    changePerSnapshot,
    confidence,
  };
}

function buildZones(
  spaces: Array<{
    zone?: string | null;
    capacity?: number | null;
    available?: number | null;
  }>,
) {
  const zones = new Map<string, ZoneSnapshot>();

  for (const space of spaces) {
    const zone =
      space.zone?.trim() || "UNKNOWN";

    const current =
      zones.get(zone) ?? {
        zone,
        capacity: 0,
        available: 0,
        occupied: 0,
        utilization: 0,
      };

    const capacity = Number(
      space.capacity ?? 0,
    );

    const available = Number(
      space.available ?? 0,
    );

    current.capacity += capacity;
    current.available += available;

    current.occupied += Math.max(
      0,
      capacity - available,
    );

    current.utilization =
      current.capacity > 0
        ? Math.round(
            ((current.capacity -
              current.available) /
              current.capacity) *
              100,
          )
        : 0;

    zones.set(zone, current);
  }

  return Array.from(zones.values());
}

export async function captureDemandSnapshot() {
  await connectDb();

  const spaces = await Space.find({
    verificationStatus: "APPROVED",
    operationalStatus: "ACTIVE",
  })
    .lean()
    .exec();

  const zoneInputs = spaces.map((space) => ({
    zone:
      typeof space.zone === "string"
        ? space.zone
        : null,
    capacity:
      typeof space.capacity === "number"
        ? space.capacity
        : Number(space.capacity ?? 0),
    available:
      typeof space.available === "number"
        ? space.available
        : Number(space.available ?? 0),
  }));

  const zones = buildZones(zoneInputs);

  const timestamp = new Date();

  const snapshots = await Promise.all(
    zones.map(async (zone) => {
      const history =
        await DemandSnapshot.find({
          zone: zone.zone,
        })
          .sort({
            timestamp: -1,
          })
          .limit(5)
          .lean();

      const trend = calculateTrend(
        history.map((item) => ({
          available: Number(
            item.available ?? 0,
          ),
          timestamp: new Date(
            item.timestamp,
          ),
        })),
      );

      const predictedAvailability =
        Math.max(
          0,
          Math.min(
            zone.capacity,
            Math.round(
              zone.available +
                trend.changePerSnapshot,
            ),
          ),
        );

      const predictedDemand =
        Math.max(
          0,
          zone.capacity -
            predictedAvailability,
        );

      const snapshot =
        await DemandSnapshot.create({
          zone: zone.zone,
          timestamp,
          currentOccupancy:
            zone.occupied,
          available: zone.available,
          predictedAvailability,
          predictedDemand,
          confidence: trend.confidence,
        });

      return {
        id: String(snapshot._id),
        zone: zone.zone,
        capacity: zone.capacity,
        available: zone.available,
        occupied: zone.occupied,
        utilization: zone.utilization,
        predictedAvailability,
        predictedDemand,
        trend: trend.direction,
        confidence: trend.confidence,
        samples: history.length,
      };
    }),
  );

  return {
    capturedAt: timestamp.toISOString(),
    zones: snapshots,
  };
}

export async function getDemandForecast() {
  await connectDb();

  const spaces = await Space.find({
    verificationStatus: "APPROVED",
    operationalStatus: "ACTIVE",
  })
    .lean()
    .exec();

  const zoneInputs = spaces.map((space) => ({
    zone:
      typeof space.zone === "string"
        ? space.zone
        : null,
    capacity:
      typeof space.capacity === "number"
        ? space.capacity
        : Number(space.capacity ?? 0),
    available:
      typeof space.available === "number"
        ? space.available
        : Number(space.available ?? 0),
  }));

  const zones = buildZones(zoneInputs);

  const forecastZones = [];

  for (const zone of zones) {
    const currentAvailable =
      zone.available;

    const currentUtilization =
      zone.capacity > 0
        ? Math.round(
            ((zone.capacity -
              currentAvailable) /
              zone.capacity) *
              100,
          )
        : 0;

    const snapshots =
      await DemandSnapshot.find({
        zone: zone.zone,
      })
        .sort({
          timestamp: -1,
        })
        .limit(6)
        .lean();

    const trendSnapshots =
      snapshots.map((snapshot) => ({
        available: Number(
          snapshot.available ?? 0,
        ),
        timestamp: new Date(
          snapshot.timestamp,
        ),
      }));

    const trend =
      calculateTrend(trendSnapshots);

    const predictedAvailability =
      Math.max(
        0,
        Math.min(
          zone.capacity,
          Math.round(
            currentAvailable +
              trend.changePerSnapshot,
          ),
        ),
      );

    const predictedUtilization =
      zone.capacity > 0
        ? Math.round(
            ((zone.capacity -
              predictedAvailability) /
              zone.capacity) *
              100,
          )
        : 0;

    let risk:
      | "LOW"
      | "MEDIUM"
      | "HIGH"
      | "CRITICAL";

    if (predictedUtilization >= 90) {
      risk = "CRITICAL";
    } else if (predictedUtilization >= 75) {
      risk = "HIGH";
    } else if (predictedUtilization >= 60) {
      risk = "MEDIUM";
    } else {
      risk = "LOW";
    }

    let recommendation =
      "No immediate intervention required.";

    if (risk === "CRITICAL") {
      recommendation =
        "Redirect incoming demand to nearby underutilized zones immediately.";
    } else if (risk === "HIGH") {
      recommendation =
        "Monitor this zone closely and begin directing demand toward nearby capacity.";
    } else if (risk === "MEDIUM") {
      recommendation =
        "Monitor demand growth and preserve nearby alternative capacity.";
    }

    forecastZones.push({
      zone: zone.zone,
      capacity: zone.capacity,
      currentAvailable,
      currentUtilization,
      predictedAvailability,
      predictedUtilization,
      trend: trend.direction,
      confidence: trend.confidence,
      risk,
      recommendation,
      samples: snapshots.length,
    });
  }

  forecastZones.sort(
    (a, b) =>
      b.predictedUtilization -
      a.predictedUtilization,
  );

  return {
    generatedAt:
      new Date().toISOString(),
    zones: forecastZones,
  };
}