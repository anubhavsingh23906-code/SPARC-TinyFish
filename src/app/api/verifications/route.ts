import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getVisibleVerifications } from "@/lib/services/trust-service";

export async function GET() {
  try {
    const actor = await getCurrentUser();

    const verifications = await getVisibleVerifications(actor);

    return NextResponse.json({
      ok: true,
      count: verifications.length,
      verifications,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "REQUEST_FAILED";

    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "SPACE_OWNER_NOT_FOUND"
          ? 404
          : 400;

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status },
    );
  }
}