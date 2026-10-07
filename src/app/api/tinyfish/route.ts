import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const TINYFISH_URL = "https://agent.tinyfish.ai/v1/automation/run";

const inputSchema = z.object({
  url: z.string().trim().min(1).max(2048),
  goal: z.string().trim().min(1).max(5000),
});

function getErrorMessage(data: unknown) {
  if (data && typeof data === "object") {
    if ("error" in data && typeof data.error === "string") {
      return data.error;
    }
    if ("message" in data && typeof data.message === "string") {
      return data.message;
    }
  }

  return "TinyFish could not complete the request.";
}

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 },
    );
  }

  const parsed = inputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A valid url and goal are required." },
      { status: 400 },
    );
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(parsed.data.url);
  } catch {
    return NextResponse.json(
      { error: "Enter a valid website URL." },
      { status: 400 },
    );
  }

  if (
    (targetUrl.protocol !== "http:" && targetUrl.protocol !== "https:") ||
    !targetUrl.hostname
  ) {
    return NextResponse.json(
      { error: "URL must use the HTTP or HTTPS protocol." },
      { status: 400 },
    );
  }

  const apiKey = process.env.TINYFISH_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TinyFish is not configured on the server." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(TINYFISH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({
        url: targetUrl.toString(),
        goal: parsed.data.goal,
      }),
    });

    const responseText = await response.text();
    let data: unknown = responseText;
    if (responseText) {
      try {
        data = JSON.parse(responseText);
      } catch {
        console.warn("TinyFish returned a non-JSON response.");
      }
    }

    if (!response.ok) {
      console.error("TinyFish request failed with status:", response.status);
      return NextResponse.json(
        {
          error: getErrorMessage(data),
          upstreamStatus: response.status,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("TinyFish error:", error);

    return NextResponse.json(
      { error: "Unable to reach TinyFish. Please try again." },
      { status: 502 },
    );
  }
}