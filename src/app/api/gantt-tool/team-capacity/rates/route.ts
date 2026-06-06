/**
 * Team Capacity API - Rate Card lookup
 *
 * GET /api/gantt-tool/team-capacity/rates
 *   Returns the standard rate card keyed by `${regionCode}_${designation}`.
 *   The DB `ResourceRateLookup` table is authoritative; any region/designation
 *   not present in the DB is filled from the canonical baseline so the client
 *   always receives a complete map (and works against an unseeded DB).
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { RATE_CARD_DATA, toRateInfo, type RateInfo } from "@/lib/team-capacity/rate-card-data";

export const maxDuration = 10;

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    logger.error("[Rates] DB lookup failed; serving canonical baseline", { error: err });
  }

  // 2) Fill any gaps (and an empty/unseeded DB) from the canonical baseline.
  for (const [region, designations] of Object.entries(RATE_CARD_DATA)) {
    for (const [designation, rate] of Object.entries(designations)) {
      const key = `${region}_${designation}`;
      if (!rates[key]) rates[key] = toRateInfo(rate);
    }
  }

  return NextResponse.json({ rates });
}
