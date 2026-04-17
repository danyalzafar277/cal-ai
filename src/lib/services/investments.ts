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
import type { Investment } from "@/types";
import type { InvestmentFormValues } from "@/lib/validations";

export async function createInvestment(
  workspaceId: string,
  projectId: string,
  userId: string,
  values: InvestmentFormValues
): Promise<Investment> {
  const ref = doc(collection(db, "investments"));
  const now = serverTimestamp() as Timestamp;

  const investment: Omit<Investment, "id"> = {
    workspaceId,
    projectId,
    platform: values.platform,
    category: values.category,
    amount: values.amount,
    currency: values.currency,
    date: values.date,
    paymentMethod: values.paymentMethod ?? "",
    note: values.note ?? "",
    receiptUrl: null,
    status: "active",
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await setDoc(ref, investment);
  return { id: ref.id, ...investment } as Investment;
}

export async function updateInvestment(
  investmentId: string,
  userId: string,
  values: Partial<InvestmentFormValues>
): Promise<void> {
  await updateDoc(doc(db, "investments", investmentId), {
    ...values,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeleteInvestment(
  investmentId: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, "investments", investmentId), {
    status: "deleted",
    deletedAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToInvestments(
  workspaceId: string,
  projectId: string | null,
  callback: (investments: Investment[]) => void
): Unsubscribe {
  let q;
  if (projectId) {
    q = query(
      collection(db, "investments"),
      where("workspaceId", "==", workspaceId),
      where("projectId", "==", projectId),
      where("status", "==", "active")
    );
  } else {
    q = query(
      collection(db, "investments"),
      where("workspaceId", "==", workspaceId),
      where("status", "==", "active")
    );
  }

  return onSnapshot(q, (snap) => {
    const investments = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Investment[];
    // Sort by date descending in client
    investments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    callback(investments);
  });
}
