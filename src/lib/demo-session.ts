import { demoAccounts } from "@/lib/demo-state";

export async function switchDemoAccount(accountId: string) {
  const account = demoAccounts.find(
    (item) => item.id === accountId,
  );

  if (!account) {
    throw new Error("INVALID_DEMO_ACCOUNT");
  }

  const response = await fetch("/api/demo/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ accountId }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error ?? "SESSION_SWITCH_FAILED");
  }

  localStorage.setItem("sparc-demo-account", accountId);
  return account;
}

