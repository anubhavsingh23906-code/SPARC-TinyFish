import { DashboardShell } from "@/components/dashboard-shell"; import { ParkingMarketplace } from "@/components/parking-marketplace";
export default function Page(){return <DashboardShell><section><div className="mb-5"><p className="eyebrow">Parking marketplace</p><h1 className="text-3xl font-bold">Reserve trusted parking, with context.</h1><p className="mt-2 text-slate-600">Availability is seeded demo data; forecasts are deterministic estimates.</p></div><ParkingMarketplace/></section></DashboardShell>}

