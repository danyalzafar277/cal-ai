"use client";

import { useCallback } from "react";
import { hasPermission } from "@/lib/permissions";
import { useAuthStore } from "@/store";
import type { Permission } from "@/types";

export function usePermissions() {
  const { workspaceRole } = useAuthStore();

  const can = useCallback(
    (permission: Permission): boolean => {
      return hasPermission(workspaceRole, permission);
    },
    [workspaceRole]
  );

  return { can, role: workspaceRole };
}
