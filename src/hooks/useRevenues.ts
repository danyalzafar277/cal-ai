"use client";

import { useEffect, useState } from "react";
import { subscribeToRevenues } from "@/lib/services/revenues";
import type { Revenue } from "@/types";

export function useRevenues(
  workspaceId: string | null,
  projectId: string | null = null
) {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setRevenues([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRevenues(workspaceId, projectId, (data) => {
      setRevenues(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [workspaceId, projectId]);

  return { revenues, loading };
}
