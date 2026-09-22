import { PlatformConfig, ReservationStatus, SpaceSummary, isUpcomingStatus } from "@/lib/types";
import { canBookSpace } from "@/lib/domain/trust";

export const DEFAULT_CONFIG: PlatformConfig = {
  commissionRate:.08,
  starFeeDiscount:.15,
  alternativePriceTolerance:.12,
  starBenefits:["Priority booking","15% platform-fee reduction","Faster rebooking"],
};

export function calculateCharge(hourlyRate:number, hours:number, config=DEFAULT_CONFIG, isStar=false) {
  const amount=Math.round(hourlyRate*hours);
  const commission=Math.round(amount*config.commissionRate*(isStar ? 1-config.starFeeDiscount : 1));
  return {amount,commission,ownerSettlement:amount-commission};
}

export function hasReservationConflict(
  existing:{startAt:Date;endAt:Date;status:ReservationStatus}[],
  startAt:Date,
  endAt:Date,
) {
  return existing.some(r=>isUpcomingStatus(r.status) && r.startAt<endAt && r.endAt>startAt);
}

const allowed:Record<ReservationStatus,ReservationStatus[]>={
  RESERVED:["CHECKED_IN","CANCELLED","FAILED"],
  CHECKED_IN:["OCCUPIED","FAILED"],
  OCCUPIED:["CHECKED_OUT"],
  CHECKED_OUT:[],
  CANCELLED:[],
  FAILED:[],
};

export function canTransition(from:ReservationStatus,to:ReservationStatus) {
  return allowed[from].includes(to);
}

export function shouldReleaseAvailability(
  from: ReservationStatus,
  to: ReservationStatus,
) {
  return (
    to === "CHECKED_OUT" ||
    (to === "CANCELLED" && from === "RESERVED") ||
    (to === "FAILED" &&
      (from === "RESERVED" ||
        from === "CHECKED_IN"))
  );
}

export function shouldRollbackAfterAvailabilityFailure(
  from: ReservationStatus,
  to: ReservationStatus,
) {
  return (
    (from === "OCCUPIED" && to === "CHECKED_OUT") ||
    (from === "RESERVED" && to === "CANCELLED")
  );
}

export function nextLifecycleStatus(from:ReservationStatus):ReservationStatus|null {
  if(from==="RESERVED") return "CHECKED_IN";
  if(from==="CHECKED_IN") return "OCCUPIED";
  if(from==="OCCUPIED") return "CHECKED_OUT";
  return null;
}

export function demoSlot(hours:number, startAt=new Date("2026-09-20T18:30:00+05:30")) {
  return {startAt, endAt:new Date(startAt.getTime()+hours*36e5)};
}

export type DemoBookingInput = {
  space:SpaceSummary;
  hours:number;
  existing:{spaceId:string;status:ReservationStatus;startAt?:string;endAt?:string;hours:number}[];
  startAt?:Date;
};

export function evaluateDemoBooking(input:DemoBookingInput) {
  const bookable=canBookSpace(input.space);
  if(!bookable.ok) return bookable;
  const window=demoSlot(input.hours, input.startAt);
  const overlapping=input.existing
    .filter(r=>r.spaceId===input.space.id)
    .map(r=>{
      const start=r.startAt?new Date(r.startAt):window.startAt;
      const end=r.endAt?new Date(r.endAt):new Date(start.getTime()+r.hours*36e5);
      return {startAt:start,endAt:end,status:r.status};
    });
  if(hasReservationConflict(overlapping, window.startAt, window.endAt)) {
    return {ok:false as const, reason:"RESERVATION_CONFLICT"};
  }
  return {ok:true as const, ...window};
}

