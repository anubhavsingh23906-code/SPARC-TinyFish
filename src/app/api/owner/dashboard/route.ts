import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import {
  getOwnerDashboard,
} from "@/lib/services/owner-dashboard-service";

export async function GET() {
  try {
    const actor = await getCurrentUser();

    const dashboard =
      await getOwnerDashboard(actor);

    return NextResponse.json({
      ok: true,
      dashboard,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OWNER_DASHBOARD_FAILED";

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
