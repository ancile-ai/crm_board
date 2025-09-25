"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Filter,
  Search,
  Calendar,
  User,
  Clock,
  CheckSquare,
  Square,
  MoreVertical,
  Edit,
  Trash2,
  MessageSquare,
  Users,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { formatDistanceToNow, format, isBefore, isToday, isTomorrow } from "date-fns";
import { TodoComments } from "./todo-comments";

interface User {
  id: string;
  name?: string;
  email: string;
  role: 'USER' | 'MANAGER' | 'ADMIN';
}

interface Todo {
  id: string;
  title: string;
  description?: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  creator: {
    id: string;
    name?: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name?: string;
    email: string;
  };
  categories: {
    id: string;
    name: string;
    color: string;
  }[];
  collaborators: {
    role: 'VIEWER' | 'EDITOR' | 'OWNER';
    user: {
      id: string;
      name?: string;
      email: string;
    };
  }[];
  comments: {
    id: string;
    content: string;
    createdAt: string;
    user: {
      id: string;
      name?: string;
      email: string;
    };
  }[];
}

interface TodoListProps {
  className?: string;
}

export function TodoList({ className }: TodoListProps) {
  const { data: session } = useSession();
  const [todos, setTodos] = useState<Todo[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterCompleted, setFilterCompleted] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Create todo form state
  const [newTodoTitle, setNewTodoTitle] = useState("");
  const [newTodoDescription, setNewTodoDescription] = useState("");
  const [newTodoPriority, setNewTodoPriority] = useState<"HIGH" | "MEDIUM" | "LOW">("MEDIUM");
  const [newTodoDueDate, setNewTodoDueDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  });
  const [newTodoAssignedTo, setNewTodoAssignedTo] = useState("");

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchTodos = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterPriority !== "all") params.set("priority", filterPriority);
      if (filterAssignee !== "all") params.set("assignedTo", filterAssignee);
      if (filterCompleted !== "all") params.set("completed", filterCompleted);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const response = await fetch(`/api/todos?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setTodos(data);
      }
    } catch (error) {
      console.error("Error fetching todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const createTodo = async () => {
    if (!session || !newTodoTitle.trim()) return;

    try {
      const response = await fetch("/api/todos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTodoTitle,
          description: newTodoDescription,
          priority: newTodoPriority,
          dueDate: newTodoDueDate || null,
          assignedToId: newTodoAssignedTo === "unassigned" ? null : newTodoAssignedTo || null,
        }),
      });

      if (response.ok) {
        setNewTodoTitle("");
        setNewTodoDescription("");
        setNewTodoPriority("MEDIUM");
        setNewTodoDueDate(() => {
          const today = new Date();
          return today.toISOString().split('T')[0];
        });
        setNewTodoAssignedTo("");
        setIsCreateDialogOpen(false);
        fetchTodos();
      }
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  };

  const toggleTodoComplete = async (todoId: string, completed: boolean) => {
    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ completed }),
      });

      if (response.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error("Error updating todo:", error);
    }
  };

  const deleteTodo = async (todoId: string) => {
    if (!confirm("Are you sure you want to delete this todo?")) return;

    try {
      const response = await fetch(`/api/todos/${todoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTodos();
      }
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-700 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      default:
        return "bg-green-100 text-green-700 border-green-200";
    }
  };

  const getDueDateDisplay = (dueDate?: string) => {
    if (!dueDate) return null;

    const date = new Date(dueDate);
    const now = new Date();

    if (isBefore(date, now) && !isToday(date)) {
      return { text: format(date, "MMM d"), className: "text-red-600 font-medium" };
    } else if (isToday(date)) {
      return { text: "Today", className: "text-orange-600 font-medium" };
    } else if (isTomorrow(date)) {
      return { text: "Tomorrow", className: "text-blue-600 font-medium" };
    } else {
      return { text: format(date, "MMM d"), className: "text-gray-600" };
    }
  };

  useEffect(() => {
    if (session) {
      fetchUsers();
      fetchTodos();
    }
  }, [session]);

  useEffect(() => {
    fetchTodos();
  }, [filterPriority, filterAssignee, filterCompleted, searchQuery]);

  const filteredTodos = todos.filter((todo) => {
    // Add any additional client-side filtering here if needed
    return true;
  });

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Team Tasks</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={newTodoTitle}
                    onChange={(e) => setNewTodoTitle(e.target.value)}
                    placeholder="Enter task title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={newTodoDescription}
                    onChange={(e) => setNewTodoDescription(e.target.value)}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Priority</label>
                    <Select value={newTodoPriority} onValueChange={(value: any) => setNewTodoPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HIGH">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            High
                          </div>
                        </SelectItem>
                        <SelectItem value="MEDIUM">
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-yellow-600" />
                            Medium
                          </div>
                        </SelectItem>
                        <SelectItem value="LOW">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            Low
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Due Date *</label>
                    <Input
                      type="date"
                      value={newTodoDueDate}
                      onChange={(e) => setNewTodoDueDate(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Assign To</label>
                  <Select value={newTodoAssignedTo} onValueChange={setNewTodoAssignedTo}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          Unassigned
                        </div>
                      </SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <span className="text-xs">
                                {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0)?.toUpperCase()}
                              </span>
                            </Avatar>
                            {user.name || user.email}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTodo} disabled={!newTodoTitle.trim()}>
                    Create Task
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 w-48"
            />
          </div>
          <Select value={filterCompleted} onValueChange={setFilterCompleted}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="false">Active</SelectItem>
              <SelectItem value="true">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-8 w-32">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="p-6">
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : filteredTodos.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium">No tasks found</p>
              <p className="text-sm">Create your first task to get started!</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredTodos.map((todo) => {
                const dueDateDisplay = getDueDateDisplay(todo.dueDate);

                return (
                  <div
                    key={todo.id}
                    className="px-6 py-3 border-b border-border/50 hover:bg-muted/30 transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={(checked) => toggleTodoComplete(todo.id, !!checked)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4
                            className={`font-medium truncate ${
                              todo.completed ? "line-through text-muted-foreground" : ""
                            }`}
                          >
                            {todo.title}
                          </h4>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              onClick={() => deleteTodo(todo.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {todo.description && (
                          <p
                            className={`text-sm text-muted-foreground mb-2 line-clamp-2 ${
                              todo.completed ? "line-through" : ""
                            }`}
                          >
                            {todo.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`text-xs ${getPriorityColor(todo.priority)}`}
                          >
                            {todo.priority}
                          </Badge>

                          {todo.categories.map((category) => (
                            <Badge
                              key={category.id}
                              variant="outline"
                              className="text-xs"
                              style={{ borderColor: category.color, color: category.color }}
                            >
                              {category.name}
                            </Badge>
                          ))}

                          {dueDateDisplay && (
                            <div className={`flex items-center gap-1 text-xs ${dueDateDisplay.className}`}>
                              <Calendar className="h-3 w-3" />
                              {dueDateDisplay.text}
                            </div>
                          )}

                          {todo.assignedTo && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <AvatarImage asChild>
                                <Avatar className="h-4 w-4">
                                  <span className="text-xs">
                                    {todo.assignedTo.name?.charAt(0)?.toUpperCase() ||
                                     todo.assignedTo.email.charAt(0)?.toUpperCase()}
                                  </span>
                                </Avatar>
                              </AvatarImage>
                              <span>{todo.assignedTo.name || todo.assignedTo.email}</span>
                            </div>
                          )}

                          {todo.comments.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MessageSquare className="h-3 w-3" />
                              {todo.comments.length}
                            </div>
                          )}

                          <div className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(todo.createdAt), { addSuffix: true })}
                          </div>
                        </div>

                        {/* Comments Section */}
                        <TodoComments
                          todoId={todo.id}
                          className="mt-3 pt-3 border-t border-border/50"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
