import { connectDb } from "@/lib/db";
import { Reservation, Space, SpaceOwner } from "@/lib/models";
import { requireRole, type SessionUser } from "@/lib/auth";

type DashboardReservation = {
  status: string;
  amount: number;
  commission: number;
  ownerSettlement: number;
  startAt: Date;
  endAt: Date;
};

export function calculateOwnerLifecycleProgress(
  reservationCount: number,
  fulfilledCount: number,
) {
  return reservationCount > 0
    ? Math.round(
        (fulfilledCount / reservationCount) * 100,
      )
    : null;
}

export async function getOwnerDashboard(actor: SessionUser) {
  requireRole(actor, "OWNER");
  await connectDb();

  const owner = (await SpaceOwner.findOne({
    userId: actor.id,
  }).lean()) as { _id: unknown; reliabilityScore?: number } | null;

  if (!owner) {
    throw new Error("SPACE_OWNER_NOT_FOUND");
  }

  const ownerId = String(owner._id);

  const spaces = await Space.find({
    ownerId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const spaceIds = spaces.map((space) => space._id);

  const reservations = await Reservation.find({
    spaceId: { $in: spaceIds },
  })
    .sort({ createdAt: -1 })
    .lean();

  const today = new Date();

  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const startOfTomorrow = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() + 1,
  );

  const reservationRows = reservations as unknown as DashboardReservation[];

  const todayReservations = reservationRows.filter((reservation) => {
    const startAt = new Date(reservation.startAt);

    return startAt >= startOfToday && startAt < startOfTomorrow;
  });

  const validRevenueReservations = reservationRows.filter(
    (reservation) =>
      reservation.status !== "FAILED" &&
      reservation.status !== "CANCELLED",
  );

  const grossRevenue = validRevenueReservations.reduce(
    (total, reservation) =>
      total + Number(reservation.amount ?? 0),
    0,
  );

  const commission = validRevenueReservations.reduce(
    (total, reservation) =>
      total + Number(reservation.commission ?? 0),
    0,
  );

  const netSettlement = validRevenueReservations.reduce(
    (total, reservation) =>
      total + Number(reservation.ownerSettlement ?? 0),
    0,
  );

  const completedReservations = reservationRows.filter(
    (reservation) => reservation.status === "CHECKED_OUT",
  ).length;

  const fulfilledReservations = reservationRows.filter(
    (reservation) =>
      reservation.status === "CHECKED_IN" ||
      reservation.status === "OCCUPIED" ||
      reservation.status === "CHECKED_OUT",
  ).length;

  const reliability = Number(owner.reliabilityScore ?? 70);

  const totalCapacity = spaces.reduce(
    (total, space) =>
      total + Number(space.capacity ?? 0),
    0,
  );

  const totalAvailable = spaces.reduce(
    (total, space) =>
      total + Number(space.available ?? 0),
    0,
  );

  const occupied = Math.max(
    0,
    totalCapacity - totalAvailable,
  );

  const utilization =
    totalCapacity > 0
      ? Math.round((occupied / totalCapacity) * 100)
      : 0;

  const fulfillmentRate =
    calculateOwnerLifecycleProgress(
      reservationRows.length,
      fulfilledReservations,
    );

  const activeSpaces = spaces.filter(
    (space) =>
      space.verificationStatus === "APPROVED" &&
      space.operationalStatus === "ACTIVE",
  ).length;

  const pendingSpaces = spaces.filter(
    (space) => space.verificationStatus === "PENDING",
  ).length;

  const spaceRows = spaces.map((space) => ({
    id: String(space.externalId ?? space._id),
    name: String(space.title ?? "Untitled space"),
    status: String(space.verificationStatus ?? "PENDING"),
    operationalStatus: String(
      space.operationalStatus ?? "INACTIVE",
    ),
    capacity: Number(space.capacity ?? 0),
    available: Number(space.available ?? 0),
    reliability: Number(
      space.reliabilityScore ??
        owner.reliabilityScore ??
        70,
    ),
    lastUpdatedAt:
      space.lastUpdatedAt ??
      space.updatedAt ??
      null,
  }));

  const recentReservations = reservations
    .slice(0, 5)
    .map((reservation) => ({
      id: String(reservation._id),
      reference: String(
        reservation.reference ?? reservation._id,
      ),
      status: String(reservation.status),
      amount: Number(reservation.amount ?? 0),
      ownerSettlement: Number(
        reservation.ownerSettlement ?? 0,
      ),
      startAt: reservation.startAt,
      endAt: reservation.endAt,
      spaceId: String(reservation.spaceId),
    }));

  return {
    metrics: {
      todayReservations: todayReservations.length,
      grossRevenue,
      commission,
      netSettlement,
      reliability,
      utilization,
      fulfillmentRate,
      totalReservations: reservationRows.length,
      completedReservations,
      activeSpaces,
      pendingSpaces,
    },

    spaces: spaceRows,

    recentReservations,
  };
}