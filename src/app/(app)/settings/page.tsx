"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Settings, Save, Users, Database } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuthStore } from "@/store";
import { usePermissions } from "@/hooks/usePermissions";
import { updateWorkspace, getWorkspaceMembers } from "@/lib/services/workspace";
import { settingsSchema, type SettingsFormValues } from "@/lib/validations";
import { CURRENCIES } from "@/types";
import { getRoleLabel, getRoleBadgeColor } from "@/lib/permissions";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect } from "react";
import type { WorkspaceMember } from "@/types";

export default function SettingsPage() {
  const { workspace, setWorkspace } = useAuthStore();
  const { can, role } = usePermissions();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [saving, setSaving] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      workspaceName: workspace?.name ?? "",
      defaultCurrency: workspace?.defaultCurrency ?? "USD",
      dateFormat: workspace?.dateFormat ?? "MMM d, yyyy",
      notificationsEnabled: workspace?.notificationsEnabled ?? true,
    },
  });

  useEffect(() => {
    if (workspace?.id) {
      getWorkspaceMembers(workspace.id).then(setMembers).catch(() => {});
    }
  }, [workspace?.id]);

  async function onSubmit(values: SettingsFormValues) {
    if (!workspace) return;
    setSaving(true);
    try {
      await updateWorkspace(workspace.id, {
        name: values.workspaceName,
        defaultCurrency: values.defaultCurrency,
        dateFormat: values.dateFormat,
        notificationsEnabled: values.notificationsEnabled,
      });
      setWorkspace({ ...workspace, ...values, name: values.workspaceName });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your workspace configuration"
        icon={Settings}
      />

      <div className="max-w-2xl space-y-6">
        {/* Workspace settings */}
        {can("settings.manage") ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Workspace</CardTitle>
              <CardDescription>
                Configure your workspace defaults
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="workspaceName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
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
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="notificationsEnabled"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3">
                        <div>
                          <FormLabel className="mb-0">Notifications</FormLabel>
                          <FormDescription>
                            Receive alerts for key events
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={saving}>
                    {saving && (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    <Save className="w-4 h-4" />
                    Save settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              You don&apos;t have permission to edit workspace settings.
            </CardContent>
          </Card>
        )}

        {/* Members */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Workspace members
            </CardTitle>
            <CardDescription>
              People with access to this workspace
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {members.length === 0 ? (
              <p className="px-6 py-4 text-sm text-muted-foreground">
                No members found
              </p>
            ) : (
              <div className="divide-y">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 px-6 py-3"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.photoURL ?? undefined} />
                      <AvatarFallback className="text-xs">
                        {getInitials(member.displayName || member.email || "U")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {member.displayName || member.email}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.email}
                      </p>
                    </div>
                    <Badge className={getRoleBadgeColor(member.role)}>
                      {getRoleLabel(member.role)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="w-4 h-4" />
              Workspace info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Workspace ID</span>
              <code className="text-xs bg-muted px-2 py-0.5 rounded">
                {workspace?.id}
              </code>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Your role</span>
              {role && (
                <Badge className={getRoleBadgeColor(role)}>
                  {getRoleLabel(role)}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
