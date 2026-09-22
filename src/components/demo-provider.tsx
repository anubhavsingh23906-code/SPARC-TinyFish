"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { DemoAccount, demoAccounts } from "@/lib/demo-state";
import { Role } from "@/lib/types";
import { switchDemoAccount } from "@/lib/demo-session";

type DemoContextValue = {
  account: DemoAccount;
  setAccount: (account: DemoAccount) => Promise<void>;
  ready: boolean;
};

const Context = createContext<DemoContextValue>({
  account: demoAccounts[0],
  setAccount: async () => {},
  ready: false,
});

export function DemoProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [account, setState] = useState(demoAccounts[0]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    async function synchronize() {
      const id = localStorage.getItem("sparc-demo-account");

      const found =
        demoAccounts.find((item) => item.id === id) ??
        demoAccounts[0];

      try {
        await switchDemoAccount(found.id);

        if (!active) {
          return;
        }

        setState(found);
        setReady(true);
      } catch (error) {
        console.error(
          "Failed to synchronize demo session:",
          error,
        );

        if (!active) {
          return;
        }

        setState(found);
        setReady(true);
      }
    }

    void synchronize();

    return () => {
      active = false;
    };
  }, []);

  async function setAccount(nextAccount: DemoAccount) {
    await switchDemoAccount(nextAccount.id);
    setState(nextAccount);
  }

  return (
    <Context.Provider
      value={{
        account,
        setAccount,
        ready,
      }}
    >
      {!ready ? (
        <div className="min-h-screen bg-cloud flex items-center justify-center">
          <div className="panel px-8 py-6 text-center">
            <p className="eyebrow">SPARC</p>
            <p className="mt-2 text-sm text-slate-500">
              Synchronizing demo session...
            </p>
          </div>
        </div>
      ) : (
        children
      )}
    </Context.Provider>
  );
}

export const useDemo = () => useContext(Context);

export function RoleGate({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  const { account } = useDemo();

  if (account.role !== role) {
    return (
      <div className="panel p-10 text-center">
        <p className="eyebrow">Demo role guard</p>

        <h1 className="mt-2 text-xl font-bold">
          This surface requires {role.replace("_", " ")} access.
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Switch demo accounts to view it. Server operations remain
          role-authorized.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
