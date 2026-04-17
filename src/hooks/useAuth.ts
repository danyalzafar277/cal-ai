"use client";

import { useEffect } from "react";
import { onAuthChange } from "@/lib/firebase/auth";
import {
  getUserWorkspaceMembership,
  getWorkspace,
  updateMemberProfile,
} from "@/lib/services/workspace";
import { useAuthStore } from "@/store";

export function useAuthInit() {
  const { setUser, setWorkspace, setWorkspaceRole, setLoading } =
    useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setWorkspace(null);
        setWorkspaceRole(null);
        setLoading(false);
        return;
      }

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
      });

      try {
        const membership = await getUserWorkspaceMembership(firebaseUser.uid);

        if (!membership) {
          setWorkspace(null);
          setWorkspaceRole(null);
          setLoading(false);
          return;
        }

        const workspace = await getWorkspace(membership.workspaceId);
        setWorkspace(workspace);
        setWorkspaceRole(membership.role);

        // Keep member profile in sync
        if (workspace) {
          await updateMemberProfile(
            workspace.id,
            firebaseUser.uid,
            firebaseUser.displayName ?? "",
            firebaseUser.email ?? "",
            firebaseUser.photoURL
          );
        }
      } catch (err) {
        console.error("Error loading workspace:", err);
        setWorkspace(null);
        setWorkspaceRole(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [setUser, setWorkspace, setWorkspaceRole, setLoading]);
}
