"use client"

import { useState, useEffect, memo, useCallback } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, MoreVertical, Edit, Trash2, Building2, Calendar, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

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
  index: number
  onEdit?: (opportunityId: string) => void
  onDelete?: (opportunityId: string) => void
  onKeyboardMove?: (opportunityId: string, direction: 'up' | 'down' | 'left' | 'right') => void
  isDragging: boolean
}

// Simple action menu with regular buttons
function CardActionMenu({
  opportunityId,
  opportunityTitle,
  onEdit,
  onDelete,
  isDragging,
}: {
  opportunityId: string
  opportunityTitle: string
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  isDragging: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isDragging) {
      setIsOpen(!isOpen)
    }
  }, [isDragging, isOpen])

  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Edit clicked for opportunity:", opportunityId)
    onEdit?.(opportunityId)
    setIsOpen(false)
  }, [opportunityId, onEdit])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    console.log("Delete clicked for opportunity:", opportunityId)
    if (confirm(`Are you sure you want to delete "${opportunityTitle}"?`)) {
      onDelete?.(opportunityId)
    }
    setIsOpen(false)
  }, [opportunityId, opportunityTitle, onDelete])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsOpen(false)
    if (isOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [isOpen])

  if (isDragging) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 opacity-50 cursor-not-allowed"
        disabled
        title="Menu disabled while dragging"
      >
        <MoreVertical className="h-4 w-4 text-slate-400" />
      </Button>
    )
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        className={cn(
          "h-8 w-8 p-0 flex items-center justify-center",
          "bg-white hover:bg-slate-50",
          "border border-slate-300 rounded",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1",
        )}
        onClick={handleToggle}
        title="More actions"
        aria-label={`Actions for ${opportunityTitle}`}
        aria-expanded={isOpen}
      >
        <MoreVertical className="h-4 w-4 text-slate-600" />
      </Button>

      {isOpen && (
        <div className={cn(
          "absolute right-0 mt-1 z-50",
          "bg-white border border-slate-200 rounded-md shadow-lg",
          "py-1 w-32 min-w-[120px]"
        )}>
          <div className="px-3 py-1 text-xs text-slate-500 font-medium border-b border-slate-100">
            Actions
          </div>
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
          >
            <Edit className="h-4 w-4 text-slate-500" />
            <span>Edit</span>
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

function OpportunityCard({
  opportunity,
  index,
  onEdit,
  onDelete,
  onKeyboardMove,
  isDragging,
}: OpportunityCardProps) {
  // Format currency for display with better formatting
  const formatCurrency = useCallback((amount: number) => {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
    return formatter.format(amount)
  }, [])

  // Enhanced priority styling with accessibility
  const getPriorityVariant = useCallback((priority: string) => {
    const variants = {
      "URGENT": "destructive",
      "HIGH": "default",
      "MEDIUM": "secondary",
      "LOW": "outline"
    } as const
    return variants[priority as keyof typeof variants] || "outline"
  }, [])

  // Get priority color style for more visual distinction
  const getPriorityColor = useCallback((priority: string) => {
    const colors = {
      "URGENT": "bg-red-50 border-red-200 text-red-800",
      "HIGH": "bg-orange-50 border-orange-200 text-orange-800",
      "MEDIUM": "bg-yellow-50 border-yellow-200 text-yellow-800",
      "LOW": "bg-gray-50 border-gray-200 text-gray-800"
    } as const
    return colors[priority as keyof typeof colors] || colors.LOW
  }, [])

  // Enhanced due date calculation with more detailed information
  const getDueDateInfo = useCallback(() => {
    if (!opportunity.dueDate) return null

    const now = new Date()
    const dueDate = new Date(opportunity.dueDate)
    const days = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    const isOverdue = days < 0
    const isToday = days === 0
    const isTomorrow = days === 1
    const isWithinWeek = days >= 0 && days <= 7
    const isWithinMonth = days >= 0 && days <= 30

    let text: string
    let variant: "destructive" | "default" | "secondary" | "outline"

    if (isOverdue) {
      text = `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`
      variant = "destructive"
    } else if (isToday) {
      text = "Due today"
      variant = "destructive"
    } else if (isTomorrow) {
      text = "Due tomorrow"
      variant = "default"
    } else if (isWithinWeek) {
      text = `${days} day${days === 1 ? '' : 's'} left`
      variant = days <= 3 ? "default" : "secondary"
    } else if (isWithinMonth) {
      text = `${Math.floor(days / 7)} week${Math.floor(days / 7) === 1 ? '' : 's'} left`
      variant = "outline"
    } else {
      text = format(dueDate, "MMM d, yyyy")
      variant = "outline"
    }

    return {
      days,
      isOverdue,
      isWithinWeek,
      text,
      variant
    }
  }, [opportunity.dueDate])

  // Enhanced keyboard navigation with better accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!onKeyboardMove || isDragging) return

    const isModifier = e.ctrlKey || e.metaKey || e.shiftKey
    switch (e.key) {
      case 'ArrowUp':
        if (isModifier) {
          e.preventDefault()
          onKeyboardMove(opportunity.id, 'up')
        }
        break
      case 'ArrowDown':
        if (isModifier) {
          e.preventDefault()
          onKeyboardMove(opportunity.id, 'down')
        }
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
      case 'Enter':
      case ' ':
        e.preventDefault()
        onEdit?.(opportunity.id)
        break
      case 'Delete':
      case 'Backspace':
        if (isModifier) {
          e.preventDefault()
          onDelete?.(opportunity.id)
        }
        break
    }
  }, [onKeyboardMove, opportunity.id, onEdit, onDelete, isDragging])

  // Enhanced DnD-kit sortable setup with improved accessibility
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCardDragging,
  } = useSortable({
    id: opportunity.id,
    data: {
      type: 'opportunity',
      opportunity,
      index,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const dueDateInfo = getDueDateInfo()

  // Calculate card priority for visual ordering
  const priorityRank = { "URGENT": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 }[opportunity.priority] || 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group bg-white border rounded-lg overflow-hidden shadow-sm transition-all duration-200",
        "hover:shadow-md hover:border-slate-400",
        "select-none relative",
        isCardDragging && "shadow-2xl scale-105 rotate-2 z-50 border-primary/50 bg-gradient-to-br from-blue-50/90 to-indigo-50/90",
        getPriorityColor(opportunity.priority),
        // Priority-based visual hierarchy
        priorityRank >= 4 && "ring-2 ring-red-200",
        priorityRank >= 3 && "ring-1 ring-orange-200"
      )}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="article"
      aria-label={`Opportunity: ${opportunity.title} - Priority ${opportunity.priority} - ${opportunity.probability}% probability`}
      aria-describedby={`opp-${opportunity.id}-description`}
    >
      {/* Header Section with improved layout */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3 mb-3">
          {/* Enhanced drag handle with better visual feedback */}
          <div
            {...attributes}
            {...listeners}
            className={cn(
              "flex-shrink-0 w-6 h-6 rounded border-2 border-dashed border-slate-300 hover:border-slate-400",
              "flex items-center justify-center cursor-grab active:cursor-grabbing",
              "hover:bg-slate-50 transition-all duration-200",
              isCardDragging ? "bg-slate-100 border-slate-400" : "bg-slate-50",
              isDragging && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Drag handle - Press Ctrl+Arrow keys to move with keyboard"
            tabIndex={0}
            role="button"
            onKeyDown={(e) => {
              // Space/Enter to start drag for better accessibility
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault()
                if (listeners && typeof listeners.onKeyDown === 'function') {
                  listeners.onKeyDown(e)
                }
              }
            }}
          >
            <GripVertical className="h-3 w-3 text-slate-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="font-semibold text-sm leading-tight text-slate-900 line-clamp-2 mb-2"
              id={`opp-${opportunity.id}-title`}
            >
              {opportunity.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Building2 className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{opportunity.agency}</span>
            </div>
          </div>

          {/* Improved header right section with better spacing */}
          <div className="flex items-start gap-2 flex-shrink-0">
            <Badge
              variant={getPriorityVariant(opportunity.priority) as any}
              className={cn(
                "text-xs font-medium",
                priorityRank >= 4 && "animate-pulse"
              )}
            >
              {opportunity.priority}
            </Badge>
            
            {/* Menu button with improved positioning */}
            <div className="mt-0">
              <CardActionMenu
                opportunityId={opportunity.id}
                opportunityTitle={opportunity.title}
                onEdit={onEdit}
                onDelete={onDelete}
                isDragging={isDragging || isCardDragging}
              />
            </div>
          </div>
        </div>

        {/* Enhanced priority indicator */}
        {priorityRank > 1 && (
          <div className={cn(
            "text-xs text-center py-1 px-2 rounded text-slate-700 font-medium mb-3",
            priorityRank >= 4 && "bg-red-100 text-red-800",
            priorityRank === 3 && "bg-orange-100 text-orange-800",
            priorityRank === 2 && "bg-yellow-100 text-yellow-800"
          )}>
            {priorityRank === 4 && "⚠️ Critical Priority"}
            {priorityRank === 3 && "🔥 High Priority"}
            {priorityRank === 2 && "⚡ Medium Priority"}
          </div>
        )}

        {/* Due Date with enhanced styling */}
        {dueDateInfo && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <Calendar className="h-3 w-3 text-slate-500" />
            <span className="text-slate-700">
              {format(opportunity.dueDate!, "MMM d")}
            </span>
            <Badge
              variant={dueDateInfo.variant as any}
              className={cn(
                "text-xs font-semibold",
                dueDateInfo.isOverdue && "animate-pulse",
                dueDateInfo.isWithinWeek && !dueDateInfo.isOverdue && "animate-pulse"
              )}
            >
              {dueDateInfo.text}
            </Badge>
          </div>
        )}

        {/* Value with enhanced formatting */}
        {opportunity.estimatedValueMax && (
          <div className="flex items-center gap-2 mb-3 text-xs">
            <DollarSign className="h-3 w-3 text-green-600" />
            <span className="font-semibold text-green-700">
              {formatCurrency(opportunity.estimatedValueMax)}
            </span>
            {opportunity.estimatedValueMin && opportunity.estimatedValueMin !== opportunity.estimatedValueMax && (
              <span className="text-slate-500">
                ({formatCurrency(opportunity.estimatedValueMin)} min)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Section */}
      <div className="px-4 pb-4">
        {/* Technical Focus Badges with improved display */}
        {opportunity.technicalFocus.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {opportunity.technicalFocus.slice(0, 2).map((focus) => (
              <Badge
                key={focus}
                variant="outline"
                className="text-xs h-5 px-2 text-slate-600 border-slate-300"
              >
                {focus}
              </Badge>
            ))}
            {opportunity.technicalFocus.length > 2 && (
              <Badge variant="outline" className="text-xs h-5 px-2 text-slate-500 border-slate-300">
                +{opportunity.technicalFocus.length - 2} more
              </Badge>
            )}
          </div>
        )}

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className="text-xs bg-slate-100 text-slate-700 border-slate-200"
          >
            {opportunity.opportunityType}
          </Badge>
          <div className="flex items-center gap-2">
            <div className="text-xs font-medium text-slate-700">
              {opportunity.probability}%
            </div>
            <div className="text-xs text-slate-400">
              P(win)
            </div>
          </div>
        </div>
      </div>

      {/* Screen reader description */}
      <div id={`opp-${opportunity.id}-description`} className="sr-only">
        {`${opportunity.title} from ${opportunity.agency}. Priority ${opportunity.priority}.
        ${dueDateInfo ? `Due ${dueDateInfo.text}.` : ''} Winning probability ${opportunity.probability}%.
        Estimated value ${opportunity.estimatedValueMax ? formatCurrency(opportunity.estimatedValueMax) : 'not specified'}.
        ${opportunity.technicalFocus.length > 0 ? `Focus areas: ${opportunity.technicalFocus.join(', ')}` : ''}`}
      </div>
    </div>
  )
}

export default memo(OpportunityCard, (prevProps, nextProps) => {
  // Enhanced comparison for better performance
  return (
    prevProps.opportunity.id === nextProps.opportunity.id &&
    prevProps.opportunity.title === nextProps.opportunity.title &&
    prevProps.opportunity.agency === nextProps.opportunity.agency &&
    prevProps.opportunity.priority === nextProps.opportunity.priority &&
    prevProps.opportunity.probability === nextProps.opportunity.probability &&
    prevProps.opportunity.dueDate?.getTime() === nextProps.opportunity.dueDate?.getTime() &&
    prevProps.opportunity.currentStageId === nextProps.opportunity.currentStageId &&
    prevProps.index === nextProps.index &&
    prevProps.isDragging === nextProps.isDragging
  )
})
