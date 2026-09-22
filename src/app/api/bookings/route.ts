import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { connectDb } from "@/lib/db";
import { Reservation } from "@/lib/models";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (user.role !== "USER") {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    await connectDb();

    const reservations =
      await Reservation.find({
        userId: user.id,
      })
        .populate("spaceId")
        .sort({ startAt: -1 })
        .lean()
        .exec();

    return NextResponse.json({
      reservations: Array.isArray(reservations)
        ? reservations
        : [],
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "REQUEST_FAILED";

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}

