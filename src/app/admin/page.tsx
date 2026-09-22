import { DashboardShell } from "@/components/dashboard-shell"; import { AdminCommand } from "@/components/command-center"; export default function Page(){return <DashboardShell role="ADMIN"><section><p className="eyebrow">Admin command center · demo data</p><h1 className="mb-6 text-3xl font-bold">Platform governance, visible.</h1><AdminCommand/></section></DashboardShell>}

