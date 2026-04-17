"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/shared/LoadingSpinner";

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, workspace, loading } = useAuthStore();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (!workspace) {
      router.replace("/workspace/create");
      return;
    }
  }, [user, workspace, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  if (!user || !workspace) {
    return null;
  }

  return <AppLayout>{children}</AppLayout>;
}
