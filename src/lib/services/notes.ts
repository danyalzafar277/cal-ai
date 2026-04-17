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
import type { Note } from "@/types";
import type { NoteFormValues } from "@/lib/validations";

export async function createNote(
  workspaceId: string,
  projectId: string,
  userId: string,
  values: NoteFormValues
): Promise<Note> {
  const ref = doc(collection(db, "notes"));
  const now = serverTimestamp() as Timestamp;

  const note: Omit<Note, "id"> = {
    workspaceId,
    projectId,
    title: values.title,
    content: values.content,
    tags: values.tags ?? [],
    status: "active",
    createdBy: userId,
    updatedBy: userId,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await setDoc(ref, note);
  return { id: ref.id, ...note } as Note;
}

export async function updateNote(
  noteId: string,
  userId: string,
  values: Partial<NoteFormValues>
): Promise<void> {
  await updateDoc(doc(db, "notes", noteId), {
    ...values,
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export async function softDeleteNote(
  noteId: string,
  userId: string
): Promise<void> {
  await updateDoc(doc(db, "notes", noteId), {
    status: "deleted",
    deletedAt: serverTimestamp(),
    updatedBy: userId,
    updatedAt: serverTimestamp(),
  });
}

export function subscribeToNotes(
  workspaceId: string,
  projectId: string | null,
  callback: (notes: Note[]) => void
): Unsubscribe {
  let q;
  if (projectId) {
    q = query(
      collection(db, "notes"),
      where("workspaceId", "==", workspaceId),
      where("projectId", "==", projectId),
      where("status", "==", "active")
    );
  } else {
    q = query(
      collection(db, "notes"),
      where("workspaceId", "==", workspaceId),
      where("status", "==", "active")
    );
  }

  return onSnapshot(q, (snap) => {
    const notes = snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    })) as Note[];
    notes.sort(
      (a, b) =>
        (b.updatedAt?.toMillis?.() ?? 0) - (a.updatedAt?.toMillis?.() ?? 0)
    );
    callback(notes);
  });
}
