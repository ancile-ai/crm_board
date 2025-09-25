"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TodoComment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

interface TodoCommentsProps {
  todoId: string;
  className?: string;
}

export function TodoComments({ todoId, className }: TodoCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<TodoComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (session && todoId) {
      fetchComments();
    }
  }, [session, todoId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/todos/${todoId}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !session) return;

    setSubmitting(true);
    try {
      const response = await fetch(`/api/todos/${todoId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment();
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
          <MessageSquare className="h-4 w-4 mr-2" />
          Add comment + details
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full justify-between text-muted-foreground hover:text-foreground"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comments ({comments.length})
          </div>
          {isExpanded ? "−" : "+"}
        </Button>

        {isExpanded && (
          <>
            {comments.length > 0 && (
              <ScrollArea className="max-h-40">
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {comment.user.name?.charAt(0)?.toUpperCase() ||
                           comment.user.email.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {comment.user.name || comment.user.email}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-sm break-words leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Add Comment Input */}
            <div className="flex gap-2 pt-2 border-t">
              <div className="flex-1">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a comment..."
                  className="text-sm"
                  disabled={submitting}
                />
              </div>
              <Button
                size="sm"
                onClick={addComment}
                disabled={!newComment.trim() || submitting}
                className="px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
