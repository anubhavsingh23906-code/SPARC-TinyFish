import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { connectDb } from "./db";
import { User } from "./models";
import { Role } from "./types";

export interface SessionUser {
  id: string;
  role: Role;
  email: string;
  name: string;
}

const COOKIE_NAME = "sparc-demo-session";

const DEMO_ACCOUNTS = [
  {
    id: "demo-user-1",
    name: "Demo User",
    role: "USER" as Role,
    email: "rhea@sparc.demo",
  },
  {
    id: "demo-owner-1",
    name: "Demo Owner",
    role: "OWNER" as Role,
    email: "aman@sparc.demo",
  },
  {
    id: "demo-city-1",
    name: "Demo City Operator",
    role: "CITY_OPERATOR" as Role,
    email: "nisha@sparc.demo",
  },
  {
    id: "demo-admin-1",
    name: "Demo Admin",
    role: "ADMIN" as Role,
    email: "admin@sparc.demo",
  },
];

function secret() {
  return (
    process.env.AUTH_SECRET ||
    "sparc-development-demo-secret-change-me"
  );
}

function sign(value: string) {
  return createHmac("sha256", secret())
    .update(value)
    .digest("base64url");
}

export function createDemoSession(accountId: string) {
  const account = DEMO_ACCOUNTS.find(
    (item) => item.id === accountId,
  );

  if (!account) {
    throw new Error("INVALID_DEMO_ACCOUNT");
  }

  const payload = Buffer.from(
    JSON.stringify({ id: account.id }),
    "utf8",
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function verifyDemoSession(value: string) {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);

  try {
    if (
      !timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expected),
      )
    ) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as { id?: string };

    return (
      DEMO_ACCOUNTS.find(
        (account) => account.id === parsed.id,
      ) ?? null
    );
  } catch {
    return null;
  }
}

export async function setDemoSession(accountId: string) {
  const session = createDemoSession(accountId);
  const store = await cookies();

  store.set(COOKIE_NAME, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24,
  });
}

export async function getCurrentUser(): Promise<SessionUser> {
  const store = await cookies();
  const session = store.get(COOKIE_NAME)?.value;

  const account =
    (session ? verifyDemoSession(session) : null) ??
    DEMO_ACCOUNTS[0];

  await connectDb();

  const user = await User.findOne({
    externalId: account.id,
  })
    .lean()
    .exec();

  if (!user || Array.isArray(user)) {
    throw new Error("DEMO_USER_NOT_SEEDED");
  }

  return {
    id: String(user._id),
    role: user.role as Role,
    email: String(user.email),
    name: String(user.name),
  };
}

export function requireRole(
  user: SessionUser,
  ...allowed: Role[]
) {
  if (!allowed.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }

  return user;
}

