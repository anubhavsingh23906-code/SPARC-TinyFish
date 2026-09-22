import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { reviewVerification } from "@/lib/services/trust-service";

const input = z.object({
  decision: z.enum([
    "APPROVED",
    "REJECTED",
    "CHANGES_REQUESTED",
  ]),

  reviewNote: z
    .string()
    .max(500)
    .optional()
    .default(""),
});

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const actor = await getCurrentUser();

    const { id } = await params;

    const body = input.parse(await request.json());

    const verification = await reviewVerification(
      actor,
      id,
      body.decision,
      body.reviewNote,
    );

    return NextResponse.json({
      ok: true,
      verification,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "REQUEST_FAILED";

    const status =
      message === "FORBIDDEN"
        ? 403
        : message === "VERIFICATION_NOT_FOUND"
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