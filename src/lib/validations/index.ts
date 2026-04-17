import { z } from "zod";

// ─── Workspace ────────────────────────────────────────────────────────────────

export const workspaceSchema = z.object({
  name: z.string().min(2, "Workspace name must be at least 2 characters").max(60),
  defaultCurrency: z.string().min(3).max(3),
});

// ─── Project ──────────────────────────────────────────────────────────────────

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(80),
  type: z.string().min(1, "Project type is required"),
  description: z.string().max(500).optional().default(""),
  iconEmoji: z.string().max(10).optional().default("📦"),
  colorTag: z.string().optional().default("#16A34A"),
  launchDate: z.string().optional().default(""),
  platforms: z.array(z.string()).optional().default([]),
  currency: z.string().min(3).max(3),
  targetRecoveryAmount: z.coerce
    .number()
    .min(0, "Must be 0 or more")
    .optional()
    .default(0),
  targetMonthlyRevenue: z.coerce
    .number()
    .min(0, "Must be 0 or more")
    .optional()
    .default(0),
  tags: z.array(z.string()).optional().default([]),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

// ─── Investment ───────────────────────────────────────────────────────────────

export const investmentSchema = z.object({
  platform: z.string().min(1, "Platform is required").max(80),
  category: z.string().min(1, "Category is required").max(80),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().optional().default(""),
  note: z.string().max(500).optional().default(""),
});

export type InvestmentFormValues = z.infer<typeof investmentSchema>;

// ─── Revenue ──────────────────────────────────────────────────────────────────

export const revenueSchema = z.object({
  source: z.string().min(1, "Source is required").max(80),
  platform: z.string().min(1, "Platform is required").max(80),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  currency: z.string().min(3).max(3),
  date: z.string().min(1, "Date is required"),
  paymentMethod: z.string().optional().default(""),
  reference: z.string().max(120).optional().default(""),
  note: z.string().max(500).optional().default(""),
});

export type RevenueFormValues = z.infer<typeof revenueSchema>;

// ─── Note ─────────────────────────────────────────────────────────────────────

export const noteSchema = z.object({
  title: z.string().min(1, "Title is required").max(120),
  content: z.string().min(1, "Content is required").max(5000),
  tags: z.array(z.string()).optional().default([]),
});

export type NoteFormValues = z.infer<typeof noteSchema>;

// ─── Settings ─────────────────────────────────────────────────────────────────

export const settingsSchema = z.object({
  workspaceName: z.string().min(2).max(60),
  defaultCurrency: z.string().min(3).max(3),
  dateFormat: z.string(),
  notificationsEnabled: z.boolean(),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;
