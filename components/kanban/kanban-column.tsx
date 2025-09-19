"use client"

import { memo, useState, useEffect, useCallback } from "react"
import { useDroppable, useDraggable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus, MoreVertical, Edit, Trash2, AlertTriangle, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import OpportunityCard from "./opportunity-card"

interface Stage {
  id: string
  name: string
  color: string
  order: number
}

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

interface KanbanColumnProps {
  stage: Stage
  opportunities: Opportunity[]
  index: number
  onEdit?: (opportunityId: string) => void
  onDelete?: (opportunityId: string) => void
  onKeyboardMove?: (opportunityId: string, direction: 'up' | 'down' | 'left' | 'right') => void
  onEditStage?: (stageId: string) => void
  onDeleteStage?: (stageId: string) => void
  isDragging: boolean
  isStageDraggingActive?: boolean
}



export function KanbanColumn({ stage, opportunities, onEdit, onDelete, onKeyboardMove, onEditStage, onDeleteStage, isDragging, isStageDraggingActive }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
    disabled: isStageDraggingActive,
  })

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging: columnIsDragging
  } = useDraggable({
    id: stage.id + '_stage',
    data: {
      type: 'stage',
      stage
    },
  })

  const totalValue = opportunities.reduce((sum, opp) => {
    return sum + (opp.estimatedValueMax || opp.estimatedValueMin || 0)
  }, 0)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = (e?: React.MouseEvent) => {
    e?.preventDefault();
    onDeleteStage?.(stage.id);
    setIsDeleteDialogOpen(false);
  };

  const handleEditClick = () => {
    console.log("Edit clicked for stage:", stage.id);
    onEditStage?.(stage.id);
  };

  console.log("Rendering stage menu for:", stage.id, stage.name, "isDragging:", isDragging);

  // Simple Column Action Menu with Edit and Delete
  function ColumnActionMenu() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleToggleMenu = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!isDragging) {
        setIsMenuOpen(!isMenuOpen)
      }
    }, [isDragging, isMenuOpen])

    const handleEdit = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("Stage edit clicked for:", stage.id)
      handleEditClick()
      setIsMenuOpen(false)
    }, [stage.id])

    const handleDelete = useCallback((e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      console.log("Stage delete clicked for:", stage.id)
      handleDeleteClick()
      setIsMenuOpen(false)
    }, [stage.id])

    // Close menu when clicking outside
    useEffect(() => {
      const handleClickOutside = () => setIsMenuOpen(false)
      if (isMenuOpen) {
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
      }
    }, [isMenuOpen])

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
          className="h-8 w-8 p-0 hover:bg-slate-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          onClick={handleToggleMenu}
          title="Stage actions"
          aria-label={`Actions for ${stage.name}`}
          aria-expanded={isMenuOpen}
        >
          <MoreVertical className="h-4 w-4 text-slate-600" />
        </Button>

        {isMenuOpen && (
          <div className="absolute right-0 mt-1 z-50 bg-white border border-slate-200 rounded-md shadow-lg py-1 w-32 min-w-[120px]">
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-slate-50 focus:bg-slate-50 focus:outline-none"
            >
              <Edit className="h-4 w-4 text-slate-500" />
              <span>Edit Stage</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 focus:bg-red-50 focus:outline-none"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Stage</span>
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex-shrink-0 min-w-[24rem] w-96 md:w-[28rem] group">
      <div className="bg-white overflow-hidden h-full flex flex-col transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-slate-200/60 hover:border-slate-300/80 rounded-2xl shadow-lg backdrop-blur-sm">
        {/* Column Header (sticky) */}
        <div
          ref={setDraggableRef}
          {...listeners}
          {...attributes}
          className={`sticky top-0 z-10 bg-gradient-to-r from-white via-slate-50/80 to-white backdrop-blur-md border-b border-slate-200/60 rounded-t-2xl cursor-grab active:cursor-grabbing hover:bg-slate-100/50 transition-all duration-200 ${columnIsDragging ? 'select-none bg-slate-100/80 shadow-lg ring-2 ring-blue-200' : ''}`}
          title="Drag to reorder stage"
        >
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              {/* Drag Handle */}
              <div
                className="flex items-center justify-center w-6 h-6 hover:bg-slate-100 rounded cursor-grab active:cursor-grabbing transition-colors"
                title="Drag to reorder stage"
              >
                <GripVertical className="h-4 w-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div
                    className="w-5 h-5 rounded-full shadow-lg ring-2 ring-white flex-shrink-0"
                    style={{ backgroundColor: stage.color }}
                  ></div>
                  <div className="absolute inset-0 rounded-full" style={{ backgroundColor: stage.color, opacity: 0.3 }}></div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">{stage.name}</h3>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(onEditStage || onDeleteStage) && <ColumnActionMenu />}
              <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 shadow-sm border border-slate-300/50">
                {opportunities.length}
              </div>
            </div>
          </div>

          {totalValue > 0 && (
            <div className="px-6 pb-5">
              <div className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-1">
                {formatCurrency(totalValue)}
              </div>
              <div className="text-sm text-slate-600 font-semibold tracking-wide uppercase">total value</div>
            </div>
          )}
        </div>

        {/* Drop Zone */}
        <div
          ref={setNodeRef}
          role="list"
          aria-label={`${stage.name} column`}
          aria-describedby={`column-${stage.id}-hint`}
          className={`flex-1 overflow-auto p-4 md:p-6 transition-colors duration-200 rounded-b-2xl bg-slate-50/60 ${
            isOver
              ? "bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300 border-dashed drop-zone-active"
              : ""
          }`}
          style={{ minHeight: 0 }}
        >
          {opportunities.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
                  <Plus className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">
                  {isOver
                    ? "Drop here"
                    : "No opportunities yet"}
                </p>
                <p id={`column-${stage.id}-hint`} className="sr-only">
                  {`Use drag and drop to move opportunities into ${stage.name}. When using keyboard, press space on a card to pick it up and use arrow keys to move focus.`}
                </p>
              </div>
            </div>
          )}

          <SortableContext
            items={opportunities.map(opp => opp.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {opportunities.map((opportunity, index) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  index={index}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onKeyboardMove={onKeyboardMove}
                  isDragging={isDragging}
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Stage</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{stage.name}"?
              {opportunities.length > 0 && (
                <><br /><br />
                <strong>Warning:</strong> This stage contains {opportunities.length} opportunity(ies).
                They will remain in the system but won't be visible in the kanban.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete Stage
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default memo(KanbanColumn, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  return (
    prevProps.stage.id === nextProps.stage.id &&
    prevProps.stage.name === nextProps.stage.name &&
    prevProps.opportunities.length === nextProps.opportunities.length &&
    prevProps.index === nextProps.index &&
    // Deep comparison of first few opportunities for efficiency
    prevProps.opportunities.every((opp, index) =>
      nextProps.opportunities[index] && opp.id === nextProps.opportunities[index].id
    )
  )
})
