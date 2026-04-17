"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  User,
  Settings,
  ChevronRight,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuthStore } from "@/store";
import { signOutUser } from "@/lib/firebase/auth";
import { getInitials } from "@/lib/utils";
import { toast } from "sonner";

function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  const labelMap: Record<string, string> = {
    dashboard: "Dashboard",
    projects: "Projects",
    investments: "Investments",
    revenue: "Revenue",
    transactions: "Transactions",
    recovery: "Recovery Analysis",
    reports: "Reports",
    notes: "Notes",
    settings: "Settings",
    new: "New Project",
  };

  return (
    <nav className="flex items-center gap-1 text-sm text-muted-foreground">
      <Home className="w-3.5 h-3.5" />
      {segments.map((seg, idx) => {
        const label = labelMap[seg] ?? seg;
        const isLast = idx === segments.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 opacity-50" />
            <span
              className={
                isLast ? "text-foreground font-medium" : "text-muted-foreground"
              }
            >
              {label.length > 24 ? label.slice(0, 22) + "…" : label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}

export function Header() {
  const router = useRouter();
  const { user, workspace } = useAuthStore();

  async function handleSignOut() {
    try {
      await signOutUser();
      router.replace("/login");
    } catch {
      toast.error("Failed to sign out");
    }
  }

  return (
    <header className="sticky top-0 z-30 h-14 bg-background/95 backdrop-blur-md border-b flex items-center justify-between px-6 gap-4">
      <Breadcrumb />

      <div className="flex items-center gap-2 ml-auto">
        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={user?.photoURL ?? undefined}
                  alt={user?.displayName ?? ""}
                />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.displayName ?? user?.email ?? "U")}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block max-w-[120px] truncate">
                {user?.displayName ?? user?.email ?? "User"}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col">
                <span className="font-semibold text-sm">
                  {user?.displayName ?? "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspace && (
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                <span className="truncate">{workspace.name}</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings")}>
              <Settings className="w-4 h-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
