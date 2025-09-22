"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RecentActivities } from "@/components/dashboard/recent-activities";

export function DashboardClient() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Still loading

    if (!session || !session.user) {
      console.log("Dashboard: No session found, redirecting to login");
      router.push("/login");
      return;
    }

    console.log("Dashboard: User authenticated:", session.user.email);
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session || !session.user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-muted-foreground mb-4">Access Denied</h2>
          <p className="text-muted-foreground">Please log in to access this page</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background grid grid-rows-[auto_1fr] relative">
      <DashboardHeader user={session.user} />
      <main className="w-full min-h-0 overflow-hidden">
        <KanbanBoard />
      </main>
      <RecentActivities />
    </div>
  );
}
