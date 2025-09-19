"use client"

import { memo, useMemo } from "react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Plus } from "lucide-react"
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
}

export function KanbanColumn({ stage, opportunities, onEdit, onDelete, onKeyboardMove }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: stage.id,
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

  return (
    <div className="flex-shrink-0 min-w-[24rem] w-96 md:w-[28rem] group">
      <div className="bg-white overflow-hidden h-full flex flex-col transform transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-slate-200/60 hover:border-slate-300/80 rounded-2xl shadow-lg backdrop-blur-sm">
        {/* Column Header (sticky) */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-white via-slate-50/80 to-white backdrop-blur-md border-b border-slate-200/60 rounded-t-2xl">
          <div className="flex items-center justify-between px-6 py-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div
                  className="w-5 h-5 rounded-full shadow-lg ring-2 ring-white flex-shrink-0"
                  style={{ backgroundColor: stage.color }}
                ></div>
                <div className="absolute inset-0 rounded-full" style={{ backgroundColor: stage.color, opacity: 0.3 }}></div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">{stage.name}</h3>
            </div>
            <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 shadow-sm border border-slate-300/50">
              {opportunities.length}
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
              : "bg-slate-50"
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
                />
              ))}
            </div>
          </SortableContext>
        </div>
      </div>
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
