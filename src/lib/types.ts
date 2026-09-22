export const ROLES = ["USER","OWNER","CITY_OPERATOR","ADMIN"] as const;
export type Role = typeof ROLES[number];
export const MODES = ["PARKING","LOADING","PICKUP","EV","ACCESSIBILITY"] as const;
export type SpaceMode = typeof MODES[number];
export const MODE_LABELS: Record<SpaceMode,string> = {
  PARKING:"Parking",
  LOADING:"Loading & Delivery",
  PICKUP:"Pickup & Drop-off",
  EV:"EV",
  ACCESSIBILITY:"Accessibility",
};
export type ReservationStatus = "RESERVED"|"CHECKED_IN"|"OCCUPIED"|"CHECKED_OUT"|"CANCELLED"|"FAILED";
export const UPCOMING_STATUSES: ReservationStatus[] = ["RESERVED","CHECKED_IN","OCCUPIED"];
export const HISTORY_STATUSES: ReservationStatus[] = ["CHECKED_OUT","CANCELLED","FAILED"];
export type VerificationStatus = "APPROVED"|"PENDING"|"REJECTED"|"CHANGES_REQUESTED";
export type OperationalStatus = "ACTIVE"|"INACTIVE";
export interface SpaceSummary {
  id:string;
  title:string;
  zone:string;
  mode:SpaceMode;
  price:number;
  distanceKm:number;
  available:number;
  reliability:number;
  freshness:"LIVE"|"RECENT"|"STALE";
  forecast:number;
  verified:boolean;
  amenities:string[];
  capacity?:number;
  monthlyPrice?:number;
  covered?:boolean;
  accessible?:boolean;
  ev?:boolean;
  coordinates?:{lat:number;lng:number};
  owner?:string;
  vehicleTypes?:Array<"CAR"|"VAN"|"LCV">;
  maxDwellMinutes?:number;
  connector?:string;
  verificationStatus?:VerificationStatus;
  operationalStatus?:OperationalStatus;
}
export interface PlatformConfig { commissionRate:number; starFeeDiscount:number; alternativePriceTolerance:number; starBenefits:string[]; }
export function isUpcomingStatus(status:ReservationStatus){ return (UPCOMING_STATUSES as string[]).includes(status); }
export function isHistoryStatus(status:ReservationStatus){ return (HISTORY_STATUSES as string[]).includes(status); }
export function modeExploreHref(mode:SpaceMode){
  if(mode==="PARKING") return "/parking";
  return `/mobility?mode=${mode}`;
}

