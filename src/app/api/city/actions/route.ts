import { NextResponse } from "next/server";
import {
  executeCityAction,
  CityAction,
} from "@/lib/services/city-action-service";
import { getCurrentUser, requireRole } from "@/lib/auth";

const VALID_ACTIONS: CityAction[] = [
  "REDIRECT_DEMAND",
  "CREATE_ZONE_ALERT",
  "MARK_INTERVENTION",
];

export async function POST(
  request: Request,
) {
  try {
    const actor = await getCurrentUser();
    requireRole(actor, "CITY_OPERATOR");

    const body = await request.json();

    const zone =
      typeof body?.zone === "string"
        ? body.zone
        : "";

    const rawAction =
      typeof body?.action === "string"
        ? body.action
        : "";

    if (!VALID_ACTIONS.includes(
      rawAction as CityAction,
    )) {
      return NextResponse.json(
        {
          ok: false,
          error: "INVALID_CITY_ACTION",
        },
        {
          status: 400,
        },
      );
    }

    const action = rawAction as CityAction;

    const result =
      await executeCityAction(actor, {
        zone,
        action,
      });

    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    console.error(
      "City action error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to execute city action";

    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "ZONE_NOT_FOUND"
          ? 404
          : 400;

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