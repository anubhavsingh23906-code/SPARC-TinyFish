import { Role } from "@/lib/types"; import { SpaceSummary } from "@/lib/types"; import { shortageSeverity,utilization } from "@/lib/intelligence/engine";
export type ZoneSummary={name:string;capacity:number;available:number;utilization:number;severity:string;modes:string[]};
export function aggregateZones(spaces:SpaceSummary[]):ZoneSummary[]{const groups=new Map<string,SpaceSummary[]>;spaces.forEach(s=>groups.set(s.zone,[...(groups.get(s.zone)??[]),s]));return [...groups].map(([name,list])=>{const capacity=list.reduce((n,s)=>n+(s.capacity??0),0),available=list.reduce((n,s)=>n+s.available,0);return {name,capacity,available,utilization:utilization(capacity,available),severity:shortageSeverity(available,capacity),modes:[...new Set(list.map(x=>x.mode))]}})}
export function hotspots(zones:ZoneSummary[]){return [...zones].sort((a,b)=>b.utilization-a.utilization).filter(z=>z.utilization>=60)}
export function cityAlerts(zones:ZoneSummary[]){return zones.filter(z=>["HIGH_DEMAND","SHORTAGE_RISK","SHORTAGE"].includes(z.severity)).map(z=>({type:z.severity,zone:z.name,description:`${z.utilization}% utilized; monitor capacity and redirect demand if needed.`,action:"Review nearby spare capacity"}))}
export function requireOperationRole(role:Role,allowed:Role[]){if(!allowed.includes(role))throw new Error("FORBIDDEN");return true}
export function validateCommissionChange(role:Role,rate:number){requireOperationRole(role,["ADMIN"]);if(rate<.05||rate>.1)throw new Error("INVALID_COMMISSION_RATE");return rate}
export function notification(type:string,message:string){return {id:`ntf-${Date.now().toString(36)}`,type,message,createdAt:new Date()}}

