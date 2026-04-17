"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, workspace, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (user && workspace) {
      router.replace("/dashboard");
    } else if (user && !workspace) {
      router.replace("/workspace/create");
    }
  }, [user, workspace, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">{children}</div>
    </div>
  );
}
