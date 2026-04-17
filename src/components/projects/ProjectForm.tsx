"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { projectSchema, type ProjectFormValues } from "@/lib/validations";
import {
  PROJECT_TYPES,
  PROJECT_PLATFORMS,
  PROJECT_COLOR_TAGS,
  CURRENCIES,
  type Project,
} from "@/types";
import { cn } from "@/lib/utils";

interface ProjectFormProps {
  onSubmit: (values: ProjectFormValues) => Promise<void>;
  defaultValues?: Partial<ProjectFormValues>;
  submitLabel?: string;
  loading?: boolean;
}

const EMOJI_OPTIONS = [
  "📦","🚀","💡","🎯","📱","🌐","🔧","⚡","🎨","🤖",
  "🌙","📊","💰","🔮","🎪","🏗️","🌿","🔥","⭐","🎭",
];

export function ProjectForm({
  onSubmit,
  defaultValues,
  submitLabel = "Create project",
  loading = false,
}: ProjectFormProps) {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      type: "",
      description: "",
      iconEmoji: "📦",
      colorTag: "#16A34A",
      launchDate: "",
      platforms: [],
      currency: "USD",
      targetRecoveryAmount: 0,
      targetMonthlyRevenue: 0,
      tags: [],
      ...defaultValues,
    },
  });

  const selectedPlatforms = form.watch("platforms") ?? [];

  function togglePlatform(platform: string) {
    const current = form.getValues("platforms") ?? [];
    if (current.includes(platform)) {
      form.setValue(
        "platforms",
        current.filter((p) => p !== platform)
      );
    } else {
      form.setValue("platforms", [...current, platform]);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Name + Emoji row */}
        <div className="flex gap-3">
          <FormField
            control={form.control}
            name="iconEmoji"
            render={({ field }) => (
              <FormItem className="w-24 flex-shrink-0">
                <FormLabel>Icon</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="text-lg">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <div className="grid grid-cols-5 gap-1 p-2">
                      {EMOJI_OPTIONS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            field.onChange(emoji);
                          }}
                          className="text-xl p-1 rounded hover:bg-muted transition-colors"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Project name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Muslim Prayer App" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Type + Currency */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Project type *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROJECT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.symbol} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of this project…"
                  className="resize-none"
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Color tag */}
        <FormField
          control={form.control}
          name="colorTag"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Color tag</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_COLOR_TAGS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => field.onChange(color)}
                      className={cn(
                        "w-7 h-7 rounded-full border-2 transition-transform hover:scale-110",
                        field.value === color
                          ? "border-foreground scale-110"
                          : "border-transparent"
                      )}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Platforms */}
        <FormField
          control={form.control}
          name="platforms"
          render={() => (
            <FormItem>
              <FormLabel>Platforms</FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-2">
                  {PROJECT_PLATFORMS.map((platform) => (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => togglePlatform(platform)}
                      className={cn(
                        "px-3 py-1 text-xs rounded-full border transition-colors",
                        selectedPlatforms.includes(platform)
                          ? "bg-primary text-white border-primary"
                          : "border-input text-muted-foreground hover:border-primary/50"
                      )}
                    >
                      {platform}
                    </button>
                  ))}
                </div>
              </FormControl>
            </FormItem>
          )}
        />

        {/* Financial targets */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="targetRecoveryAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target recovery</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormDescription>Total amount to recover</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetMonthlyRevenue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly revenue goal</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormDescription>Monthly revenue target</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Launch date */}
        <FormField
          control={form.control}
          name="launchDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Launch date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
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
