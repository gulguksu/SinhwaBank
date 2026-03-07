import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "shinwha_session";

function getSecret() {
  const secret = process.env.AUTH_COOKIE_SECRET;
  if (!secret) {
    throw new Error("AUTH_COOKIE_SECRET is not set");
  }
  return secret;
}

export type SessionUser =
  | { role: "admin"; name: string }
  | { role: "user"; id: number; username: string; name: string; job?: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  try {
    const [payloadB64, sig] = raw.split(".");
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const expectedSig = crypto
      .createHmac("sha256", getSecret())
      .update(payloadB64)
      .digest("base64url");

    if (sig !== expectedSig) return null;

    const data = JSON.parse(payload);
    if (data.role === "admin") {
      return { role: "admin", name: "관리자" };
    }
    if (data.role === "user") {
      return {
        role: "user",
        id: data.id,
        username: data.username,
        name: data.name,
        job: data.job ?? null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionUser(user: SessionUser) {
  const cookieStore = await cookies();
  const payload = JSON.stringify(user);
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSecret())
    .update(payloadB64)
    .digest("base64url");

  const value = `${payloadB64}.${sig}`;

  cookieStore.set(COOKIE_NAME, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

