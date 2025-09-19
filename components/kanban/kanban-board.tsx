"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import KanbanColumn from "./kanban-column"
import { OpportunityModal } from "@/components/modals/opportunity-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Mock data - will be replaced with real API calls
const mockStages = [
  { id: "stage-lead-gen", name: "Lead Generation", color: "#3b82f6", order: 1 },
  { id: "stage-qualification", name: "Qualification", color: "#f59e0b", order: 2 },
  { id: "stage-proposal", name: "Proposal Development", color: "#8b5cf6", order: 3 },
  { id: "stage-submitted", name: "Submitted/Under Review", color: "#06b6d4", order: 4 },
  { id: "stage-closed", name: "Won/Lost/Closed", color: "#10b981", order: 5 },
]

const mockOpportunities = [
  {
    id: "opp-1",
    title: "AI-Powered Data Analytics Platform for Defense Intelligence",
    agency: "Department of Defense",
    contractVehicle: "SAM.gov",
    solicitationNumber: "W52P1J-24-R-0001",
    estimatedValueMin: 500000,
    estimatedValueMax: 2000000,
    dueDate: new Date("2024-12-15"),
    currentStageId: "stage-qualification",
    priority: "HIGH" as const,
    probability: 75,
    opportunityType: "RFP" as const,
    technicalFocus: ["AI/ML", "Data Analytics", "Cloud Computing"],
  },
  {
    id: "opp-2",
    title: "Cybersecurity Assessment and Monitoring Services",
    agency: "General Services Administration",
    contractVehicle: "GSA Schedule",
    solicitationNumber: "GS-35F-0001AA",
    estimatedValueMin: 100000,
    estimatedValueMax: 500000,
    dueDate: new Date("2024-11-30"),
    currentStageId: "stage-proposal",
    priority: "MEDIUM" as const,
    probability: 60,
    opportunityType: "RFQ" as const,
    technicalFocus: ["Cybersecurity", "Risk Assessment", "Compliance"],
  },
  {
    id: "opp-3",
    title: "Cloud Migration and Modernization Initiative",
    agency: "NASA",
    contractVehicle: "SAM.gov",
    solicitationNumber: "NNH24ZDA001N",
    estimatedValueMin: 1000000,
    estimatedValueMax: 5000000,
    dueDate: new Date("2025-01-20"),
    currentStageId: "stage-lead-gen",
    priority: "HIGH" as const,
    probability: 40,
    opportunityType: "BAA" as const,
    technicalFocus: ["Cloud Computing", "DevOps", "System Integration"],
  },
]

