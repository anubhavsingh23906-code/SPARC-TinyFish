import { describe, expect, it } from "vitest";
import { calculateTerminalReservationMetrics } from "@/lib/services/city-analytics-service";

describe("city analytics terminal outcomes", () => {
  it("calculates completion from checked out terminal outcomes", () => {
    expect(
      calculateTerminalReservationMetrics({
        CHECKED_OUT: 6,
        CANCELLED: 2,
        FAILED: 2,
        RESERVED: 4,
      }),
    ).toEqual({
      completed: 6,
      cancelled: 2,
      failed: 2,
      terminalOutcomes: 10,
      fulfillmentRate: 60,
    });
  });

  it("returns zero without implying a rate when no outcomes are terminal", () => {
    expect(
      calculateTerminalReservationMetrics({
        RESERVED: 3,
        CHECKED_IN: 1,
        OCCUPIED: 1,
      }),
    ).toEqual({
      completed: 0,
      cancelled: 0,
      failed: 0,
      terminalOutcomes: 0,
      fulfillmentRate: 0,
    });
  });
});
