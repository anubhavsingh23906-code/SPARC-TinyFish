import { describe, expect, it } from "vitest";
import { requireRole, type SessionUser } from "@/lib/auth";
import { calculateOwnerLifecycleProgress } from "@/lib/services/owner-dashboard-service";

const owner: SessionUser = {
  id: "owner-id",
  role: "OWNER",
  email: "owner@sparc.demo",
  name: "Demo Owner",
};

const user: SessionUser = {
  id: "user-id",
  role: "USER",
  email: "user@sparc.demo",
  name: "Demo User",
};

describe("owner dashboard access", () => {
  it("allows the authenticated owner role", () => {
    expect(requireRole(owner, "OWNER")).toBe(owner);
  });

  it("rejects non-owner roles", () => {
    expect(() => requireRole(user, "OWNER")).toThrow(
      "FORBIDDEN",
    );
  });

  it("does not present empty owner data as full lifecycle progress", () => {
    expect(calculateOwnerLifecycleProgress(0, 0)).toBeNull();
  });

  it("preserves lifecycle progress for reservations", () => {
    expect(calculateOwnerLifecycleProgress(5, 3)).toBe(60);
  });
});
