import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { getCityAnalytics } from "@/lib/services/city-analytics-service";

export async function GET() {
  try {
    requireRole(await getCurrentUser(), "CITY_OPERATOR");

    const analytics =
      await getCityAnalytics();

    return NextResponse.json({
      ok: true,
      analytics,
    });
  } catch (error) {
    console.error(
      "City analytics error:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load city analytics",
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