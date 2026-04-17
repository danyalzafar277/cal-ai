"use client";

import { useMemo } from "react";
import { calculateProjectMetrics, calculateCompanyMetrics } from "@/lib/metrics";
import type { Investment, Revenue, Project } from "@/types";

export function useProjectMetrics(
  investments: Investment[],
  revenues: Revenue[]
) {
  return useMemo(
    () => calculateProjectMetrics(investments, revenues),
    [investments, revenues]
  );
}

export function useCompanyMetrics(
  projects: Project[],
  investments: Investment[],
  revenues: Revenue[]
) {
  return useMemo(
    () => calculateCompanyMetrics(projects, investments, revenues),
    [projects, investments, revenues]
  );
}
