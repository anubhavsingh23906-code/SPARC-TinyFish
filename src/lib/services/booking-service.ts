import {
  acquireBookingLease,
  releaseAvailability,
  releaseBookingLease,
  reserveAvailability,
} from "@/lib/services/availability-service";
import { randomUUID } from "node:crypto";
import {
  Space,
  Reservation,
  User,
  Payment,
  ActivityLog,
} from "@/lib/models";
import { connectDb } from "@/lib/db";
import {
  calculateCharge,
  hasReservationConflict,
} from "@/lib/domain/reservation";
import { reservationInput } from "@/lib/validation";
import { mockPaymentProvider } from "@/lib/services/payment-service";

export async function createReservation(
  actorId: string,
  raw: unknown,
) {
  const input = reservationInput.parse(raw);

  await connectDb();

  const user = await User.findById(actorId);

  if (!user || user.status !== "ACTIVE") {
    throw new Error("USER_NOT_ACTIVE");
  }

  if (user.role !== "USER") {
    throw new Error("FORBIDDEN");
  }

  const space = await Space.findOne({
    externalId: input.spaceId,
  });

  if (
    !space ||
    space.verificationStatus !== "APPROVED" ||
    space.operationalStatus !== "ACTIVE"
  ) {
    throw new Error("SPACE_NOT_BOOKABLE");
  }

  if (space.mode !== input.mode) {
    throw new Error("MODE_MISMATCH");
  }

  const hours =
    (input.endAt.getTime() - input.startAt.getTime()) /
    36e5;

  const totals = calculateCharge(
    space.pricing?.hourly ?? 0,
    hours,
  );

  /*
   * Hackathon payment simulation.
   * No real card/payment credentials are handled.
   */
  const paymentResult =
    await mockPaymentProvider.createPayment(
      totals.amount,
    );

  if (paymentResult.status !== "SUCCESS") {
    throw new Error("PAYMENT_FAILED");
  }

  const lockToken = randomUUID();
  const lease = await acquireBookingLease(
    space._id,
    lockToken,
  );

  if (!lease) {
    throw new Error("BOOKING_IN_PROGRESS");
  }

  let availabilityReserved = false;
  let reservation: any = null;

  try {
    const existing = await Reservation.find({
      spaceId: space._id,
      status: {
        $in: ["RESERVED", "CHECKED_IN", "OCCUPIED"],
      },
    });

    if (
      hasReservationConflict(
        existing,
        input.startAt,
        input.endAt,
      )
    ) {
      throw new Error("RESERVATION_CONFLICT");
    }

    await reserveAvailability(space._id);
    availabilityReserved = true;

    const reference =
      `SPARC-${Date.now().toString(36).toUpperCase()}`;

    reservation = await Reservation.create({
      userId: user._id,
      spaceId: space._id,
      startAt: input.startAt,
      endAt: input.endAt,
      status: "RESERVED",
      ...totals,
      reference,
      qrPayload: `sparc://check-in/${reference}`,
    });

    await Payment.create({
      userId: user._id,
      reservationId: reservation._id,
      amount: totals.amount,
      currency: "INR",
      type: "RESERVATION",
      status: "SUCCESS",
      providerReference: paymentResult.reference,
    });

    await ActivityLog.create({
      actorId: user._id,
      action: "RESERVATION_CREATED",
      entityType: "Reservation",
      entityId: reservation._id,
      metadata: {
        reference,
        externalSpaceId: input.spaceId,
        paymentReference: paymentResult.reference,
        amount: totals.amount,
        commission: totals.commission,
        ownerSettlement: totals.ownerSettlement,
      },
    });

    return reservation;
  } catch (error) {
    if (availabilityReserved) {
      if (reservation) {
        await Reservation.findByIdAndUpdate(
          reservation._id,
          { status: "FAILED" },
        ).catch(() => undefined);
      }

      await releaseAvailability(space._id).catch(() => undefined);
    }

    throw error;
  } finally {
    await releaseBookingLease(
      space._id,
      lockToken,
    ).catch(() => undefined);
  }
}

