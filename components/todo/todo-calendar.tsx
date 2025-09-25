"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Calendar, Clock, User, CheckSquare } from "lucide-react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  completed: boolean;
  assignedTo?: {
    id: string;
    name?: string;
    email: string;
  };
  creator: {
    id: string;
    name?: string;
    email: string;
  };
}

interface TodoCalendarProps {
  className?: string;
}

export function TodoCalendar({ className }: TodoCalendarProps) {
  const { data: session } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const fetchTodosForMonth = async (date: Date) => {
    if (!session) return;

    setLoading(true);
    try {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const fromDate = format(monthStart, 'yyyy-MM-dd');
      const toDate = format(monthEnd, 'yyyy-MM-dd');

      const response = await fetch(`/api/todos?completed=false`);
      if (response.ok) {
        const data = await response.json();
        // Filter for todos in the current month + some buffer days
        const relevantTodos = data.filter((todo: Todo) => {
          if (!todo.dueDate) return false;
          const todoDate = new Date(todo.dueDate);
          return todoDate >= startOfWeek(monthStart) && todoDate <= endOfWeek(monthEnd);
        });
        setTodos(relevantTodos);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodosForMonth(currentDate);
  }, [currentDate, session]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH": return "bg-red-500";
      case "MEDIUM": return "bg-yellow-500";
      default: return "bg-green-500";
    }
  };

  const getTodosForDate = (date: Date) => {
    return todos.filter(todo => {
      if (!todo.dueDate) return false;
      const todoDate = new Date(todo.dueDate);
      return isSameDay(todoDate, date);
    });
  };

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const dateFormat = "d";
    const weeks = [];
    let days = [];
    let day = calendarStart;

    while (day <= calendarEnd) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayTodos = getTodosForDate(cloneDay);

        days.push(
          <div
            key={day.toString()}
            className={`h-16 p-1 border border-border/50 hover:bg-muted/30 transition-colors ${
              !isSameMonth(day, currentDate) ? "text-muted-foreground bg-muted/20" : ""
            }`}
          >
            <div className="text-xs font-medium mb-1">
              {format(day, dateFormat)}
            </div>
            {!isSameMonth(day, currentDate) ? null : (
              <div className="space-y-1">
                {dayTodos.slice(0, 2).map((todo) => (
                  <div
                    key={todo.id}
                    className={`text-xs px-1 py-0.5 rounded text-white truncate ${getPriorityColor(todo.priority)}`}
                    title={`${todo.title}${todo.assignedTo ? ` (${todo.assignedTo.name || todo.assignedTo.email})` : ''}`}
                  >
                    {todo.title}
                  </div>
                ))}
                {dayTodos.length > 2 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayTodos.length - 2} more
                  </div>
                )}
              </div>
            )}
          </div>
        );
        day = addDays(day, 1);
      }
      weeks.push(
        <div key={day.toString()} className="grid grid-cols-7">
          {days}
        </div>
      );
      days = [];
    }
    return weeks;
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Task Calendar</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-32 text-center">
              {format(currentDate, "MMMM yyyy")}
            </span>
            <Button variant="outline" size="sm" onClick={goToNextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="px-6">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-xs font-medium text-muted-foreground text-center py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="border rounded-lg overflow-hidden">
            {renderCalendar()}
          </div>
        </div>

        {/* Today's tasks */}
        <div className="mt-6 px-6">
          <h3 className="text-sm font-medium mb-3">Today</h3>
          <ScrollArea className="max-h-40">
            {loading ? (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {getTodosForDate(new Date()).length === 0 ? (
                  <p className="text-sm text-muted-foreground">No tasks due today</p>
                ) : (
                  getTodosForDate(new Date()).map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-2 p-2 rounded border border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <CheckSquare className={`h-3 w-3 ${todo.completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${todo.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {todo.title}
                        </p>
                        {todo.assignedTo && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <User className="h-2 w-2" />
                            <span>{todo.assignedTo.name || todo.assignedTo.email}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(todo.priority)} text-white border-0`}>
                        {todo.priority}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  );
}
