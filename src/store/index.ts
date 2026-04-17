import { create } from "zustand";
import type { AppUser, Workspace, UserRole } from "@/types";

interface AuthState {
  user: AppUser | null;
  workspace: Workspace | null;
  workspaceRole: UserRole | null;
  loading: boolean;

  setUser: (user: AppUser | null) => void;
  setWorkspace: (workspace: Workspace | null) => void;
  setWorkspaceRole: (role: UserRole | null) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  workspace: null,
  workspaceRole: null,
  loading: true,

  setUser: (user) => set({ user }),
  setWorkspace: (workspace) => set({ workspace }),
  setWorkspaceRole: (workspaceRole) => set({ workspaceRole }),
  setLoading: (loading) => set({ loading }),
  reset: () =>
    set({ user: null, workspace: null, workspaceRole: null, loading: false }),
}));

interface UIState {
  sidebarOpen: boolean;
  currentProjectId: string | null;

  setSidebarOpen: (open: boolean) => void;
  setCurrentProjectId: (id: string | null) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  currentProjectId: null,

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setCurrentProjectId: (currentProjectId) => set({ currentProjectId }),
}));
