import { SpaceSummary } from "@/lib/types";
export type MobilityMode="PARKING"|"LOADING"|"PICKUP"|"EV"|"ACCESSIBILITY";
export type MobilityRequirements={vehicleType?:"CAR"|"VAN"|"LCV";dwellMinutes?:number;connector?:string;requiresAccessible?:boolean};
export function supportsMode(space:SpaceSummary,mode:MobilityMode,requirements:MobilityRequirements={}){if(space.mode!==mode)return false;if(mode==="EV"&&!space.ev)return false;if(mode==="ACCESSIBILITY"&&!space.accessible)return false;if(mode==="LOADING"&&requirements.vehicleType&&!space.vehicleTypes?.includes(requirements.vehicleType))return false;if((mode==="LOADING"||mode==="PICKUP")&&requirements.dwellMinutes&&space.maxDwellMinutes&&requirements.dwellMinutes>space.maxDwellMinutes)return false;if(mode==="EV"&&requirements.connector&&space.connector!==requirements.connector)return false;return true}
export function validateModeBooking(space:SpaceSummary,requirements:MobilityRequirements){if(!supportsMode(space,space.mode,requirements))throw new Error("MODE_REQUIREMENTS_NOT_MET");return true}
export type ChargingStatus="AVAILABLE"|"AUTHORIZED"|"CHARGING"|"COMPLETED"|"FAILED"|"CANCELLED";
const next:Record<ChargingStatus,ChargingStatus[]>={AVAILABLE:["AUTHORIZED"],AUTHORIZED:["CHARGING","CANCELLED"],CHARGING:["COMPLETED","FAILED"],COMPLETED:[],FAILED:[],CANCELLED:[]};export const canTransitionCharging=(from:ChargingStatus,to:ChargingStatus)=>next[from].includes(to);
export function modeAlternatives(spaces:SpaceSummary[],failed:SpaceSummary,requirements:MobilityRequirements={}){return spaces.filter(s=>s.id!==failed.id&&supportsMode(s,failed.mode,requirements)&&s.verified&&s.available>0).sort((a,b)=>Number(b.price===failed.price)-Number(a.price===failed.price)||b.reliability-a.reliability||a.distanceKm-b.distanceKm)}

