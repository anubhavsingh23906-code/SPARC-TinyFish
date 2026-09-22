import { NextResponse } from "next/server";
import { z } from "zod";
import { setDemoSession } from "@/lib/auth";

const input = z.object({
  accountId: z.enum([
    "demo-user-1",
    "demo-owner-1",
    "demo-city-1",
    "demo-admin-1",
  ]),
});

export async function POST(request: Request) {
  try {
    const body = input.parse(await request.json());

    await setDemoSession(body.accountId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "REQUEST_FAILED";

    return NextResponse.json(
      { error: message },
      { status: message === "INVALID_DEMO_ACCOUNT" ? 400 : 500 },
    );
  }
}

