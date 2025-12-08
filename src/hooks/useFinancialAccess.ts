/**
 * Financial Access Hook
 *
 * Checks if the current user has permission to view financial data.
 * Used to conditionally render the Financials tab in the UI.
 *
 * SECURITY:
 * - This is a client-side convenience check for UI rendering
 * - Actual security is enforced server-side in the API
 * - Never rely solely on this for authorization
 *
 * Visibility Levels:
 * - PUBLIC: No financial access (tab not shown)
 * - PRESALES_AND_FINANCE: Revenue only (GSR, NSR)
 * - FINANCE_ONLY: Full access (margins, costs)
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { CostVisibilityLevel } from "@prisma/client";

interface FinancialAccessResult {
  hasAccess: boolean;
  visibilityLevel: CostVisibilityLevel;
  isLoading: boolean;
  canSeeRevenue: boolean;
  canSeeMargins: boolean;
  refresh: () => void;
}

export function useFinancialAccess(projectId: string | undefined): FinancialAccessResult {
  const { data: session, status } = useSession();
  const [visibilityLevel, setVisibilityLevel] = useState<CostVisibilityLevel>("PUBLIC");
  const [isLoading, setIsLoading] = useState(true);

  const checkAccess = useCallback(async () => {
    // Not authenticated yet
    if (status === "loading" || !session?.user) {
      setIsLoading(true);
      return;
    }

    // No project to check
    if (!projectId) {
      setIsLoading(false);
      setVisibilityLevel("PUBLIC");
      return;
    }

    setIsLoading(true);

    try {
      // Make a lightweight check to the costing API
      // This will return the visibility level based on the user's role
      const response = await fetch(
        `/api/gantt-tool/team-capacity/costing?projectId=${projectId}`
      );

      if (response.status === 403) {
        // No access
        setVisibilityLevel("PUBLIC");
      } else if (response.ok) {
        const data = await response.json();
        setVisibilityLevel(data.visibilityLevel || "PUBLIC");
      } else if (response.status === 404) {
        // No data but may have access - try POST to check
        const postResponse = await fetch("/api/gantt-tool/team-capacity/costing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            includeSubcontractors: true,
            includeOPE: true,
            saveToDatabase: false, // Don't save, just check access
          }),
        });

        if (postResponse.status === 403) {
          setVisibilityLevel("PUBLIC");
        } else if (postResponse.ok) {
          const data = await postResponse.json();
          setVisibilityLevel(data.costing?.visibilityLevel || "PUBLIC");
        } else {
          setVisibilityLevel("PUBLIC");
        }
      } else {
        setVisibilityLevel("PUBLIC");
      }
    } catch {
      // On error, default to no access
      setVisibilityLevel("PUBLIC");
    } finally {
      setIsLoading(false);
    }
  }, [projectId, session?.user, status]);

  useEffect(() => {
    checkAccess();
  }, [checkAccess]);

  const hasAccess = visibilityLevel !== "PUBLIC";
  const canSeeRevenue =
    visibilityLevel === "PRESALES_AND_FINANCE" || visibilityLevel === "FINANCE_ONLY";
  const canSeeMargins = visibilityLevel === "FINANCE_ONLY";

  return {
    hasAccess,
    visibilityLevel,
    isLoading: isLoading || status === "loading",
    canSeeRevenue,
    canSeeMargins,
    refresh: checkAccess,
  };
}
