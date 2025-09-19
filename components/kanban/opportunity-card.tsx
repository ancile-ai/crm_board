"use client"

import { useState, memo } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format, differenceInDays } from "date-fns"
import {
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  GripVertical,
  Building2,
  Calendar,
  DollarSign
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"

interface Opportunity {
  id: string
  title: string
  agency: string
  contractVehicle: string
  solicitationNumber?: string
  estimatedValueMin?: number
  estimatedValueMax?: number
  dueDate?: Date
  currentStageId: string
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT"
  probability: number
  opportunityType: "RFP" | "RFI" | "RFQ" | "SOURCES_SOUGHT" | "BAA" | "SBIR_STTR" | "OTHER"
  technicalFocus: string[]
}

interface OpportunityCardProps {
  opportunity: Opportunity
  onMove?: (opportunityId: string, newStageId: string) => void
  onEdit?: (opportunityId: string) => void
  onDelete?: (opportunityId: string) => void
  index: number
  onKeyboardMove?: (opportunityId: string, direction: 'up' | 'down' | 'left' | 'right') => void
}

function ActionMenu({
  opportunityId,
  onEdit,
  onDelete,
  isOpen,
  onOpenChange,
}: {
  opportunityId: string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { toast } = useToast()

  const handleDelete = () => {
    onDelete?.(opportunityId)
    setShowDeleteDialog(false)
    toast({
      title: "Opportunity deleted",
      description: "The opportunity has been removed from your pipeline.",
    })
  }

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0"
            onPointerDown={(e) => {
              // Prevent drag start when clicking the menu button
              e.stopPropagation()
            }}
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit?.(opportunityId)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete opportunity?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the opportunity from your pipeline.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function OpportunityCard({
  opportunity,
  onEdit,
  onDelete,
  index,
  onKeyboardMove,
}: OpportunityCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case "URGENT": return "destructive"
      case "HIGH": return "default"
      case "MEDIUM": return "secondary"
      default: return "outline"
    }
  }

  const getDueDateInfo = () => {
    if (!opportunity.dueDate) return null

    const days = differenceInDays(opportunity.dueDate, new Date())
    const isOverdue = days < 0
    const isUrgent = days <= 7 && days >= 0

    return {
      days,
      isOverdue,
      isUrgent,
      text: isOverdue
        ? `${Math.abs(days)} days overdue`
        : days === 0
        ? "Due today"
        : `${days} day${days === 1 ? '' : 's'} left`,
      variant: isOverdue ? "destructive" : isUrgent ? "default" : "outline"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onKeyboardMove) return

    const isModifier = e.ctrlKey || e.metaKey

    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        onKeyboardMove(opportunity.id, 'up')
        break
      case 'ArrowDown':
        e.preventDefault()
        onKeyboardMove(opportunity.id, 'down')
        break
      case 'ArrowLeft':
        if (isModifier) {
          e.preventDefault()
          onKeyboardMove(opportunity.id, 'left')
        }
        break
      case 'ArrowRight':
        if (isModifier) {
          e.preventDefault()
          onKeyboardMove(opportunity.id, 'right')
        }
        break
    }
  }

  const dueDateInfo = getDueDateInfo()

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: opportunity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        willChange: isDragging ? 'transform' : undefined,
      }}
      {...attributes}
      {...listeners}
      className={`
        group bg-card border rounded-lg p-4 shadow-sm
        cursor-grab active:cursor-grabbing select-none
        ${isDragging
          ? "shadow-2xl scale-105 border-primary/50 bg-gradient-to-br from-blue-50 to-indigo-50 rotate-1 z-50"
          : `${!isDragging ? 'hover:shadow-lg transition-all duration-200' : ''}`}
      `}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="button"
      aria-label={`Opportunity: ${opportunity.title}. Drag to move between stages.`}
    >
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2 mb-2">
                {opportunity.title}
              </h3>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3" />
                <span className="truncate">{opportunity.agency}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Badge variant={getPriorityVariant(opportunity.priority) as any} className="text-xs">
                {opportunity.priority}
              </Badge>

              <div
                className={`transition-opacity duration-200 ${
                  isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                data-no-dnd="true"
              >
                <ActionMenu
                  opportunityId={opportunity.id}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  isOpen={isMenuOpen}
                  onOpenChange={setIsMenuOpen}
                />
              </div>
            </div>
          </div>

          {/* Due Date */}
          {dueDateInfo && (
            <div className="flex items-center gap-2 mb-3 text-xs">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">
                {format(opportunity.dueDate!, "MMM d")}
              </span>
              <Badge variant={dueDateInfo.variant as any} className="text-xs h-5">
                {dueDateInfo.text}
              </Badge>
            </div>
          )}

          {/* Value */}
          {opportunity.estimatedValueMax && (
            <div className="flex items-center gap-2 mb-3 text-xs">
              <DollarSign className="h-3 w-3 text-muted-foreground" />
              <span className="font-medium text-green-600">
                {formatCurrency(opportunity.estimatedValueMax)}
              </span>
            </div>
          )}

          {/* Technical Focus */}
          {opportunity.technicalFocus.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {opportunity.technicalFocus.slice(0, 2).map((focus) => (
                <Badge key={focus} variant="outline" className="text-xs h-5">
                  {focus}
                </Badge>
              ))}
              {opportunity.technicalFocus.length > 2 && (
                <Badge variant="outline" className="text-xs h-5">
                  +{opportunity.technicalFocus.length - 2}
                </Badge>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t text-xs">
            <Badge variant="secondary" className="text-xs">
              {opportunity.opportunityType}
            </Badge>

            <span className="font-medium text-muted-foreground">
              {opportunity.probability}%
            </span>
          </div>
        </div>
  )
}

export default memo(OpportunityCard, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.opportunity.id === nextProps.opportunity.id &&
    prevProps.opportunity.title === nextProps.opportunity.title &&
    prevProps.opportunity.agency === nextProps.opportunity.agency &&
    prevProps.opportunity.priority === nextProps.opportunity.priority &&
    prevProps.opportunity.probability === nextProps.opportunity.probability &&
    prevProps.index === nextProps.index
  )
})