export function KanbanBoard() {
  const [stages, setStages] = useState(mockStages)
  const [opportunities, setOpportunities] = useState(mockOpportunities)
  const [selectedOpportunity, setSelectedOpportunity] = useState<any | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [isStageModalOpen, setIsStageModalOpen] = useState(false)
  const [selectedStage, setSelectedStage] = useState<any | null>(null)
  const [stageFormData, setStageFormData] = useState({
    name: '',
    color: '#3b82f6'
  })
  const boardRef = useRef<HTMLDivElement | null>(null)
  const dragRaf = useRef<number | null>(null)
  const pointerX = useRef<number | null>(null)

  const getOpportunitiesForStage = (stageId: string) => {
    return opportunities.filter((opp) => opp.currentStageId === stageId)
  }

  // Move an opportunity programmatically to a destination stage/index.
  // Handles same-column reordering or cross-column moves.
  const moveOpportunity = async (
    opportunityId: string,
    destStageId: string,
    destIndex: number,
  ) => {
    const opportunity = opportunities.find((opp) => opp.id === opportunityId)
    if (!opportunity) return
    const originalStageId = opportunity.currentStageId

    // helper to reorder
    const reorder = <T,>(list: T[], startIndex: number, endIndex: number) => {
      const result = Array.from(list)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    }

    const original = opportunities

    try {
      if (destStageId === originalStageId) {
        // reorder within same stage
        setOpportunities((prev) => {
          const stageItems = prev.filter((opp) => opp.currentStageId === originalStageId)
          const sourceIndex = stageItems.findIndex((o) => o.id === opportunityId)
          if (sourceIndex === -1 || sourceIndex === destIndex) return prev
          const reordered = reorder(stageItems, sourceIndex, destIndex)
          let ri = 0
          return prev.map((opp) => (opp.currentStageId === originalStageId ? reordered[ri++] : opp))
        })

        // Persist to backend (continue optimistically on errors for demo)
        try {
          await fetch(`/api/opportunities/${opportunityId}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: destStageId, index: destIndex }),
          })
        } catch (error) {
          // Log error but don't revert - useful for demo with mock data
          console.warn(`API call failed for reorder:`, error)
        }
        return
      }

      // moving between columns
      setOpportunities((prev) => {
        const without = prev.filter((o) => o.id !== opportunityId)
        const destItems = without.filter((o) => o.currentStageId === destStageId)
        const moved = { ...opportunity, currentStageId: destStageId }
        const inserted = [
          ...destItems.slice(0, destIndex),
          moved,
          ...destItems.slice(destIndex),
        ]

        const byStage = stages.map((s) => {
          if (s.id === destStageId) return inserted
          if (s.id === originalStageId) return without.filter((o) => o.currentStageId === originalStageId)
          return without.filter((o) => o.currentStageId === s.id)
        })

        return byStage.flat()
      })

        try {
          const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: destStageId, index: destIndex }),
          })

          if (!response.ok) {
            console.warn(`API call failed (${response.status}) but UI updated successfully for demo`)
          }
        } catch (error) {
          // Log error but don't revert - useful for demo with mock data
          console.warn(`API call failed for cross-stage move:`, error)
        }
    } catch (err) {
      console.error('moveOpportunity error', err)
      setOpportunities(original)
    }
  }

  // Keyboard move handler passed down to cards. direction: 'up'|'down'|'left'|'right'
  const handleKeyboardMove = (opportunityId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const opportunity = opportunities.find((o) => o.id === opportunityId)
    if (!opportunity) return
    const stageIndex = stages.findIndex((s) => s.id === opportunity.currentStageId)
    const stageItems = getOpportunitiesForStage(opportunity.currentStageId)
    const sourceIndex = stageItems.findIndex((i) => i.id === opportunityId)

    if (direction === 'up') {
      if (sourceIndex > 0) {
        void moveOpportunity(opportunityId, opportunity.currentStageId, sourceIndex - 1)
      }
    } else if (direction === 'down') {
      if (sourceIndex < stageItems.length - 1) {
        void moveOpportunity(opportunityId, opportunity.currentStageId, sourceIndex + 1)
      }
    } else if (direction === 'left') {
      if (stageIndex > 0) {
        const destStage = stages[stageIndex - 1]
        // place at same index or at end
        const destItems = getOpportunitiesForStage(destStage.id)
        const destIndex = Math.min(sourceIndex, destItems.length)
        void moveOpportunity(opportunityId, destStage.id, destIndex)
      }
    } else if (direction === 'right') {
      if (stageIndex < stages.length - 1) {
        const destStage = stages[stageIndex + 1]
        const destItems = getOpportunitiesForStage(destStage.id)
        const destIndex = Math.min(sourceIndex, destItems.length)
        void moveOpportunity(opportunityId, destStage.id, destIndex)
      }
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const findOpportunityById = (id: string) => {
    return opportunities.find(opp => opp.id === id)
  }

  const findStageByOpportunityId = (opportunityId: string) => {
    const opportunity = findOpportunityById(opportunityId)
    return opportunity ? opportunity.currentStageId : null
  }

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeOpportunity = findOpportunityById(activeId)
    if (!activeOpportunity) return

    const activeStageId = activeOpportunity.currentStageId
    const overStageId = over.id as string

    // If dropped over a stage, move to that stage
    if (stages.find(stage => stage.id === overStageId)) {
      if (activeStageId === overStageId) {
        // Same stage, no change needed for cross-stage move
        setIsDragging(false)
        return
      }

      const destItems = opportunities.filter((o) => o.currentStageId === overStageId)
      const destIndex = destItems.length // Add to end of destination stage

      try {
        setOpportunities((prev) => {
          const without = prev.filter((o) => o.id !== activeId)
          const destItems = without.filter((o) => o.currentStageId === overStageId)
          const moved = { ...activeOpportunity, currentStageId: overStageId }
          const inserted = [...destItems, moved]

          const byStage = stages.map((s) => {
            if (s.id === overStageId) return inserted
            if (s.id === activeStageId) return without.filter((o) => o.currentStageId === activeStageId)
            return without.filter((o) => o.currentStageId === s.id)
          })

          return byStage.flat()
        })

        try {
          const response = await fetch(`/api/opportunities/${activeId}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: overStageId, index: destIndex }),
          })

          if (!response.ok) {
            console.warn(`API call failed (${response.status}) but UI updated successfully for demo`)
          }
        } catch (error) {
          console.warn(`API call failed for drop-over-stage move (continuing with UI for demo):`, error)
        }
      } catch (error) {
        console.error('moveOpportunity error:', error)
        throw error // Let it propagate for other error handling
      }
    } else {
      // Dropped over another card - handle reordering
      const overOpportunity = findOpportunityById(overId)
      if (!overOpportunity) return

      const overStageId = overOpportunity.currentStageId
      const activeItems = opportunities.filter((opp) => opp.currentStageId === activeStageId)
      const overItems = opportunities.filter((opp) => opp.currentStageId === overStageId)

      if (activeStageId === overStageId) {
        // Reordering within same stage
        const activeIndex = activeItems.findIndex((opp) => opp.id === activeId)
        const overIndex = overItems.findIndex((opp) => opp.id === overId)

        if (activeIndex === overIndex) {
          setIsDragging(false)
          return
        }

        setOpportunities((prev) => {
          const reordered = arrayMove(activeItems, activeIndex, overIndex)
          let ri = 0
          return prev.map((opp) =>
            opp.currentStageId === activeStageId ? reordered[ri++] : opp
          )
        })

        try {
          await fetch(`/api/opportunities/${activeId}/move`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ stage: activeStageId, index: overIndex }),
          })
        } catch (error) {
          console.warn('Failed to persist reorder (continuing with UI for demo):', error)
        }
      } else {
        // Moving between different stages
        const activeIndex = activeItems.findIndex((opp) => opp.id === activeId)
        const overIndex = overItems.findIndex((opp) => opp.id === overId)

        try {
          setOpportunities((prev) => {
            const without = prev.filter((o) => o.id !== activeId)
            const destItems = without.filter((o) => o.currentStageId === overStageId)
            const moved = { ...activeOpportunity, currentStageId: overStageId }
            const inserted = [
              ...destItems.slice(0, overIndex),
              moved,
              ...destItems.slice(overIndex),
            ]

            const byStage = stages.map((s) => {
              if (s.id === overStageId) return inserted
              if (s.id === activeStageId) return without.filter((o) => o.currentStageId === activeStageId)
              return without.filter((o) => o.currentStageId === s.id)
            })

            return byStage.flat()
          })

          try {
            const response = await fetch(`/api/opportunities/${activeId}/move`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ stage: overStageId, index: overIndex }),
            })

            if (!response.ok) {
              console.warn(`API call failed (${response.status}) but UI updated successfully for demo`)
            }
          } catch (error) {
            console.warn(`API call failed for cross-stage move (continuing with UI for demo):`, error)
          }
        } catch (error) {
          console.error('Unexpected error in cross-stage move handler:', error)
          // Only revert on non-API errors (like invalid data)
          if (!(error instanceof Error) || !error.message.includes('API call failed')) {
            setOpportunities((prev) =>
              prev.map((opp) =>
                opp.id === activeId ? activeOpportunity : opp
              )
            )
          }
        }
      }
    }

    setIsDragging(false)
  }

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      if (dragRaf.current) {
        cancelAnimationFrame(dragRaf.current)
      }
    }
  }, [])

  const onDragStart = () => {
    setIsDragging(true)
    window.addEventListener('pointermove', onPointerMove)
  }

  const onPointerMove = useCallback((e: PointerEvent) => {
    pointerX.current = e.clientX
    if (dragRaf.current == null) {
      dragRaf.current = requestAnimationFrame(() => {
        dragRaf.current = null
        const el = boardRef.current?.querySelector('.kanban-columns') as HTMLElement | null
        if (!el || pointerX.current == null) return
        const rect = el.getBoundingClientRect()
        const edge = 80
        const x = pointerX.current
        const scrollSpeed = 20
        if (x < rect.left + edge) {
          el.scrollLeft -= scrollSpeed
        } else if (x > rect.right - edge) {
          el.scrollLeft += scrollSpeed
        }
      })
    }
  }, [])

  const handleEdit = (opportunityId: string) => {
    const opp = opportunities.find((o) => o.id === opportunityId)
    setSelectedOpportunity(opp ?? null)
    setIsModalOpen(true)
  }

  const handleDelete = async (opportunityId: string) => {
    // optimistic UI removal
    const original = opportunities
    setOpportunities((prev) => prev.filter((o) => o.id !== opportunityId))

    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
    } catch (err) {
      console.error('Delete failed', err)
      setOpportunities(original)
    }
  }

  const handleModalSuccess = (updated?: any) => {
    // For now, simply close and refresh local mock state if provided
    setIsModalOpen(false)
    setSelectedOpportunity(null)
    if (updated) {
      setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    }
  }

  // Stage management functions
  const handleAddStage = () => {
    setSelectedStage(null)
    setStageFormData({ name: '', color: '#3b82f6' })
    setIsStageModalOpen(true)
  }

  const handleEditStage = (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    if (stage) {
      setSelectedStage(stage)
      setStageFormData({ name: stage.name, color: stage.color })
      setIsStageModalOpen(true)
    }
  }

  const handleDeleteStage = async (stageId: string) => {
    const stageOpportunities = getOpportunitiesForStage(stageId)
    if (stageOpportunities.length > 0) {
      alert(`Cannot delete stage with ${stageOpportunities.length} opportunities. Please move or delete all opportunities first.`)
      return
    }

    if (!confirm('Are you sure you want to delete this stage?')) return

    setStages(prev => prev.filter(s => s.id !== stageId))
  }

  const handleStageModalSave = () => {
    if (!stageFormData.name.trim()) return

    if (selectedStage) {
      // Edit existing stage
      setStages(prev => prev.map(s => s.id === selectedStage.id ? { ...s, ...stageFormData } : s))
    } else {
      // Add new stage
      const newStage = {
        id: `stage-${Date.now()}`,
        name: stageFormData.name.trim(),
        color: stageFormData.color,
        order: stages.length + 1
      }
      setStages(prev => [...prev, newStage])
    }

    setIsStageModalOpen(false)
    setSelectedStage(null)
    setStageFormData({ name: '', color: '#3b82f6' })
  }

  const handleStageModalClose = () => {
    setIsStageModalOpen(false)
    setSelectedStage(null)
    setStageFormData({ name: '', color: '#3b82f6' })
  }

  return (
    <div className={`w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col relative overflow-hidden ${isDragging ? 'drag-active' : ''}`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/8 to-purple-400/8 rounded-full blur-3xl -translate-y-36 translate-x-36 bg-decoration-float"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/6 to-teal-400/6 rounded-full blur-3xl translate-y-48 -translate-x-48 bg-decoration-float" style={{animationDelay: '3s'}}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-rose-400/4 to-pink-400/4 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 bg-decoration-float" style={{animationDelay: '1s'}}></div>

      {/* Header Section */}
      <div className="relative flex-shrink-0 flex items-center justify-between py-8 px-6 md:px-8 border-b border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-sm">
        <div className="flex items-center space-x-8">
          <div className="relative">
            <div className="absolute -top-1 -left-1 w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl blur-sm opacity-75"></div>
            <div className="relative bg-white rounded-xl p-3 shadow-lg">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent mb-1">Sales Pipeline</h1>
            <p className="text-slate-600 text-lg font-medium">{opportunities.length} opportunities tracking</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="text-slate-700 hover:text-slate-900 hover:border-slate-400 relative bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-slate-200"
            onClick={handleAddStage}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Stage
          </Button>
          <div className="text-right">
            <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">Pipeline Health</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500 ease-out" style={{width: '85%'}}></div>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">85%</div>
            </div>
          </div>
          <Button
            className="relative bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 overflow-hidden group"
            onClick={() => { setIsModalOpen(true); }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <Plus className="mr-2 h-5 w-5 relative z-10" />
            <span className="font-semibold relative z-10">Add Opportunity</span>
          </Button>
        </div>
      </div>

      {/* Kanban Board Content - Full Height */}
      <div className="flex-1 overflow-hidden h-full min-h-0">
        <DndContext
          sensors={sensors}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
        >
          <div ref={boardRef} className="kanban-columns h-full flex items-start gap-6 md:gap-8 overflow-x-auto pb-4 px-6 md:px-8">
            {stages.map((stage, index) => (
              <KanbanColumn
                key={stage.id}
                index={index}
                stage={stage}
                opportunities={getOpportunitiesForStage(stage.id)}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onKeyboardMove={handleKeyboardMove}
                onEditStage={handleEditStage}
                onDeleteStage={handleDeleteStage}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {isModalOpen && (
        <OpportunityModal
          isOpen={isModalOpen}
          opportunity={selectedOpportunity}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Stage Management Modal */}
      <Dialog open={isStageModalOpen} onOpenChange={setIsStageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedStage ? 'Edit Stage' : 'Add New Stage'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stage-name" className="text-right">
                Name
              </Label>
              <Input
                id="stage-name"
                value={stageFormData.name}
                onChange={(e) => setStageFormData(prev => ({ ...prev, name: e.target.value }))}
                className="col-span-3"
                placeholder="Enter stage name..."
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="stage-color" className="text-right">
                Color
              </Label>
              <Input
                id="stage-color"
                type="color"
                value={stageFormData.color}
                onChange={(e) => setStageFormData(prev => ({ ...prev, color: e.target.value }))}
                className="col-span-3 w-16 h-10 border rounded-lg cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleStageModalClose}>
              Cancel
            </Button>
            <Button onClick={handleStageModalSave}>
              {selectedStage ? 'Update Stage' : 'Add Stage'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  )
}
