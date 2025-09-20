"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, ChevronRight, Plus, MessageSquare, RefreshCw, Edit, Trash2, Trash } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  type: 'opportunity_created' | 'opportunity_edited' | 'opportunity_deleted' | 'comment_added' | 'comment_deleted';
  timestamp: string;
  opportunity: {
    id: string;
    title: string;
    agency: string;
  };
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  content: string;
}

interface RecentActivitiesProps {
  className?: string;
}

export function RecentActivities({ className }: RecentActivitiesProps) {
  const { data: session } = useSession();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchActivities = async () => {
    if (!session) return;

    setLoading(true);
    try {
      const response = await fetch('/api/activities?limit=50');
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearActivities = async () => {
    if (!session) return;

    try {
      const response = await fetch('/api/activities', { method: 'POST' });
      if (response.ok) {
        // Refresh activities after clearing
        await fetchActivities();
      }
    } catch (error) {
      console.error('Error clearing activities:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchActivities();

      // Refresh activities every 10 seconds for more real-time updates
      const interval = setInterval(fetchActivities, 10000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'opportunity_created':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'opportunity_edited':
        return <Edit className="h-4 w-4 text-orange-600" />;
      case 'opportunity_deleted':
      case 'comment_deleted':
        return <Trash2 className="h-4 w-4 text-red-600" />;
      case 'comment_added':
        return <MessageSquare className="h-4 w-4 text-blue-600" />;
      default:
        return <Plus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    const userName = activity.user?.name || activity.user?.email || 'Unknown User';

    switch (activity.type) {
      case 'opportunity_created':
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{userName} added opportunity</p>
            <p className="text-sm text-muted-foreground truncate">
              "{activity.opportunity.title}"
            </p>
          </div>
        );
      case 'opportunity_edited':
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{userName} edited opportunity</p>
            <p className="text-sm text-muted-foreground truncate">
              "{activity.opportunity.title}"
            </p>
          </div>
        );
      case 'opportunity_deleted':
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{userName} deleted opportunity</p>
            <p className="text-sm text-muted-foreground truncate">
              "{activity.opportunity.title}"
            </p>
          </div>
        );
      case 'comment_deleted':
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{userName} deleted comment on</p>
            <p className="text-sm text-muted-foreground truncate">
              "{activity.opportunity.title}"
            </p>
          </div>
        );
      case 'comment_added':
        return (
          <div className="space-y-1">
            <p className="text-sm font-medium">{userName} commented on</p>
            <p className="text-sm text-muted-foreground truncate">
              "{activity.opportunity.title}"
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {activity.content}
            </p>
          </div>
        );
      default:
        return <p className="text-sm">Unknown activity</p>;
    }
  };

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
          isOpen ? 'w-80' : 'w-0'
        }`}
      >
        <Card className="h-full rounded-none border-0 border-l">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Activities</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearActivities}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                  title="Clear activities"
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchActivities}
                  disabled={loading}
                  className="h-8 w-8 p-0"
                  title="Refresh activities"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 h-full overflow-hidden">
            <ScrollArea className="h-full">
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="w-8 h-8 bg-muted rounded animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded animate-pulse" />
                        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                      </div>
                      <div className="w-16 h-3 bg-muted rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                    >
                      <div className="w-8 h-8 rounded-full bg-background border flex items-center justify-center mt-0.5">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        {getActivityText(activity)}
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatTimestamp(activity.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
