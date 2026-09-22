import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { getCityIntelligence } from "@/lib/services/city-intelligence-service";

export async function GET() {
  try {
    requireRole(await getCurrentUser(), "CITY_OPERATOR");

    const intelligence =
      await getCityIntelligence();

    return NextResponse.json({
      ok: true,
      intelligence,
    });
  } catch (error) {
    console.error(
      "City intelligence error:",
      error,
    );

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unable to load city intelligence",
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