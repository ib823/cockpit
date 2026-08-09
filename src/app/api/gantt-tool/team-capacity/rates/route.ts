/**
 * Team Capacity API - Rate Card lookup
 *
 * GET /api/gantt-tool/team-capacity/rates
 *   Returns the standard rate card keyed by `${regionCode}_${designation}`,
 *   from the `ResourceRateLookup` table and nowhere else.
 *
 *   There is no code-side baseline to fall back on: the rate card is
 *   commercially confidential and this repository is public. An unseeded
 *   database returns an empty map, and the costing path reports the affected
 *   resources as unrated rather than costing them at a guess.
 */

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/with-auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { toRateInfo, type RateInfo } from "@/lib/team-capacity/rate-card";

export const maxDuration = 10;

export const GET = withAuth(async () => {
  const rates: Record<string, RateInfo> = {};

  // 1) DB rate cards (authoritative). Most-recent effective rate wins.
  try {
    const now = new Date();
    const cards = await prisma.resourceRateLookup.findMany({
      where: {
        effectiveFrom: { lte: now },
        OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
      },
      orderBy: { effectiveFrom: "desc" },
    });

    for (const c of cards) {
      const key = `${c.regionCode}_${c.designation}`;
      if (rates[key]) continue; // ordered desc → first seen is most recent
      rates[key] = toRateInfo({
        standardRatePerHour: c.hourlyRate.toNumber(),
        currency: c.localCurrency,
        forexRate: c.forexRate.toNumber(),
      });
    }
  } catch (err) {
    // An empty map is the honest answer: the caller shows the affected
    // resources as unrated instead of inventing figures.
    logger.error("[Rates] DB lookup failed; serving an empty rate card", { error: err });
  }

  return NextResponse.json({ rates });
});
