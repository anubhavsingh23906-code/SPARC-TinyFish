import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const mocks = vi.hoisted(() => ({
  connectDb: vi.fn(),
  findOneAndUpdate: vi.fn(),
  createEvent: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  connectDb: mocks.connectDb,
}));

vi.mock("@/lib/models", () => ({
  Space: {
    findOneAndUpdate: mocks.findOneAndUpdate,
  },
  AvailabilityEvent: {
    create: mocks.createEvent,
  },
}));

import {
  releaseAvailability,
  reserveAvailability,
} from "@/lib/services/availability-service";

describe("availability event consistency", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decrements availability and records a reservation event", async () => {
    const timestamp = new Date("2026-09-22T10:00:00.000Z");
    const updatedSpace = {
      _id: "space-a",
      available: 4,
      capacity: 5,
      lastUpdatedAt: timestamp,
    };

    mocks.findOneAndUpdate.mockResolvedValueOnce(updatedSpace);
    mocks.createEvent.mockResolvedValueOnce({});

    const result = await reserveAvailability("space-a");

    expect(result).toBe(updatedSpace);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(mocks.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it("compensates a decrement when the reservation event fails", async () => {
    const timestamp = new Date("2026-09-22T10:00:00.000Z");
    const updatedSpace = {
      _id: "space-a",
      available: 4,
      capacity: 5,
      lastUpdatedAt: timestamp,
    };
    const eventError = new Error("EVENT_WRITE_FAILED");

    mocks.findOneAndUpdate
      .mockResolvedValueOnce(updatedSpace)
      .mockResolvedValueOnce(updatedSpace);
    mocks.createEvent.mockRejectedValueOnce(eventError);

    await expect(
      reserveAvailability("space-a"),
    ).rejects.toBe(eventError);

    expect(mocks.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.findOneAndUpdate.mock.calls[1][0]).toMatchObject({
      _id: "space-a",
      available: 4,
      lastUpdatedAt: timestamp,
    });
    expect(mocks.findOneAndUpdate.mock.calls[1][1]).toMatchObject({
      $inc: { available: 1 },
    });
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
  });

  it("increments availability and records a release event", async () => {
    const timestamp = new Date("2026-09-22T10:00:00.000Z");
    const updatedSpace = {
      _id: "space-a",
      available: 5,
      capacity: 5,
      lastUpdatedAt: timestamp,
    };

    mocks.findOneAndUpdate.mockResolvedValueOnce(updatedSpace);
    mocks.createEvent.mockResolvedValueOnce({});

    const result = await releaseAvailability("space-a");

    expect(result).toBe(updatedSpace);
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
    expect(mocks.findOneAndUpdate).toHaveBeenCalledTimes(1);
  });

  it("compensates an increment when the release event fails", async () => {
    const timestamp = new Date("2026-09-22T10:00:00.000Z");
    const updatedSpace = {
      _id: "space-a",
      available: 5,
      capacity: 5,
      lastUpdatedAt: timestamp,
    };
    const eventError = new Error("EVENT_WRITE_FAILED");

    mocks.findOneAndUpdate
      .mockResolvedValueOnce(updatedSpace)
      .mockResolvedValueOnce(updatedSpace);
    mocks.createEvent.mockRejectedValueOnce(eventError);

    await expect(
      releaseAvailability("space-a"),
    ).rejects.toBe(eventError);

    expect(mocks.findOneAndUpdate).toHaveBeenCalledTimes(2);
    expect(mocks.findOneAndUpdate.mock.calls[1][0]).toMatchObject({
      _id: "space-a",
      available: 5,
      lastUpdatedAt: timestamp,
    });
    expect(mocks.findOneAndUpdate.mock.calls[1][1]).toMatchObject({
      $inc: { available: -1 },
    });
    expect(mocks.createEvent).toHaveBeenCalledTimes(1);
  });
});
