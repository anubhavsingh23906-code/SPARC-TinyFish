"use client";

import Link from "next/link";
import {
  Sparkles,
  LayoutDashboard,
  Map,
  ShieldCheck,
  Building2,
  BarChart3,
  Menu,
  X,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useDemo } from "./demo-provider";
import { demoAccounts } from "@/lib/demo-state";

function homeForRole(role: string) {
  switch (role) {
    case "OWNER":
      return "/owner";
    case "CITY_OPERATOR":
      return "/city";
    case "ADMIN":
      return "/admin";
    default:
      return "/";
  }
}

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
  const { account, setAccount } = useDemo();
  const active = account.role;

  const links: Array<[string, string]> =
    active === "USER"
      ? [
          ["Home", "/"],
          ["Explore parking", "/parking"],
          ["Bookings", "/bookings"],
          ["STAR membership", "/star"],
        ]
      : active === "OWNER"
        ? [
            ["Dashboard", "/owner"],
            ["Spaces", "/owner/spaces"],
            ["Verification", "/owner/verification"],
          ]
        : active === "CITY_OPERATOR"
          ? [
              ["Command center", "/city"],
              ["Intelligence", "/city/intelligence"],
              ["Analytics", "/city/analytics"],
            ]
          : [
              ["Command center", "/admin"],
              ["Verification", "/admin/verification"],
              ["Audit", "/admin/audit"],
            ];

  async function switchAccount(accountId: string) {
    const nextAccount =
      demoAccounts.find(
        (demoAccount) => demoAccount.id === accountId,
      ) ?? account;

    try {
      // Wait until the server cookie has been updated.
      await setAccount(nextAccount);

      // Only navigate after the session is synchronized.
      router.push(homeForRole(nextAccount.role));
      router.refresh();
    } catch (error) {
      console.error("Account switch failed:", error);
    }
  }

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link
          href={homeForRole(active)}
          className="flex items-center gap-2 font-black tracking-tight"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-mint">
            <Sparkles size={18} />
          </span>
          SPARC
        </Link>

        <div className="hidden items-center gap-3 text-sm text-slate-600 md:flex">
          <span className="chip bg-mint">Demo mode</span>

          <label className="font-semibold text-ink">
            Demo account

            <select
              value={account.id}
              onChange={(event) =>
                void switchAccount(event.target.value)
              }
              className="ml-2 rounded-lg border bg-white p-1.5 text-sm"
            >
              {demoAccounts.map((demoAccount) => (
                <option
                  value={demoAccount.id}
                  key={demoAccount.id}
                >
                  {demoAccount.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="button"
          aria-label={
            mobileMenuOpen
              ? "Close navigation"
              : "Open navigation"
          }
          aria-expanded={mobileMenuOpen}
          onClick={() =>
            setMobileMenuOpen((open) => !open)
          }
          className="rounded-lg p-2 md:hidden"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 pb-10 lg:grid-cols-[205px_1fr]">
        <aside
          className={`${mobileMenuOpen ? "block" : "hidden"} panel h-fit p-3 md:block`}
        >
          <p className="eyebrow px-3 py-2">
            Coordinate · {active.replace("_", " ")}
          </p>

          {links.map(([label, href], index) => {
            const Icon =
              [
                LayoutDashboard,
                Map,
                BarChart3,
                ShieldCheck,
                Building2,
              ][index] ||
              Map;

            return (
              <a
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-cloud ${pathname === href ? "bg-cloud font-bold text-ink" : "text-slate-600"}`}
                href={href}
                key={label}
                aria-current={pathname === href ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={17} />
                {label}
              </a>
            );
          })}
        </aside>

        {children}
      </div>
    </main>
  );
}

