"use client"; import { MODES, SpaceMode } from "@/lib/types"; import { Car, BatteryCharging, PackageOpen, Accessibility, ArrowDownUp } from "lucide-react";
const icons={PARKING:Car,EV:BatteryCharging,LOADING:PackageOpen,ACCESSIBILITY:Accessibility,PICKUP:ArrowDownUp};
export function ModeSelector({active,onChange}:{active:SpaceMode;onChange:(m:SpaceMode)=>void}) { return <div className="flex gap-2 overflow-auto pb-1">{MODES.map(m=>{const Icon=icons[m];return <button onClick={()=>onChange(m)} key={m} className={`chip whitespace-nowrap ${active===m?"bg-ink text-white":"bg-slate-100 text-slate-600"}`}><Icon size={14}/>{m.replace("_"," ")}</button>})}</div> }

