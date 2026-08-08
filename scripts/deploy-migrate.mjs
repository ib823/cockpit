#!/usr/bin/env node
/**
 * Applies pending Prisma migrations during a Vercel production build.
 *
 * WHY THIS EXISTS
 *
 * The build was `prisma generate && next build`, with nothing anywhere in the
 * pipeline that applied migrations — `docs/DEPLOYMENT.md` §4 said to run them
 * by hand. That is fine right up until someone forgets, and then the deploy
 * succeeds while the schema does not match. It happened: the optimistic-lock
 * migration merged and shipped, and because Prisma selects every scalar field
 * by default, `GanttTask.version` missing made even a plain read fail —
 *
 *     Invalid `prisma.ganttTask.findMany()` invocation:
 *     The column `GanttTask.version` does not exist in the current database.
 *
 * — so opening a Gantt project broke, not just saving one. A deploy step that
 * cannot be forgotten is the fix.
 *
 * WHY IT DOES NOT SIMPLY RUN `migrate deploy`
 *
 * This is the part worth reading before changing anything here. The production
 * database predates the migration directory: it was created with
 * `prisma db push`, so it carries all 65 tables and NO `_prisma_migrations`
 * table. `0_init` is a baseline written as 65 `CREATE TABLE` statements. Run
 * `migrate deploy` against that database and Prisma sees no applied
 * migrations, tries `0_init`, and fails on the first table that already
 * exists — and because this runs inside the build, that failure would block
 * every deploy, on a database it also left half-touched.
 *
 * So the script decides what it is looking at first, and refuses rather than
 * guesses. Three cases:
 *
 *   1. Empty database        -> safe. `migrate deploy` creates everything.
 *   2. Baselined database    -> safe. `_prisma_migrations` records `0_init`;
 *                               only genuinely pending migrations run.
 *   3. Tables but no history -> STOP. Needs a one-time manual baseline, which
 *                               is a decision about a live database and not
 *                               something a build should make on its own.
 *
 * Case 3 fails the build on purpose. Shipping code whose schema is absent is
 * the failure this file exists to prevent, and a build that goes green while
 * production breaks is worse than one that stops with instructions.
 */

import { execFileSync } from "node:child_process";

/**
 * Only production deploys migrate. Preview deploys are excluded deliberately:
 * unless the Vercel project scopes `DATABASE_URL` per environment, a preview
 * build points at the production database, and a migration from an unmerged
 * branch would land on live data. Local and CI builds are excluded for the
 * same reason in miniature — `pnpm build` should not mutate anyone's database
 * as a side effect.
 *
 * `RUN_DEPLOY_MIGRATIONS=1` forces it on for anyone who wants this behaviour
 * somewhere else, explicitly rather than by accident.
 */
const shouldRun =
  process.env.RUN_DEPLOY_MIGRATIONS === "1" ||
  process.env.VERCEL_ENV === "production";

if (!shouldRun) {
  const where = process.env.VERCEL_ENV
    ? `VERCEL_ENV=${process.env.VERCEL_ENV}`
    : "not a Vercel build";
  console.log(
    `[migrate] Skipping migrations (${where}). ` +
      `Set RUN_DEPLOY_MIGRATIONS=1 to run them here.`
  );
  process.exit(0);
}

// Migrations need a direct connection; the Neon pooler cannot carry DDL
// reliably. This mirrors `directUrl` in prisma/schema.prisma.
const directUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!directUrl) {
  console.error(
    "[migrate] Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set. " +
      "See docs/DEPLOYMENT.md §3."
  );
  process.exit(1);
}

/** Runs a prisma subcommand, inheriting stdio so its output reaches the build log. */
function prisma(args) {
  return execFileSync("node", ["node_modules/prisma/build/index.js", ...args], {
    stdio: "inherit",
    env: process.env,
  });
}

/**
 * Which of the three cases we are in.
 *
 * Uses the Prisma client rather than `migrate status`, whose output is prose
 * and whose exit code cannot tell "needs baselining" apart from "has pending
 * migrations" — and those two need opposite responses.
 */
async function inspectDatabase() {
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient({ datasources: { db: { url: directUrl } } });

  try {
    const [{ count: tableCount }] = await client.$queryRaw`
      SELECT count(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `;

    if (tableCount === 0) {
      return { state: "empty" };
    }

    const [{ count: historyCount }] = await client.$queryRaw`
      SELECT count(*)::int AS count
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = '_prisma_migrations'
    `;

    if (historyCount === 0) {
      return { state: "unbaselined", tableCount };
    }

    // The history table can exist while `0_init` is absent — a partially
    // baselined database is its own hazard, and is treated as case 3.
    const [{ count: baselineCount }] = await client.$queryRaw`
      SELECT count(*)::int AS count
      FROM "_prisma_migrations"
      WHERE migration_name = '0_init' AND finished_at IS NOT NULL
    `;

    return baselineCount > 0
      ? { state: "baselined" }
      : { state: "unbaselined", tableCount };
  } finally {
    await client.$disconnect();
  }
}

const result = await inspectDatabase();

if (result.state === "unbaselined") {
  console.error(
    [
      "",
      "[migrate] REFUSING TO MIGRATE — the database is not baselined.",
      "",
      `  It has ${result.tableCount} tables but no record of the '0_init' baseline.`,
      "  That is the signature of a database created with `prisma db push`",
      "  before this repo had migrations.",
      "",
      "  Running `migrate deploy` now would try to apply 0_init — 65 CREATE",
      "  TABLE statements — against a populated database, fail on the first",
      "  table that already exists, and leave it partially touched.",
      "",
      "  Baseline it once, by hand, against the DIRECT (unpooled) URL:",
      "",
      "    export DATABASE_URL='<Neon DIRECT url>'",
      "    pnpm prisma migrate resolve --applied 0_init",
      "    pnpm prisma migrate status     # expect: schema is up to date",
      "",
      "  Then redeploy. Every migration after that applies automatically.",
      "  See prisma/migrations/README.md.",
      "",
    ].join("\n")
  );
  process.exit(1);
}

console.log(
  result.state === "empty"
    ? "[migrate] Empty database — applying all migrations."
    : "[migrate] Database is baselined — applying pending migrations."
);

prisma(["migrate", "deploy"]);
