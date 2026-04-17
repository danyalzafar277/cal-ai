"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

export default function RootPage() {
  const router = useRouter();
  const { user, loading, workspace } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
    } else if (!workspace) {
      router.replace("/workspace/create");
    } else {
      router.replace("/dashboard");
    }
  }, [user, loading, workspace, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Loading Appnatic…</p>
      </div>
    </div>
  );
}
