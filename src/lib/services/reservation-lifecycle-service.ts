import { releaseAvailability } from "@/lib/services/availability-service";
import { connectDb } from "@/lib/db";
import {
  ActivityLog,
  Reservation,
  Space,
  SpaceOwner,
  User,
} from "@/lib/models";
import {
  canTransition,
  shouldRollbackAfterAvailabilityFailure,
  shouldReleaseAvailability,
} from "@/lib/domain/reservation";
import { ReservationStatus } from "@/lib/types";

export async function transitionReservation(
  actorId: string,
  reservationId: string,
  to: ReservationStatus,
) {
  await connectDb();

  const reservation =
    await Reservation.findById(reservationId);

  if (!reservation) {
    throw new Error("RESERVATION_NOT_FOUND");
  }

  const user = await User.findById(actorId);

  if (!user || user.status !== "ACTIVE") {
    throw new Error("USER_NOT_ACTIVE");
  }

  const space =
    await Space.findById(reservation.spaceId);

  if (!space) {
    throw new Error("SPACE_NOT_FOUND");
  }

  const isCustomer =
    String(reservation.userId) === String(user._id);

  const owner =
    await SpaceOwner.findById(space.ownerId);

  const isOwner =
    Boolean(owner) &&
    String(owner?.userId) === String(user._id);

  const isAdmin =
    user.role === "ADMIN";

  if (!isCustomer && !isOwner && !isAdmin) {
    throw new Error("FORBIDDEN");
  }

  if (!canTransition(reservation.status, to)) {
    throw new Error(
      "INVALID_RESERVATION_TRANSITION",
    );
  }

  /*
   * Demo lifecycle permissions:
   *
   * USER:
   *   RESERVED -> CHECKED_IN
   *   CHECKED_IN -> OCCUPIED
   *   OCCUPIED -> CHECKED_OUT
   *
   * OWNER / ADMIN:
   *   may perform operational transitions.
   *
   * This keeps the hackathon simulation executable from
   * the customer reservation pass while still enforcing
   * ownership on the backend.
   */

  if (user.role === "USER") {
    if (
      to === "CHECKED_IN" &&
      reservation.status !== "RESERVED"
    ) {
      throw new Error("FORBIDDEN");
    }

    if (
      to === "OCCUPIED" &&
      reservation.status !== "CHECKED_IN"
    ) {
      throw new Error("FORBIDDEN");
    }

    if (
      to === "CHECKED_OUT" &&
      reservation.status !== "OCCUPIED"
    ) {
      throw new Error("FORBIDDEN");
    }
  }

  const previousStatus = reservation.status;
  const previousCheckOutAt = reservation.checkOutAt;

  reservation.status = to;

  if (to === "CHECKED_IN") {
    reservation.checkInAt = new Date();
  }

  if (to === "CHECKED_OUT") {
    reservation.checkOutAt = new Date();
  }

  await reservation.save();

  if (shouldReleaseAvailability(previousStatus, to)) {
    try {
      await releaseAvailability(reservation.spaceId);
    } catch (error) {
      if (
        shouldRollbackAfterAvailabilityFailure(
          previousStatus,
          to,
        )
      ) {
        reservation.status = previousStatus;
        reservation.checkOutAt = previousCheckOutAt;
        await reservation.save().catch(() => undefined);
      }

      throw error;
    }
  }

  await ActivityLog.create({
    actorId: user._id,
    action: `RESERVATION_${to}`,
    entityType: "Reservation",
    entityId: reservation._id,
    metadata: {
      role: user.role,
      spaceId: String(space._id),
    },
  });

  return reservation;
}

