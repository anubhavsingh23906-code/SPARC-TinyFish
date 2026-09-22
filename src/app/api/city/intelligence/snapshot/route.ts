import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/auth";
import {
  captureDemandSnapshot,
} from "@/lib/services/demand-intelligence-service";

export async function POST() {
  try {
    requireRole(await getCurrentUser(), "CITY_OPERATOR");

    const result =
      await captureDemandSnapshot();

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(
      "Demand snapshot error:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to capture demand snapshot",
      },
      {
        status:
          error instanceof Error &&
          error.message === "FORBIDDEN"
            ? 403
            : 500,
      },
    );
  }
}