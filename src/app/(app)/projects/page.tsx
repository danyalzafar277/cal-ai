"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, FolderOpen, Filter } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { useAuthStore } from "@/store";
import { useProjects } from "@/hooks/useProjects";
import { useInvestments } from "@/hooks/useInvestments";
import { useRevenues } from "@/hooks/useRevenues";
import { usePermissions } from "@/hooks/usePermissions";
import {
  archiveProject,
  restoreProject,
  softDeleteProject,
  duplicateProject,
} from "@/lib/services/projects";
import { logActivity } from "@/lib/services/activity";
import type { Project } from "@/types";

export default function ProjectsPage() {
  const router = useRouter();
  const { user, workspace } = useAuthStore();
  const { can } = usePermissions();
  const { projects, loading } = useProjects(workspace?.id ?? null);
  const { investments } = useInvestments(workspace?.id ?? null);
  const { revenues } = useRevenues(workspace?.id ?? null);

  const [tab, setTab] = useState<"active" | "archived">("active");
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  const filtered = projects.filter((p) =>
    tab === "active" ? p.status === "active" : p.status === "archived"
  );

  async function handleArchive(project: Project) {
    try {
      await archiveProject(project.id, user!.uid);
      await logActivity(
        workspace!.id,
        user!.uid,
        user!.displayName ?? "",
        "project.archived",
        "project",
        project.id,
        project.name,
        project.id
      );
      toast.success(`"${project.name}" archived`);
    } catch {
      toast.error("Failed to archive project");
    }
  }

  async function handleRestore(project: Project) {
    try {
      await restoreProject(project.id, user!.uid);
      toast.success(`"${project.name}" restored`);
    } catch {
      toast.error("Failed to restore project");
    }
  }

  async function handleDelete(project: Project) {
    try {
      await softDeleteProject(project.id, user!.uid);
      await logActivity(
        workspace!.id,
        user!.uid,
        user!.displayName ?? "",
        "project.deleted",
        "project",
        project.id,
        project.name
      );
      toast.success(`"${project.name}" deleted`);
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete project");
    }
  }

  async function handleDuplicate(project: Project) {
    try {
      const dup = await duplicateProject(project, user!.uid);
      await logActivity(
        workspace!.id,
        user!.uid,
        user!.displayName ?? "",
        "project.duplicated",
        "project",
        dup.id,
        dup.name
      );
      toast.success(`"${project.name}" duplicated`);
      router.push(`/projects/${dup.id}`);
    } catch {
      toast.error("Failed to duplicate project");
    }
  }

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Projects"
        description={`${projects.filter((p) => p.status === "active").length} active project${projects.filter((p) => p.status === "active").length !== 1 ? "s" : ""}`}
        icon={FolderOpen}
        actions={
          can("project.create") && (
            <Button size="sm" onClick={() => router.push("/projects/new")}>
              <Plus className="w-4 h-4" />
              New project
            </Button>
          )
        }
      />

      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as "active" | "archived")}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="active">
            Active
            <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
              {projects.filter((p) => p.status === "active").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="archived">
            Archived
            <Badge variant="secondary" className="ml-1.5 h-4 px-1.5 text-[10px]">
              {projects.filter((p) => p.status === "archived").length}
            </Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title={tab === "active" ? "No active projects" : "No archived projects"}
          description={
            tab === "active"
              ? "Create your first project to start tracking investments and revenue."
              : "Archived projects appear here."
          }
          action={
            tab === "active" && can("project.create")
              ? {
                  label: "Create project",
                  onClick: () => router.push("/projects/new"),
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const projectInvestments = investments.filter(
              (i) => i.projectId === project.id
            );
            const projectRevenues = revenues.filter(
              (r) => r.projectId === project.id
            );
            return (
              <ProjectCard
                key={project.id}
                project={project}
                investments={projectInvestments}
                revenues={projectRevenues}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
                canEdit={true}
                canArchive={can("project.archive")}
                canDelete={can("project.delete")}
                canDuplicate={can("project.duplicate")}
              />
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title={`Delete "${deleteTarget?.name}"?`}
        description="This project will be soft-deleted and hidden from all views. This action cannot be undone from the UI."
        confirmLabel="Delete project"
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
        destructive
      />
    </>
  );
}
