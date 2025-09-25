"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, Activity, CheckSquare, Calendar, List, BarChart3 } from "lucide-react";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { TodoList } from "@/components/todo/todo-list";
import { TodoCalendar } from "@/components/todo/todo-calendar";
import { TodoStatistics } from "@/components/todo/todo-statistics";

interface DashboardSidebarProps {
  className?: string;
}

export function DashboardSidebar({ className }: DashboardSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button - Always Visible */}
      <Button
        variant="outline"
        size="default"
        className="fixed right-4 top-20 bg-white border-2 border-primary shadow-2xl hover:shadow-3xl hover:bg-gray-50 transition-all duration-200 rounded-full p-3 z-[101]"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <ChevronRight className="h-5 w-5 text-primary" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-primary" />
        )}
      </Button>

      {/* Side Panel */}
      <div
        className={`fixed right-0 top-16 bottom-0 z-[100] transition-all duration-300 overflow-hidden ${
          isOpen ? 'w-64 md:w-80 lg:w-[20%]': 'w-0'
        }`}
      >
        <Card className="h-full rounded-none border-0 border-l">
          <Tabs defaultValue="list" className="h-full">
            <TabsList className="grid w-full grid-cols-4 mx-6 mt-6">
              <TabsTrigger value="list" className="flex items-center gap-1 text-xs">
                <List className="h-3 w-3" />
                List
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-1 text-xs">
                <Calendar className="h-3 w-3" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="stats" className="flex items-center gap-1 text-xs">
                <BarChart3 className="h-3 w-3" />
                Stats
              </TabsTrigger>
              <TabsTrigger value="activities" className="flex items-center gap-1 text-xs">
                <Activity className="h-3 w-3" />
                Activity
              </TabsTrigger>
            </TabsList>
            <TabsContent value="list" className="m-0 h-full">
              <div className="h-full">
                <TodoList className="h-full" />
              </div>
            </TabsContent>
            <TabsContent value="calendar" className="m-0 h-full">
              <div className="h-full">
                <TodoCalendar className="h-full" />
              </div>
            </TabsContent>
            <TabsContent value="stats" className="m-0 h-full">
              <div className="h-full px-6 pb-6">
                <TodoStatistics className="h-full pt-4" />
              </div>
            </TabsContent>
            <TabsContent value="activities" className="m-0 h-full px-6 pb-6">
              <RecentActivities className="h-full pt-4" />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </>
  );
}
