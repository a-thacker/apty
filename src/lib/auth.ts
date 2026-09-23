import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";

/**
 * Resolves the current user from the request.
 *
 * In production the app sits behind Cloudflare Access, which injects the
 * authenticated email as `Cf-Access-Authenticated-User-Email`. Locally we fall
 * back to DEV_USER_EMAIL so you can develop without the tunnel.
 *
 * (Hardening TODO: verify the `Cf-Access-Jwt-Assertion` token against your
 * team's public keys using CF_ACCESS_TEAM_DOMAIN / CF_ACCESS_AUD before trusting
 * the header. Fine to skip while the only ingress is the Access-gated tunnel.)
 */
export async function getCurrentUser(): Promise<User> {
  const h = await headers();
  const email =
    h.get("cf-access-authenticated-user-email")?.toLowerCase() ??
    process.env.DEV_USER_EMAIL?.toLowerCase() ??
    "you@example.com";

  await db.insert(users).values({ email, name: defaultName(email) }).onConflictDoNothing();
  const user = await db.query.users.findFirst({ where: eq(users.email, email) });
  // onConflictDoNothing guarantees the row exists by now.
  return user!;
}

function defaultName(email: string) {
  const handle = email.split("@")[0] ?? email;
  return handle.charAt(0).toUpperCase() + handle.slice(1);
}
