"use client";

import { useEffect, useState } from "react";
import { subscribeToInvestments } from "@/lib/services/investments";
import type { Investment } from "@/types";

export function useInvestments(
  workspaceId: string | null,
  projectId: string | null = null
) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setInvestments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToInvestments(
      workspaceId,
      projectId,
      (data) => {
        setInvestments(data);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [workspaceId, projectId]);

  return { investments, loading };
}
