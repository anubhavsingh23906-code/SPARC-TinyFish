import { DashboardShell } from "@/components/dashboard-shell"; import { ReservationPass } from "@/components/reservation-pass";
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <DashboardShell><ReservationPass id={id}/></DashboardShell>}

