import { randomUUID } from "node:crypto";
import { connectDb } from "@/lib/db";
import { AvailabilityEvent, Space } from "@/lib/models";

export const BOOKING_LEASE_MS = 15_000;

export async function acquireBookingLease(
  spaceId: unknown,
  token = randomUUID(),
  leaseMs = BOOKING_LEASE_MS,
) {
  await connectDb();

  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + leaseMs,
  );

  const space = await Space.findOneAndUpdate(
    {
      _id: spaceId,
      $or: [
        {
          bookingLockToken: {
            $exists: false,
          },
        },
        {
          bookingLockToken: null,
        },
        {
          bookingLockExpiresAt: {
            $lte: now,
          },
        },
      ],
    },
    {
      $set: {
        bookingLockToken: token,
        bookingLockExpiresAt: expiresAt,
      },
    },
    {
      new: true,
    },
  );

  return space ? { token, space, expiresAt } : null;
}

export async function releaseBookingLease(
  spaceId: unknown,
  token: string,
) {
  await connectDb();

  return Space.findOneAndUpdate(
    {
      _id: spaceId,
      bookingLockToken: token,
    },
    {
      $unset: {
        bookingLockToken: 1,
        bookingLockExpiresAt: 1,
      },
    },
    {
      new: true,
    },
  );
}

export async function reserveAvailability(spaceId: unknown) {
  await connectDb();

  const mutationTimestamp = new Date();

  const space = await Space.findOneAndUpdate(
    {
      _id: spaceId,
      available: { $gt: 0 },
    },
    {
      $inc: { available: -1 },
      $set: { lastUpdatedAt: mutationTimestamp },
    },
    {
      new: true,
    },
  );

  if (!space) {
    throw new Error("SPACE_FULL");
  }

  try {
    await AvailabilityEvent.create({
      spaceId: space._id,
      status: space.available > 0 ? "AVAILABLE" : "FULL",
      source: "BOOKING_DERIVED",
      timestamp: new Date(),
    });
  } catch (error) {
    await compensateAvailabilityMutation(
      space,
      1,
    );
    throw error;
  }

  return space;
}

export async function releaseAvailability(spaceId: unknown) {
  await connectDb();

  const mutationTimestamp = new Date();

  const space = await Space.findOneAndUpdate(
    {
      _id: spaceId,
      $expr: {
        $lt: ["$available", "$capacity"],
      },
    },
    {
      $inc: { available: 1 },
      $set: { lastUpdatedAt: mutationTimestamp },
    },
    {
      new: true,
    },
  );

  if (!space) {
    throw new Error("SPACE_CAPACITY_ALREADY_RESTORED");
  }

  try {
    await AvailabilityEvent.create({
      spaceId: space._id,
      status: "AVAILABLE",
      source: "BOOKING_DERIVED",
      timestamp: new Date(),
    });
  } catch (error) {
    await compensateAvailabilityMutation(
      space,
      -1,
    );
    throw error;
  }

  return space;
}

async function compensateAvailabilityMutation(
  space: {
    _id: unknown;
    available?: number | null;
    lastUpdatedAt?: Date | null;
  },
  amount: number,
) {
  try {
    await Space.findOneAndUpdate(
      {
        _id: space._id,
        available: space.available,
        lastUpdatedAt: space.lastUpdatedAt,
      },
      {
        $inc: { available: amount },
        $set: { lastUpdatedAt: new Date() },
      },
      {
        new: true,
      },
    );
  } catch {
    // Preserve the original availability-event failure for the caller.
  }
}