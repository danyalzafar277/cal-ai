import type { UserRole, Permission } from "@/types";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    "project.create",
    "project.edit",
    "project.archive",
    "project.delete",
    "project.reset",
    "project.duplicate",
    "investment.create",
    "investment.edit",
    "investment.delete",
    "revenue.create",
    "revenue.edit",
    "revenue.delete",
    "note.create",
    "note.edit",
    "note.delete",
    "settings.manage",
    "members.manage",
    "export.data",
  ],
  admin: [
    "project.create",
    "project.edit",
    "project.archive",
    "project.duplicate",
    "investment.create",
    "investment.edit",
    "investment.delete",
    "revenue.create",
    "revenue.edit",
    "revenue.delete",
    "note.create",
    "note.edit",
    "note.delete",
    "export.data",
  ],
  editor: [
    "investment.create",
    "investment.edit",
    "revenue.create",
    "revenue.edit",
    "note.create",
    "note.edit",
  ],
  viewer: [],
};

export function hasPermission(role: UserRole | null, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    owner: "Owner",
    admin: "Admin",
    editor: "Editor",
    viewer: "Viewer",
  };
  return labels[role];
}

export function getRoleBadgeColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    owner: "bg-amber-100 text-amber-800",
    admin: "bg-blue-100 text-blue-800",
    editor: "bg-purple-100 text-purple-800",
    viewer: "bg-gray-100 text-gray-700",
  };
  return colors[role];
}
