import { SpaceSummary, SpaceMode } from "@/lib/types";
export function rankSpaces(spaces:SpaceSummary[], mode:SpaceMode, targetPrice:number) { return spaces.filter(s=>s.mode===mode && s.verified && s.available>0).map(s=>({...s,score:Math.round(s.reliability*.45+(s.forecast>0?20:0)+Math.max(0,20-s.distanceKm*4)+Math.max(0,15-Math.abs(s.price-targetPrice)/targetPrice*15)), reason:`Verified · ${s.reliability}% reliable · ${s.forecast} likely free next window`})).sort((a,b)=>b.score-a.score); }
export function alternatives(spaces:SpaceSummary[], failed:SpaceSummary) { return rankSpaces(spaces,failed.mode,failed.price).filter(s=>s.id!==failed.id && Math.abs(s.price-failed.price)<=failed.price*.12); }

