import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import {
  createOwnerSpace,
  getOwnerSpaces,
} from "@/lib/services/owner-space-service";

const inputSchema = z.object({
  title: z.string().min(2),
  address: z.string().min(3),
  zone: z.string().default(""),
  mode: z.enum([
    "PARKING",
    "LOADING",
    "PICKUP",
    "EV",
    "ACCESSIBILITY",
  ]),
  capacity: z.number().int().positive(),
  hourly: z.number().nonnegative(),
  daily: z.number().nonnegative(),
  monthly: z.number().nonnegative().optional(),
  amenities: z.array(z.string()).default([]),
  restrictions: z.array(z.string()).default([]),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export async function GET() {
  try {
    const actor = await getCurrentUser();
    const spaces = await getOwnerSpaces(actor);

    return NextResponse.json({
      ok: true,
      spaces,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "OWNER_SPACES_LOAD_FAILED";

    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "SPACE_OWNER_NOT_FOUND"
          ? 404
          : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getCurrentUser();
    const body = inputSchema.parse(await request.json());

    const result = await createOwnerSpace(actor, body);

    return NextResponse.json(
      {
        ok: true,
        message: "SPACE_SUBMITTED_FOR_VERIFICATION",
        space: result.space,
        verification: result.verification,
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "SPACE_CREATE_FAILED";

    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "SPACE_OWNER_NOT_FOUND"
          ? 404
          : 400;

    return NextResponse.json(
      { error: message },
      { status },
    );
  }
}
