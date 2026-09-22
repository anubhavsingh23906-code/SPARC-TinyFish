import { NextResponse } from "next/server";
import { getMarketplaceSpaces } from "@/lib/services/space-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get("mode") ?? undefined;

    const spaces = await getMarketplaceSpaces(mode);

    return NextResponse.json({
      ok: true,
      count: spaces.length,
      spaces,
    });
  } catch (error) {
    console.error("GET /api/spaces failed:", error);

    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "SPACES_FETCH_FAILED",
      },
      { status: 500 },
    );
  }
}

