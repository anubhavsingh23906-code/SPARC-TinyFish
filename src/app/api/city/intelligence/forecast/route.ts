import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/auth";
import {
  getDemandForecast,
} from "@/lib/services/demand-intelligence-service";

export async function GET() {
  try {
    requireRole(await getCurrentUser(), "CITY_OPERATOR");

    const forecast =
      await getDemandForecast();

    return NextResponse.json({
      ok: true,
      forecast,
    });
  } catch (error) {
    console.error(
      "Demand forecast error:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load demand forecast",
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