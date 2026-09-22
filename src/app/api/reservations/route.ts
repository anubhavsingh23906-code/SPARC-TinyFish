import { NextResponse } from "next/server"; import { getCurrentUser } from "@/lib/auth"; import { createReservation } from "@/lib/services/booking-service";
export async function POST(request:Request) { try {const user=await getCurrentUser(); const reservation=await createReservation(user.id,await request.json());return NextResponse.json({reservation},{status:201});}catch(error){const message=error instanceof Error?error.message:"REQUEST_FAILED";return NextResponse.json({error:message},{status:message==="FORBIDDEN"?403:400});} }

