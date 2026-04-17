"use client";

import { useEffect, useState } from "react";
import { subscribeToNotes } from "@/lib/services/notes";
import type { Note } from "@/types";

export function useNotes(
  workspaceId: string | null,
  projectId: string | null = null
) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToNotes(workspaceId, projectId, (data) => {
      setNotes(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [workspaceId, projectId]);

  return { notes, loading };
}
