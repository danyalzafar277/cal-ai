"use client";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProject } from "@/hooks/useProjects";

// Redirect to /notes with project pre-filtered
export default function ProjectNotesPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { project } = useProject(projectId);

  // Navigate to global notes page
  // For a more integrated UX you could embed the notes component here
  return (
    <div>
      <Button variant="ghost" size="sm" className="mb-4 -ml-2" onClick={() => router.push(`/projects/${projectId}`)}>
        <ArrowLeft className="w-4 h-4" /> Back to {project?.name}
      </Button>
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm mb-4">
          Manage notes from the global Notes page, filtered by project.
        </p>
        <Button onClick={() => router.push("/notes")}>Go to Notes</Button>
      </div>
    </div>
  );
}
