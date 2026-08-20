// Prisma 7 configuration.
// Docs: https://pris.ly/d/prisma-config
// In v7 there is no `package.json#prisma` block; everything lives here.
// The datasource URL is provided for migrate/introspection; the runtime
// PrismaClient uses a PrismaPg driver adapter (see src/lib/db/prisma.ts).
import { readFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7's `env()` helper reads from `process.env` but does not load a
// `.env` file. We load it ourselves (dependency-free) so `prisma migrate dev`
// works without an external dotenv package.
loadEnvFile(path.resolve(process.cwd(), ".env"));

type Env = {
  DATABASE_URL: string;
};

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
    // Seed is wired in #4; the entrypoint exists so the config is valid now.
    seed: "tsx prisma/seed/index.ts",
  },
  datasource: {
    url: env<Env>("DATABASE_URL"),
  },
});

/** Minimal .env loader — sets vars on process.env if not already set. */
function loadEnvFile(file: string): void {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return; // .env is optional; real env vars may already be exported.
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    // Strip surrounding quotes.
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
