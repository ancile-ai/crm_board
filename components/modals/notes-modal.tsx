"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import { MessageSquare, Plus, Edit, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent } from "@/components/ui/card"

interface Note {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

interface NotesModalProps {
  isOpen: boolean
  onClose: () => void
  opportunityId: string
  opportunityTitle: string
}

export function NotesModal({ isOpen, onClose, opportunityId, opportunityTitle }: NotesModalProps) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [editingNote, setEditingNote] = useState<string | null>(null)
  const [newNote, setNewNote] = useState("")
  const [editContent, setEditContent] = useState("")
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null)
  const { toast } = useToast()

  // Load notes
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/opportunities/${opportunityId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setNotes(data)
      }
    } catch (error) {
      console.error("Error loading notes:", error)
      toast({
        title: "Error",
        description: "Failed to load notes.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [opportunityId, toast])

  useEffect(() => {
    if (isOpen) {
      loadNotes()
    }
  }, [isOpen, loadNotes])

  // Add note
  const handleAddNote = async () => {
    if (!newNote.trim()) return

    try {
      console.log("Adding note:", { content: newNote.trim(), opportunityId })

      const response = await fetch(`/api/opportunities/${opportunityId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newNote.trim() }),
      })

      console.log("Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Note added successfully:", data)
        setNewNote("")
        loadNotes()
        toast({
          title: "Note added",
          description: "Your note has been added successfully.",
        })
      } else {
        const errorText = await response.text()
        console.error("API error response:", errorText)
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error("Error adding note:", error)
      toast({
        title: "Error",
        description: `Failed to add note. Please try again. ${error instanceof Error ? error.message : ''}`,
        variant: "destructive",
      })
    }
  }

  // Start editing note
  const handleEditStart = (note: Note) => {
    setEditingNote(note.id)
    setEditContent(note.content)
  }

  // Save edited note
  const handleEditSave = async (noteId: string) => {
    if (!editContent.trim()) return

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/comments/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })

      if (response.ok) {
        setEditingNote(null)
        setEditContent("")
        loadNotes()
        toast({
          title: "Note updated",
          description: "Your note has been updated successfully.",
        })
      } else {
        throw new Error('Failed to update note')
      }
    } catch (error) {
      console.error("Error updating note:", error)
      toast({
        title: "Error",
        description: "Failed to update note. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Delete note
  const handleDeleteNote = async () => {
    if (!deleteNoteId) return

    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/comments/${deleteNoteId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteNoteId(null)
        loadNotes()
        toast({
          title: "Note deleted",
          description: "The note has been deleted successfully.",
        })
      } else {
        throw new Error('Failed to delete note')
      }
    } catch (error) {
      console.error("Error deleting note:", error)
      toast({
        title: "Error",
        description: "Failed to delete note. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    }
    return email.split("@")[0].slice(0, 2).toUpperCase()
  }

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy 'at' h:mm a")
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Notes for {opportunityTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Add new note */}
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add a note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNewNote("")}
                      disabled={!newNote.trim()}
                    >
                      Clear
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNote.trim()}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Note
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes list */}
            <ScrollArea className="max-h-96">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading notes...
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No notes yet. Add the first note above.
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <Card key={note.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={note.user.image || undefined} alt={note.user.name || note.user.email} />
                              <AvatarFallback className="text-xs">
                                {getInitials(note.user.name, note.user.email)}
                              </AvatarFallback>
                            </Avatar>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-sm">
                                  {note.user.name || note.user.email}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {formatDateTime(note.createdAt)}
                                </Badge>
                              </div>

                              {editingNote === note.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="text-sm"
                                  />
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingNote(null)}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleEditSave(note.id)}
                                      disabled={!editContent.trim()}
                                    >
                                      Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {note.content}
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <div className="text-xs text-muted-foreground">
                                      {note.createdAt !== note.updatedAt && `Edited ${formatDateTime(note.updatedAt)}`}
                                    </div>
                                    <div className="flex gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditStart(note)}
                                        className="h-6 w-6 p-0"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDeleteNoteId(note.id)}
                                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNote} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
