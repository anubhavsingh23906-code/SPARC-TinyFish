import { SpaceSummary } from "@/lib/types";
export type ReliabilityInput={successful:number;failed:number;cancellations:number;verifiedIncidents:number;staleUpdates:number;checkInRate:number};
export function calculateReliability(v:ReliabilityInput){const attempts=Math.max(1,v.successful+v.failed+v.cancellations);const fulfillment=v.successful/attempts;const incidentPenalty=Math.min(.18,v.verifiedIncidents/attempts*.35);const freshnessPenalty=Math.min(.1,v.staleUpdates/attempts*.15);return Math.round(Math.max(0,Math.min(100,(fulfillment*.7+v.checkInRate*.3-incidentPenalty-freshnessPenalty)*100)))}
export function isBookable(space:{verificationStatus:string;operationalStatus:string},ownerStatus:string){return ownerStatus==="APPROVED"&&space.verificationStatus==="APPROVED"&&space.operationalStatus==="ACTIVE"}
export function spaceTrust(space:Pick<SpaceSummary,"verified"|"verificationStatus"|"operationalStatus">){
  const verificationStatus=space.verificationStatus??(space.verified?"APPROVED":"PENDING");
  const operationalStatus=space.operationalStatus??(verificationStatus==="APPROVED"?"ACTIVE":"INACTIVE");
  const ownerStatus=verificationStatus==="APPROVED"?"APPROVED":"PENDING";
  return {verificationStatus,operationalStatus,ownerStatus,verified:verificationStatus==="APPROVED"};
}
export function canBookSpace(space:Pick<SpaceSummary,"verified"|"verificationStatus"|"operationalStatus"|"available">){
  const trust=spaceTrust(space);
  if(!isBookable(trust,trust.ownerStatus)) return {ok:false as const,reason:"SPACE_NOT_BOOKABLE"};
  if(space.available<=0) return {ok:false as const,reason:"NO_AVAILABILITY"};
  return {ok:true as const};
}
export function starEntitlements(membership:{status:string;benefits:string[]}|null){return {isStar:membership?.status==="ACTIVE",benefits:membership?.status==="ACTIVE"?membership.benefits:[]}}
export function preferredAlternatives(spaces:SpaceSummary[],failed:SpaceSummary){return spaces.filter(s=>s.id!==failed.id&&s.mode===failed.mode&&s.verified&&s.available>0).sort((a,b)=>{const sameA=Number(a.price===failed.price),sameB=Number(b.price===failed.price);if(sameA!==sameB)return sameB-sameA;return (b.reliability-a.reliability)+(a.distanceKm-b.distanceKm)})}

