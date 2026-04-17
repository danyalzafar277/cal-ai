import { Timestamp } from "firebase/firestore";

// ─── User & Auth ──────────────────────────────────────────────────────────────

export type UserRole = "owner" | "admin" | "editor" | "viewer";

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  role: UserRole;
  invitedBy: string | null;
  joinedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ─── Workspace ────────────────────────────────────────────────────────────────

export interface Workspace {
  id: string;
  name: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  defaultCurrency: string;
  dateFormat: string;
  notificationsEnabled: boolean;
  defaultCategories: string[];
  defaultRevenueSources: string[];
  defaultPlatforms: string[];
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export type ProjectType =
  | "Islamic App"
  | "AI App"
  | "Photo Editor"
  | "Utility App"
  | "SaaS App"
  | "Experiment"
  | "Digital Product"
  | "Future Idea"
  | "Other";

export type ProjectStatus = "active" | "archived" | "deleted";

export const PROJECT_TYPES: ProjectType[] = [
  "Islamic App",
  "AI App",
  "Photo Editor",
  "Utility App",
  "SaaS App",
  "Experiment",
  "Digital Product",
  "Future Idea",
  "Other",
];

export const PROJECT_PLATFORMS = [
  "iOS",
  "Android",
  "Web",
  "Desktop",
  "API",
  "Chrome Extension",
  "Other",
];

export const PROJECT_COLOR_TAGS = [
  "#16A34A", // green
  "#2563EB", // blue
  "#7C3AED", // violet
  "#DC2626", // red
  "#D97706", // amber
  "#0891B2", // cyan
  "#BE185D", // pink
  "#059669", // emerald
  "#6366F1", // indigo
  "#78716C", // stone
];

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  type: ProjectType;
  description: string;
  iconUrl: string | null;
  iconEmoji: string;
  colorTag: string;
  status: ProjectStatus;
  launchDate: string | null;
  platforms: string[];
  currency: string;
  targetRecoveryAmount: number;
  targetMonthlyRevenue: number;
  tags: string[];
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  archivedAt: Timestamp | null;
  deletedAt: Timestamp | null;
}

// ─── Investments ──────────────────────────────────────────────────────────────

export type RecordStatus = "active" | "deleted";

export interface Investment {
  id: string;
  workspaceId: string;
  projectId: string;
  platform: string;
  category: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: string;
  note: string;
  receiptUrl: string | null;
  status: RecordStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

// ─── Revenues ─────────────────────────────────────────────────────────────────

export interface Revenue {
  id: string;
  workspaceId: string;
  projectId: string;
  source: string;
  platform: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: string;
  reference: string;
  note: string;
  status: RecordStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

// ─── Notes ────────────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  workspaceId: string;
  projectId: string;
  title: string;
  content: string;
  tags: string[];
  status: RecordStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt: Timestamp | null;
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export type ActivityAction =
  | "project.created"
  | "project.updated"
  | "project.archived"
  | "project.restored"
  | "project.deleted"
  | "project.reset"
  | "project.duplicated"
  | "investment.created"
  | "investment.updated"
  | "investment.deleted"
  | "revenue.created"
  | "revenue.updated"
  | "revenue.deleted"
  | "note.created"
  | "note.updated"
  | "note.deleted";

export interface ActivityLog {
  id: string;
  workspaceId: string;
  projectId: string | null;
  userId: string;
  userDisplayName: string;
  action: ActivityAction;
  entityType: "project" | "investment" | "revenue" | "note";
  entityId: string;
  entityName: string;
  createdAt: Timestamp;
}

// ─── Metrics ──────────────────────────────────────────────────────────────────

export interface ProjectMetrics {
  totalInvestment: number;
  totalRevenue: number;
  netProfitLoss: number;
  recoveryPercent: number;
  remainingToRecover: number;
  roiPercent: number;
  investmentCount: number;
  revenueCount: number;
}

export interface CompanyMetrics {
  totalProjects: number;
  activeProjects: number;
  archivedProjects: number;
  totalInvestment: number;
  totalRevenue: number;
  netProfitLoss: number;
  recoveryPercent: number;
  bestProject: { name: string; netProfitLoss: number } | null;
  worstProject: { name: string; netProfitLoss: number } | null;
}

// ─── Transactions (combined view) ─────────────────────────────────────────────

export type TransactionType = "investment" | "revenue";

export interface Transaction {
  id: string;
  type: TransactionType;
  projectId: string;
  projectName: string;
  platform: string;
  categoryOrSource: string;
  amount: number;
  currency: string;
  date: string;
  paymentMethod: string;
  note: string;
  status: RecordStatus;
  createdBy: string;
  createdAt: Timestamp;
}

// ─── Date Range ───────────────────────────────────────────────────────────────

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

// ─── Permissions ──────────────────────────────────────────────────────────────

export type Permission =
  | "project.create"
  | "project.edit"
  | "project.archive"
  | "project.delete"
  | "project.reset"
  | "project.duplicate"
  | "investment.create"
  | "investment.edit"
  | "investment.delete"
  | "revenue.create"
  | "revenue.edit"
  | "revenue.delete"
  | "note.create"
  | "note.edit"
  | "note.delete"
  | "settings.manage"
  | "members.manage"
  | "export.data";

export const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
];

export const PAYMENT_METHODS = [
  "Credit Card",
  "Debit Card",
  "Bank Transfer",
  "PayPal",
  "Stripe",
  "Cash",
  "Crypto",
  "Other",
];

export const DEFAULT_INVESTMENT_CATEGORIES = [
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
];

export const DEFAULT_REVENUE_SOURCES = [
  "App Store",
  "Play Store",
  "Subscriptions",
  "One-time Purchase",
  "Ads",
  "Sponsorship",
  "Consulting",
  "Affiliate",
  "Other",
];
