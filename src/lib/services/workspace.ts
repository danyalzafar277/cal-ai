import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Workspace, WorkspaceMember, UserRole } from "@/types";

// ─── Workspace ────────────────────────────────────────────────────────────────

export async function createWorkspace(
  userId: string,
  name: string,
  defaultCurrency = "USD"
): Promise<Workspace> {
  const workspaceRef = doc(collection(db, "workspaces"));
  const now = serverTimestamp() as Timestamp;

  const workspace: Omit<Workspace, "id"> = {
    name,
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
    defaultCurrency,
    dateFormat: "MMM d, yyyy",
    notificationsEnabled: true,
    defaultCategories: [
      "Development",
      "Design",
      "Marketing",
      "Infrastructure",
      "Tools & Software",
      "Freelancers",
      "App Store Fees",
      "Advertising",
      "Research",
      "Other",
    ],
    defaultRevenueSources: [
      "App Store",
      "Play Store",
      "Subscriptions",
      "One-time Purchase",
      "Ads",
      "Sponsorship",
      "Consulting",
      "Affiliate",
      "Other",
    ],
    defaultPlatforms: [
      "iOS",
      "Android",
      "Web",
      "Desktop",
      "API",
      "Chrome Extension",
      "Other",
    ],
  };

  await setDoc(workspaceRef, workspace);

  // Add owner as workspace member
  const memberRef = doc(collection(db, "workspace_members"));
  const memberData: Omit<WorkspaceMember, "id"> = {
    workspaceId: workspaceRef.id,
    userId,
    email: "",
    displayName: "",
    photoURL: null,
    role: "owner",
    invitedBy: null,
    joinedAt: now,
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(memberRef, memberData);

  return { id: workspaceRef.id, ...workspace } as Workspace;
}

export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  const snap = await getDoc(doc(db, "workspaces", workspaceId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Workspace;
}

export async function updateWorkspace(
  workspaceId: string,
  data: Partial<Workspace>
): Promise<void> {
  await updateDoc(doc(db, "workspaces", workspaceId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

// ─── Members ──────────────────────────────────────────────────────────────────

export async function getUserWorkspaceMembership(
  userId: string
): Promise<WorkspaceMember | null> {
  const q = query(
    collection(db, "workspace_members"),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as WorkspaceMember;
}

export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMember[]> {
  const q = query(
    collection(db, "workspace_members"),
    where("workspaceId", "==", workspaceId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as WorkspaceMember[];
}

export async function updateMemberRole(
  memberId: string,
  role: UserRole
): Promise<void> {
  await updateDoc(doc(db, "workspace_members", memberId), {
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function updateMemberProfile(
  workspaceId: string,
  userId: string,
  displayName: string,
  email: string,
  photoURL: string | null
): Promise<void> {
  const q = query(
    collection(db, "workspace_members"),
    where("workspaceId", "==", workspaceId),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    await updateDoc(snap.docs[0].ref, {
      displayName,
      email,
      photoURL,
      updatedAt: serverTimestamp(),
    });
  }
}
