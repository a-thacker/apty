import { migrate } from "drizzle-orm/libsql/migrator";
import { db } from "./index";

let migrated = false;

/** Applies any pending SQL migrations from ./drizzle. Runs once per process. */
export async function runMigrations() {
  if (migrated) return;
  await migrate(db, { migrationsFolder: "./drizzle" });
  migrated = true;
}
