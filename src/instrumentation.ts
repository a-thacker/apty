// Runs once when the Next.js server boots (both dev and prod).
// We use it to apply database migrations before serving any request.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { runMigrations } = await import("./db/migrate");
    await runMigrations();
  }
}
