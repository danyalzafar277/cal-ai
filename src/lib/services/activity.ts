import {
  collection,
  doc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { ActivityLog, ActivityAction } from "@/types";

export async function logActivity(
  workspaceId: string,
  userId: string,
  userDisplayName: string,
  action: ActivityAction,
  entityType: ActivityLog["entityType"],
  entityId: string,
  entityName: string,
  projectId: string | null = null
): Promise<void> {
  const ref = doc(collection(db, "activity_logs"));
  const log: Omit<ActivityLog, "id"> = {
    workspaceId,
    projectId,
    userId,
    userDisplayName,
    action,
    entityType,
    entityId,
    entityName,
    createdAt: serverTimestamp() as Timestamp,
  };
  await setDoc(ref, log);
}

export function subscribeToActivity(
  workspaceId: string,
  projectId: string | null,
  callback: (logs: ActivityLog[]) => void,
  count = 20
): Unsubscribe {
  let q;
  if (projectId) {
    q = query(
      collection(db, "activity_logs"),
      where("workspaceId", "==", workspaceId),
      where("projectId", "==", projectId),
      orderBy("createdAt", "desc"),
      limit(count)
    );
  } else {
    q = query(
      collection(db, "activity_logs"),
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
      limit(count)
    );
  }

  return onSnapshot(q, (snap) => {
    const logs = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as ActivityLog[];
    callback(logs);
  });
}
