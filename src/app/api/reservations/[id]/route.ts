import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { Reservation } from "@/lib/models";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { id } = await params;

    await connectDb();

    const reservation = await Reservation.findById(id)
      .populate("spaceId")
      .lean()
      .exec();

    if (!reservation || Array.isArray(reservation)) {
      return NextResponse.json(
        { error: "RESERVATION_NOT_FOUND" },
        { status: 404 }
      );
    }

    if (String(reservation.userId) !== user.id) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 }
      );
    }

    return NextResponse.json({ reservation });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "REQUEST_FAILED";

    return NextResponse.json(
      { error: message },
      { status: message === "FORBIDDEN" ? 403 : 400 }
    );
  }
}

