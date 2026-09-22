import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  connectDb: vi.fn(),
  releaseAvailability: vi.fn(),
  reservationFindById: vi.fn(),
  userFindById: vi.fn(),
  spaceFindById: vi.fn(),
  ownerFindById: vi.fn(),
  activityCreate: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  connectDb: mocks.connectDb,
}));

vi.mock("@/lib/services/availability-service", () => ({
  releaseAvailability: mocks.releaseAvailability,
}));

vi.mock("@/lib/models", () => ({
  Reservation: {
    findById: mocks.reservationFindById,
  },
  User: {
    findById: mocks.userFindById,
  },
  Space: {
    findById: mocks.spaceFindById,
  },
  SpaceOwner: {
    findById: mocks.ownerFindById,
  },
  ActivityLog: {
    create: mocks.activityCreate,
  },
}));

import { transitionReservation } from "@/lib/services/reservation-lifecycle-service";

function setupReservation(status: string) {
  const reservation = {
    _id: "reservation-1",
    userId: "user-1",
    spaceId: "space-1",
    status,
    checkOutAt: undefined,
    save: vi.fn().mockResolvedValue(undefined),
  };

  mocks.reservationFindById.mockResolvedValue(reservation);
  mocks.userFindById.mockResolvedValue({
    _id: "user-1",
    role: "USER",
    status: "ACTIVE",
  });
  mocks.spaceFindById.mockResolvedValue({
    _id: "space-1",
    ownerId: "owner-1",
  });
  mocks.ownerFindById.mockResolvedValue(null);
  mocks.activityCreate.mockResolvedValue({});

  return reservation;
}

describe("reservation availability failure consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("keeps checkout occupied after event failure and retries successfully", async () => {
    const reservation = setupReservation("OCCUPIED");
    const eventError = new Error("EVENT_WRITE_FAILED");
    mocks.releaseAvailability
      .mockRejectedValueOnce(eventError)
      .mockResolvedValueOnce({});

    await expect(
      transitionReservation(
        "user-1",
        "reservation-1",
        "CHECKED_OUT",
      ),
    ).rejects.toBe(eventError);

    expect(reservation.status).toBe("OCCUPIED");
    expect(reservation.checkOutAt).toBeUndefined();

    const result = await transitionReservation(
      "user-1",
      "reservation-1",
      "CHECKED_OUT",
    );

    expect(result.status).toBe("CHECKED_OUT");
    expect(mocks.releaseAvailability).toHaveBeenCalledTimes(2);
  });

  it("keeps cancellation reserved after event failure and retries successfully", async () => {
    const reservation = setupReservation("RESERVED");
    const eventError = new Error("EVENT_WRITE_FAILED");
    mocks.releaseAvailability
      .mockRejectedValueOnce(eventError)
      .mockResolvedValueOnce({});

    await expect(
      transitionReservation(
        "user-1",
        "reservation-1",
        "CANCELLED",
      ),
    ).rejects.toBe(eventError);

    expect(reservation.status).toBe("RESERVED");

    const result = await transitionReservation(
      "user-1",
      "reservation-1",
      "CANCELLED",
    );

    expect(result.status).toBe("CANCELLED");
    expect(mocks.releaseAvailability).toHaveBeenCalledTimes(2);
  });
});
