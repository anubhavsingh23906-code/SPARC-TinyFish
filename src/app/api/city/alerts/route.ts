import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { getCityAlerts } from "@/lib/services/city-alert-service";

export async function GET() {
  try {
    const actor = await getCurrentUser();
    requireRole(actor, "CITY_OPERATOR");

    const result =
      await getCityAlerts(actor);

    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "City alerts error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load city alerts";

    const status =
      message === "FORBIDDEN"
        ? 403
        : 500;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status,
      },
    );
  }
}