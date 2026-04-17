"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store";
import { createProject } from "@/lib/services/projects";
import { logActivity } from "@/lib/services/activity";
import type { ProjectFormValues } from "@/lib/validations";

export default function NewProjectPage() {
  const router = useRouter();
  const { user, workspace } = useAuthStore();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(values: ProjectFormValues) {
    if (!user || !workspace) return;
    setLoading(true);
    try {
      const project = await createProject(workspace.id, user.uid, values);
      await logActivity(
        workspace.id,
        user.uid,
        user.displayName ?? "",
        "project.created",
        "project",
        project.id,
        project.name,
        project.id
      );
      toast.success(`"${project.name}" created!`);
      router.push(`/projects/${project.id}`);
    } catch {
      toast.error("Failed to create project. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="New project"
        description="Set up a new project to track investments and revenue"
        icon={FolderPlus}
      />

      <div className="max-w-2xl">
        <Card>
          <CardContent className="pt-6">
            <ProjectForm
              onSubmit={handleSubmit}
              submitLabel="Create project"
              loading={loading}
              defaultValues={{
                currency: workspace?.defaultCurrency ?? "USD",
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
