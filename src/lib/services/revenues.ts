import {
  collection,
  doc,
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
import type { Revenue } from "@/types";
import type { RevenueFormValues } from "@/lib/validations";

export async function createRevenue(
  workspaceId: string,
  projectId: string,
  userId: string,
  values: RevenueFormValues
): Promise<Revenue> {
  const ref = doc(collection(db, "revenues"));
  const now = serverTimestamp() as Timestamp;

  const revenue: Omit<Revenue, "id"> = {
    workspaceId,
    projectId,
    source: values.source,
    platform: values.platform,
    amount: values.amount,
    currency: values.currency,
    date: values.date,
    paymentMethod: values.paymentMethod ?? "",
    reference: values.reference ?? "",
    note: values.note ?? "",
    status: "active",
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await setDoc(ref, revenue);
  return { id: ref.id, ...revenue } as Revenue;
}

export async function updateRevenue(
  revenueId: string,
  userId: string,
  values: Partial<RevenueFormValues>
): Promise<void> {
  await updateDoc(doc(db, "revenues", revenueId), {
    ...values,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeleteRevenue(
  revenueId: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, "revenues", revenueId), {
    status: "deleted",
    deletedAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToRevenues(
  workspaceId: string,
  projectId: string | null,
  callback: (revenues: Revenue[]) => void
): Unsubscribe {
  let q;
  if (projectId) {
    q = query(
      collection(db, "revenues"),
      where("workspaceId", "==", workspaceId),
      where("projectId", "==", projectId),
      where("status", "==", "active")
    );
  } else {
    q = query(
      collection(db, "revenues"),
      where("workspaceId", "==", workspaceId),
      where("status", "==", "active")
    );
  }

  return onSnapshot(q, (snap) => {
    const revenues = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Revenue[];
    revenues.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    callback(revenues);
  });
}
