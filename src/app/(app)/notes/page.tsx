"use client";

import { useState, useMemo } from "react";
import { Plus, StickyNote, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { PageLoader } from "@/components/shared/LoadingSpinner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuthStore } from "@/store";
import { useProjects } from "@/hooks/useProjects";
import { useNotes } from "@/hooks/useNotes";
import { usePermissions } from "@/hooks/usePermissions";
import { createNote, updateNote, softDeleteNote } from "@/lib/services/notes";
import { logActivity } from "@/lib/services/activity";
import { noteSchema, type NoteFormValues } from "@/lib/validations";
import { formatRelative } from "@/lib/format";
import type { Note } from "@/types";

export default function NotesPage() {
  const { user, workspace } = useAuthStore();
  const { can } = usePermissions();
  const { projects } = useProjects(workspace?.id ?? null);
  const { notes, loading } = useNotes(workspace?.id ?? null);

  const [filterProject, setFilterProject] = useState("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Note | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const filtered = useMemo(() => {
    if (filterProject === "all") return notes;
    return notes.filter((n) => n.projectId === filterProject);
  }, [notes, filterProject]);

  const getProjectName = (id: string) =>
    projects.find((p) => p.id === id)?.name ?? "Unknown";

  const activeProjects = projects.filter((p) => p.status === "active");

  async function handleAdd(values: NoteFormValues) {
    if (!selectedProjectId) { toast.error("Please select a project"); return; }
    setSubmitting(true);
    try {
      const note = await createNote(workspace!.id, selectedProjectId, user!.uid, values);
      await logActivity(workspace!.id, user!.uid, user!.displayName ?? "", "note.created", "note", note.id, values.title, selectedProjectId);
      toast.success("Note added");
      setAddOpen(false);
      form.reset();
    } catch { toast.error("Failed to add note"); }
    finally { setSubmitting(false); }
  }

  async function handleEdit(values: NoteFormValues) {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateNote(editTarget.id, user!.uid, values);
      toast.success("Note updated");
      setEditTarget(null);
    } catch { toast.error("Failed to update note"); }
    finally { setSubmitting(false); }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await softDeleteNote(deleteTarget.id, user!.uid);
      toast.success("Note deleted");
      setDeleteTarget(null);
    } catch { toast.error("Failed to delete note"); }
  }

  const form = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "", tags: [] },
  });

  const editForm = useForm<NoteFormValues>({
    resolver: zodResolver(noteSchema),
    defaultValues: { title: "", content: "", tags: [] },
  });

  function openEdit(note: Note) {
    editForm.reset({ title: note.title, content: note.content, tags: note.tags });
    setEditTarget(note);
  }

  if (loading) return <PageLoader />;

  return (
    <>
      <PageHeader
        title="Notes"
        description={`${filtered.length} note${filtered.length !== 1 ? "s" : ""}`}
        icon={StickyNote}
        actions={
          can("note.create") && (
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              Add note
            </Button>
          )
        }
      />

      <div className="mb-4">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {activeProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.iconEmoji} {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {notes.length === 0 ? (
        <EmptyState
          icon={StickyNote}
          title="No notes yet"
          description="Add notes to capture ideas, decisions, and context for your projects."
          action={
            can("note.create")
              ? { label: "Add note", onClick: () => setAddOpen(true) }
              : undefined
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState icon={StickyNote} title="No notes for this project" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-sm line-clamp-1">
                    {note.title}
                  </h3>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {can("note.edit") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => openEdit(note)}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                    )}
                    {can("note.delete") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(note)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3 mb-3">
                  {note.content}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">
                    {getProjectName(note.projectId)}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {formatRelative(note.updatedAt)}
                  </span>
                </div>
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { if (!o) form.reset(); setAddOpen(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add note</DialogTitle>
          </DialogHeader>
          <div className="mb-4">
            <label className="text-sm font-medium mb-1.5 block">Project *</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                {activeProjects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.iconEmoji} {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <NoteFormInner form={form} onSubmit={handleAdd} loading={submitting} />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit note</DialogTitle>
          </DialogHeader>
          <NoteFormInner
            form={editForm}
            onSubmit={handleEdit}
            loading={submitting}
            submitLabel="Save changes"
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete note?"
        description="This note will be permanently removed."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        destructive
      />
    </>
  );
}

function NoteFormInner({
  form,
  onSubmit,
  loading,
  submitLabel = "Add note",
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  onSubmit: (v: NoteFormValues) => Promise<void>;
  loading: boolean;
  submitLabel?: string;
}) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }: { field: object }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Note title…" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="content"
          render={({ field }: { field: object }) => (
            <FormItem>
              <FormLabel>Content *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Write your note here…"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && (
            <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
          )}
          {submitLabel}
        </Button>
      </form>
    </Form>
  );
}
