"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Zap, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { workspaceSchema } from "@/lib/validations";
import { createWorkspace } from "@/lib/services/workspace";
import { useAuthStore } from "@/store";
import { CURRENCIES } from "@/types";

type WorkspaceValues = { name: string; defaultCurrency: string };

export default function CreateWorkspacePage() {
  const router = useRouter();
  const { user, workspace, loading, setWorkspace, setWorkspaceRole } =
    useAuthStore();
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && workspace) {
      router.replace("/dashboard");
    }
  }, [user, workspace, loading, router]);

  const form = useForm<WorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "", defaultCurrency: "USD" },
  });

  async function onSubmit(values: WorkspaceValues) {
    if (!user) return;
    setCreating(true);
    try {
      const ws = await createWorkspace(
        user.uid,
        values.name,
        values.defaultCurrency
      );
      setWorkspace(ws);
      setWorkspaceRole("owner");
      toast.success("Workspace created! Welcome to Appnatic.");
      router.replace("/dashboard");
    } catch {
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
              <Zap className="w-7 h-7 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">Set up your workspace</h1>
          <p className="text-sm text-muted-foreground">
            Create your private business OS. You can always change these settings later.
          </p>
        </div>

        {/* Form card */}
        <div className="bg-card border rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5 pb-5 border-b">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">New workspace</p>
              <p className="text-xs text-muted-foreground">
                Signed in as {user?.email}
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workspace name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g. My App Portfolio"
                        autoFocus
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The name of your business or portfolio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultCurrency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default currency</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((c) => (
                          <SelectItem key={c.code} value={c.code}>
                            {c.symbol} {c.name} ({c.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Used as the default for new projects
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={creating}
              >
                {creating && (
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                Create workspace
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
