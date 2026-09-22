import { z } from "zod";
export const reservationInput = z.object({ spaceId:z.string().min(1), startAt:z.coerce.date(), endAt:z.coerce.date(), mode:z.enum(["PARKING","LOADING","PICKUP","EV","ACCESSIBILITY"]), requiresCharging:z.boolean().default(false) }).refine(v=>v.endAt>v.startAt,{message:"End time must follow start time",path:["endAt"]});
export const spaceInput = z.object({ title:z.string().min(3).max(120), mode:z.enum(["PARKING","LOADING","PICKUP","EV","ACCESSIBILITY"]), capacity:z.number().int().positive(), hourlyRate:z.number().positive(), zone:z.string().min(2) });

