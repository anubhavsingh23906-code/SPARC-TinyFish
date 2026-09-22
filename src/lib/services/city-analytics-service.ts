import { connectDb } from "@/lib/db";
import {
  ActivityLog,
  CityIntervention,
  DemandSnapshot,
  Reservation,
  Space,
} from "@/lib/models";

export function calculateTerminalReservationMetrics(
  reservationCounts: Record<string, number>,
) {
  const completed =
    reservationCounts.CHECKED_OUT ?? 0;

  const cancelled =
    reservationCounts.CANCELLED ?? 0;

  const failed =
    reservationCounts.FAILED ?? 0;

  const terminalOutcomes =
    completed + cancelled + failed;

  const fulfillmentRate =
    terminalOutcomes > 0
      ? Math.round(
          (completed / terminalOutcomes) * 100,
        )
      : 0;

  return {
    completed,
    cancelled,
    failed,
    terminalOutcomes,
    fulfillmentRate,
  };
}

export async function getCityAnalytics() {
  await connectDb();

  const [
    spaces,
    reservationStats,
    interventionCount,
    demandSnapshotCount,
    activeInterventionCount,
    totalInterventionCount,
    operatorAlertCount,
  ] = await Promise.all([
    Space.find({
      verificationStatus: "APPROVED",
      operationalStatus: "ACTIVE",
    })
      .lean()
      .exec(),

    Reservation.aggregate([
      {
        $group: {
          _id: "$status",
          count: {
            $sum: 1,
          },
        },
      },
    ]),

    ActivityLog.countDocuments({
      action: {
        $in: [
          "CITY_REDIRECT_DEMAND",
          "CITY_CREATE_ZONE_ALERT",
          "CITY_MARK_INTERVENTION",
        ],
      },
    }),

    DemandSnapshot.countDocuments(),

    CityIntervention.countDocuments({
      status: {
        $in: ["ACTIVE", "ACKNOWLEDGED"],
      },
    }),

    CityIntervention.countDocuments(),

    CityIntervention.countDocuments({
      action: "CREATE_ZONE_ALERT",
    }),
  ]);

  // --------------------------------------------------
  // NETWORK METRICS
  // --------------------------------------------------

  let capacity = 0;
  let available = 0;

  const zones = new Set<string>();

  for (const space of spaces) {
    capacity += Number(
      space.capacity ?? 0,
    );

    available += Number(
      space.available ?? 0,
    );

    if (space.zone) {
      zones.add(space.zone);
    }
  }

  const occupied = Math.max(
    0,
    capacity - available,
  );

  const utilization =
    capacity > 0
      ? Math.round(
          (occupied / capacity) * 100,
        )
      : 0;

  // --------------------------------------------------
  // RESERVATION METRICS
  // --------------------------------------------------

  const reservationCounts: Record<
    string,
    number
  > = {};

  for (const stat of reservationStats) {
    reservationCounts[
      String(stat._id)
    ] = Number(stat.count);
  }

  const totalReservations =
    Object.values(
      reservationCounts,
    ).reduce(
      (sum, count) => sum + count,
      0,
    );

  const terminalMetrics =
    calculateTerminalReservationMetrics(
      reservationCounts,
    );

  // --------------------------------------------------
  // RETURN ANALYTICS
  // --------------------------------------------------

  return {
    generatedAt:
      new Date().toISOString(),

    network: {
      capacity,
      available,
      occupied,
      utilization,
      activeZones: zones.size,
      activeSpaces: spaces.length,
    },

    reservations: {
      total: totalReservations,
      completed: terminalMetrics.completed,
      cancelled: terminalMetrics.cancelled,
      failed: terminalMetrics.failed,
      terminalOutcomes:
        terminalMetrics.terminalOutcomes,
      reserved:
        reservationCounts.RESERVED ?? 0,
      checkedIn:
        reservationCounts.CHECKED_IN ?? 0,
      occupied:
        reservationCounts.OCCUPIED ?? 0,
      fulfillmentRate:
        terminalMetrics.fulfillmentRate,
    },

    operations: {
      interventions:
        interventionCount,
      activeInterventions:
        activeInterventionCount,
      totalInterventions:
        totalInterventionCount,
      operatorCreatedAlerts:
        operatorAlertCount,
    },

    intelligence: {
      demandSnapshots:
        demandSnapshotCount,
    },
  };
}