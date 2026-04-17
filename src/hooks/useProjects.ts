"use client";

import { useEffect, useState } from "react";
import { subscribeToProjects, subscribeToProject } from "@/lib/services/projects";
import type { Project } from "@/types";

export function useProjects(workspaceId: string | null) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) {
      setProjects([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToProjects(workspaceId, (data) => {
      // Sort: active first, then archived; within each group sort by name
      const sorted = [...data].sort((a, b) => {
        if (a.status !== b.status) {
          return a.status === "active" ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      setProjects(sorted);
      setLoading(false);
    });

    return unsubscribe;
  }, [workspaceId]);

  return { projects, loading };
}

export function useProject(projectId: string | null) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setProject(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToProject(projectId, (data) => {
      setProject(data);
      setLoading(false);
    });

    return unsubscribe;
  }, [projectId]);

  return { project, loading };
}
