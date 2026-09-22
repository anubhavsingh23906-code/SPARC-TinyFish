import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { transitionReservation } from "@/lib/services/reservation-lifecycle-service";

const input = z.object({
  status: z.enum([
    "CHECKED_IN",
    "OCCUPIED",
    "CHECKED_OUT",
    "CANCELLED",
  ]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    const body = input.parse(await request.json());

    const reservation = await transitionReservation(
      user.id,
      id,
      body.status
    );

    return NextResponse.json({ reservation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "REQUEST_FAILED";

    const status =
      message === "RESERVATION_NOT_FOUND"
        ? 404
        : message === "FORBIDDEN"
          ? 403
          : 400;

    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}

