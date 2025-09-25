"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, Users, TrendingUp } from "lucide-react";

interface TodoStats {
  total: number;
  completed: number;
  overdue: number;
  totalAssigned: number;
  highPriorityActive: number;
  todayDue: number;
  avgCompletion: number;
}

interface TodoStatisticsProps {
  className?: string;
}

export function TodoStatistics({ className }: TodoStatisticsProps) {
  const { data: session } = useSession();
  const [stats, setStats] = useState<TodoStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  const fetchStats = async () => {
    try {
      // Fetch all todos to calculate statistics
      const allTodosRes = await fetch('/api/todos?completed=all&limit=1000');

      if (allTodosRes.ok) {
        const allTodos = await allTodosRes.json();

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const total = allTodos.length;
        const completed = allTodos.filter((todo: any) => todo.completed).length;
        const overdue = allTodos.filter((todo: any) => {
          if (todo.completed) return false;
          return todo.dueDate && new Date(todo.dueDate) < today;
        }).length;

        const totalAssigned = allTodos.filter((todo: any) => todo.assignedToId).length;
        const highPriorityActive = allTodos.filter((todo: any) =>
          !todo.completed && todo.priority === 'HIGH'
        ).length;

        const todayDue = allTodos.filter((todo: any) => {
          if (todo.completed) return false;
          return todo.dueDate &&
                 new Date(todo.dueDate).toDateString() === today.toDateString();
        }).length;

        setStats({
          total,
          completed,
          overdue,
          totalAssigned,
          highPriorityActive,
          todayDue,
          avgCompletion: 0 // Can implement later if needed
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Team Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-2 bg-muted rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className={className}>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Team Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load statistics</p>
        </CardContent>
      </Card>
    );
  }

  const completionRate = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Team Progress
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Completion */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Overall Completion</span>
            <span className="text-sm text-muted-foreground">
              {stats.completed}/{stats.total}
            </span>
          </div>
          <Progress value={completionRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completionRate.toFixed(0)}% complete
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Active Tasks */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
            <Clock className="h-6 w-6 text-blue-600" />
            <div>
              <p className="text-lg font-bold text-blue-700">{stats.total - stats.completed}</p>
              <p className="text-xs text-blue-600">Active Tasks</p>
            </div>
          </div>

          {/* High Priority */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 border border-red-200">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <p className="text-lg font-bold text-red-700">{stats.highPriorityActive}</p>
              <p className="text-xs text-red-600">High Priority</p>
            </div>
          </div>

          {/* Due Today */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
            <Clock className="h-6 w-6 text-orange-600" />
            <div>
              <p className="text-lg font-bold text-orange-700">{stats.todayDue}</p>
              <p className="text-xs text-orange-600">Due Today</p>
            </div>
          </div>

          {/* Completed */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <p className="text-lg font-bold text-green-700">{stats.completed}</p>
              <p className="text-xs text-green-600">Completed</p>
            </div>
          </div>
        </div>

        {/* Assignment Stats */}
        <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Team Collaboration</span>
          </div>
          <div className="text-sm text-purple-700">
            {stats.totalAssigned} of {stats.total} tasks assigned
          </div>
        </div>

        {/* Alerts */}
        {stats.overdue > 0 && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">
                {stats.overdue} overdue {stats.overdue === 1 ? 'task' : 'tasks'} need attention
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
