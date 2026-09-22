import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAdminAuditEvents } from "@/lib/services/audit-service";

export async function GET() {
  try {
    const events = await getAdminAuditEvents(
      await getCurrentUser(),
    );

    return NextResponse.json({
      ok: true,
      events,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "AUDIT_LOAD_FAILED";

    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      {
        status: message === "FORBIDDEN" ? 403 : 400,
      },
    );
  }
}
