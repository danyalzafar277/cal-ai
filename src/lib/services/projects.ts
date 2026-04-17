import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Project, ProjectStatus } from "@/types";
import type { ProjectFormValues } from "@/lib/validations";

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createProject(
  workspaceId: string,
  userId: string,
  values: ProjectFormValues
): Promise<Project> {
  const ref = doc(collection(db, "projects"));
  const now = serverTimestamp() as Timestamp;

  const project: Omit<Project, "id"> = {
    workspaceId,
    name: values.name,
    type: values.type as Project["type"],
    description: values.description ?? "",
    iconUrl: null,
    iconEmoji: values.iconEmoji ?? "📦",
    colorTag: values.colorTag ?? "#16A34A",
    status: "active",
    launchDate: values.launchDate ?? null,
    platforms: values.platforms ?? [],
    currency: values.currency,
    targetRecoveryAmount: values.targetRecoveryAmount ?? 0,
    targetMonthlyRevenue: values.targetMonthlyRevenue ?? 0,
    tags: values.tags ?? [],
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    deletedAt: null,
  };

  await setDoc(ref, project);
  return { id: ref.id, ...project } as Project;
}

export async function updateProject(
  projectId: string,
  userId: string,
  values: Partial<ProjectFormValues>
): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), {
    ...values,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function archiveProject(
  projectId: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), {
    status: "archived" as ProjectStatus,
    archivedAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function restoreProject(
  projectId: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), {
    status: "active" as ProjectStatus,
    archivedAt: null,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeleteProject(
  projectId: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, "projects", projectId), {
    status: "deleted" as ProjectStatus,
    deletedAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function getProject(projectId: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, "projects", projectId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Project;
}

export async function duplicateProject(
  project: Project,
  userId: string
): Promise<Project> {
  const ref = doc(collection(db, "projects"));
  const now = serverTimestamp() as Timestamp;

  const duplicate: Omit<Project, "id"> = {
    ...project,
    name: `${project.name} (Copy)`,
    status: "active",
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    archivedAt: null,
    deletedAt: null,
  };

  // Remove id from spread
  const { id: _id, ...duplicateData } = duplicate as Project;
  void _id;

  await setDoc(ref, duplicateData);
  return { id: ref.id, ...duplicateData } as Project;
}

// ─── Real-time listeners ──────────────────────────────────────────────────────

export function subscribeToProjects(
  workspaceId: string,
  callback: (projects: Project[]) => void
): Unsubscribe {
  const q = query(
    collection(db, "projects"),
    where("workspaceId", "==", workspaceId),
    where("status", "in", ["active", "archived"])
  );

  return onSnapshot(q, (snap) => {
    const projects = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Project[];
    callback(projects);
  });
}

export function subscribeToProject(
  projectId: string,
  callback: (project: Project | null) => void
): Unsubscribe {
  return onSnapshot(doc(db, "projects", projectId), (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as Project);
  });
}
