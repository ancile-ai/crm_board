"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, UniqueIdentifier, PointerSensor, useSensor, useSensors, closestCenter, pointerWithin, rectIntersection, CollisionDetection } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import KanbanColumn from "./kanban-column"
import { OpportunityModal } from "@/components/modals/opportunity-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

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
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null)
  const [activeItem, setActiveItem] = useState<any>(null)

  // Development mode flag - set to true to bypass API calls for testing
  const DEV_MODE = process.env.NODE_ENV === 'development'

  const boardRef = useRef<HTMLDivElement | null>(null)
  const scrollRafRef = useRef<number | null>(null)
  const pointerX = useRef<number | null>(null)
  const isScrollingRef = useRef(false)

  // Enhanced collision detection for better UX
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args)
    if (pointerCollisions.length > 0) {
      return pointerCollisions
    }

    // Fallback to closest center for better drop zones
    return closestCenter(args)
  }, [])

  // Enhanced sensors with better touch support
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Increased for better UX on touch devices
      },
    })
  )

  // Debounced auto-scroll function with improved performance
  const handleAutoScroll = useCallback(() => {
    if (!boardRef.current || pointerX.current == null || isScrollingRef.current) {
      return
    }

    const el = boardRef.current.querySelector('.kanban-columns') as HTMLElement | null
    if (!el) return

    const rect = el.getBoundingClientRect()
    const edge = 100 // Larger edge area for easier scrolling
    const x = pointerX.current
    const scrollSpeed = 25 // Slightly faster

    let shouldScroll = false
    if (x < rect.left + edge) {
      el.scrollLeft -= scrollSpeed
      shouldScroll = true
    } else if (x > rect.right - edge) {
      el.scrollLeft += scrollSpeed
      shouldScroll = true
    }

    if (shouldScroll) {
      isScrollingRef.current = true
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null
        isScrollingRef.current = false
        handleAutoScroll()
      })
    }
  }, [])

  // Optimized pointer move handler with debouncing
  const handlePointerMove = useCallback((e: PointerEvent) => {
    pointerX.current = e.clientX

    if (scrollRafRef.current == null && !isScrollingRef.current) {
      scrollRafRef.current = requestAnimationFrame(handleAutoScroll)
    }
  }, [handleAutoScroll])

  // Get opportunity by ID
  const findOpportunityById = useCallback((id: string) => {
    return opportunities.find(opp => opp.id === id)
  }, [opportunities])

  // Get stage by ID
  const findStageById = useCallback((id: string) => {
    return stages.find(stage => stage.id === id)
  }, [stages])

  // Optimized move function with better error handling
  const moveOpportunity = useCallback(async (
    opportunityId: string,
    destStageId: string,
    destIndex: number,
    oldStageId?: string,
  ) => {
    const opportunity = findOpportunityById(opportunityId)
    if (!opportunity) return

    const sourceStageId = oldStageId || opportunity.currentStageId
    const movedOpportunity = { ...opportunity, currentStageId: destStageId }

    // Optimistically update UI state
    setOpportunities((prev) => {
      const filtered = prev.filter((o) => o.id !== opportunityId)
      const destStageItems = filtered.filter((o) => o.currentStageId === destStageId)

      const updatedDestStageItems = [
        ...destStageItems.slice(0, destIndex),
        movedOpportunity,
        ...destStageItems.slice(destIndex),
      ]

      return stages.flatMap((stage) => {
        if (stage.id === destStageId) {
          return updatedDestStageItems
        } else if (stage.id === sourceStageId) {
          return filtered.filter((o) => o.currentStageId === sourceStageId)
        } else {
          return filtered.filter((o) => o.currentStageId === stage.id)
        }
      })
    })

    // Persist to backend with enhanced error handling OR simulate success in dev mode
    try {
      console.log(`[KANBAN] Moving ${opportunityId} to stage ${destStageId}`)

      if (DEV_MODE) {
        // In development mode, simulate successful API call
        await new Promise(resolve => setTimeout(resolve, 200)) // Simulate network delay
        console.log("[KANBAN] Dev mode: Simulating successful API call")
      } else {
        // Production mode: Make real API call
        const response = await fetch(`/api/opportunities/${opportunityId}/move`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stage: destStageId,
            index: destIndex,
            oldStageId: sourceStageId !== destStageId ? sourceStageId : undefined
          }),
        })

        console.log(`[KANBAN] API response status: ${response.status}`)

        if (!response.ok) {
          let errorMessage = `API call failed (${response.status})`
          try {
            const error = await response.json()
            errorMessage = error.error || errorMessage
            console.error(`[KANBAN] API error:`, error)
          } catch (jsonError) {
            console.error(`[KANBAN] Failed to parse error response:`, jsonError)
            const text = await response.text()
            console.error(`[KANBAN] Response text:`, text)
          }
          throw new Error(errorMessage)
        }

        const result = await response.json()
        console.log(`[KANBAN] API success:`, result)
      }

      // Success toast for better UX feedback
      toast({
        title: "Opportunity moved",
        description: `${opportunity.title} moved to ${findStageById(destStageId)?.name}${
          DEV_MODE ? ' (Dev Mode)' : ''
        }`,
      })

    } catch (error) {
      console.error(`[KANBAN] Move operation failed:`, error)

      // Revert optimistic update on error
      setOpportunities((prev) => {
        const reverted = prev.map((o) =>
          o.id === opportunityId ? opportunity : o
        )
        console.log(`[KANBAN] Reverted opportunities state:`, reverted)
        return reverted
      })

      toast({
        title: "Move failed",
        description: `Failed to move opportunity: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        variant: "destructive",
      })
    }
  }, [opportunities, stages, findOpportunityById, findStageById, toast])

  // Enhanced keyboard move handler with bounds checking
  const handleKeyboardMove = useCallback((opportunityId: string, direction: 'up' | 'down' | 'left' | 'right') => {
    const opportunity = findOpportunityById(opportunityId)
    if (!opportunity) return

    const stageIndex = stages.findIndex((s) => s.id === opportunity.currentStageId)
    const stageItems = opportunities.filter((o) => o.currentStageId === opportunity.currentStageId)
    const sourceIndex = stageItems.findIndex((i) => i.id === opportunityId)

    if (direction === 'up' && sourceIndex > 0) {
      void moveOpportunity(opportunityId, opportunity.currentStageId, sourceIndex - 1)
    } else if (direction === 'down' && sourceIndex < stageItems.length - 1) {
      void moveOpportunity(opportunityId, opportunity.currentStageId, sourceIndex + 1)
    } else if (direction === 'left' && stageIndex > 0) {
      const destStage = stages[stageIndex - 1]
      const destItems = opportunities.filter((o) => o.currentStageId === destStage.id)
      const destIndex = Math.min(sourceIndex, destItems.length)
      void moveOpportunity(opportunityId, destStage.id, destIndex)
    } else if (direction === 'right' && stageIndex < stages.length - 1) {
      const destStage = stages[stageIndex + 1]
      const destItems = opportunities.filter((o) => o.currentStageId === destStage.id)
      const destIndex = Math.min(sourceIndex, destItems.length)
      void moveOpportunity(opportunityId, destStage.id, destIndex)
    }
  }, [findOpportunityById, opportunities, stages, moveOpportunity])

  // Get opportunities for a specific stage
  const getOpportunitiesForStage = useCallback((stageId: string) => {
    return opportunities.filter((opp) => opp.currentStageId === stageId)
  }, [opportunities])

  // Enhanced drag start with better state management
  const onDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    console.log('[KANBAN] Enhanced drag started');

    const activeId = active.id as string
    const opportunity = findOpportunityById(activeId)

    setActiveId(activeId)
    setActiveItem(opportunity)
    setIsDragging(true)

    // Add pointer event listener for auto-scroll
    window.addEventListener('pointermove', handlePointerMove)

    // Improve performance during drag
    document.body.style.cursor = 'grabbing'
  }, [findOpportunityById, handlePointerMove])

  // Enhanced drag end with comprehensive cleanup
  const onDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    console.log('[KANBAN] Enhanced drag ended', { active: active.id, over: over?.id });

    if (!over) {
      cleanupDrag()
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const activeOpportunity = findOpportunityById(activeId)
    if (!activeOpportunity) {
      cleanupDrag()
      return
    }

    const activeStageId = activeOpportunity.currentStageId
    const isDroppingOverColumn = stages.find(stage => stage.id === overId)

    try {
      if (isDroppingOverColumn) {
        // Dropping over a column
        const destStageId = overId
        if (destStageId === activeStageId) {
          cleanupDrag()
          return
        }

        const destItems = getOpportunitiesForStage(destStageId)
        await moveOpportunity(activeId, destStageId, destItems.length, activeStageId)

      } else {
        // Dropping over another card
        const overOpportunity = findOpportunityById(overId)
        if (!overOpportunity) {
          cleanupDrag()
          return
        }

        const destStageId = overOpportunity.currentStageId
        const destItems = getOpportunitiesForStage(destStageId)
        const overIndex = destItems.findIndex(item => item.id === overId)

        if (activeStageId === destStageId) {
          const activeIndex = destItems.findIndex(item => item.id === activeId)
          if (activeIndex === overIndex) {
            cleanupDrag()
            return
          }
        }

        await moveOpportunity(activeId, destStageId, overIndex, activeStageId)
      }
    } finally {
      cleanupDrag()
    }
  }, [opportunities, stages, moveOpportunity, findOpportunityById, getOpportunitiesForStage])

  // Comprehensive cleanup function
  const cleanupDrag = useCallback(() => {
    console.log('[KANBAN] Enhanced drag cleanup');

    setActiveId(null)
    setActiveItem(null)
    setIsDragging(false)

    document.body.style.cursor = ''

    // Remove event listeners
    try {
      window.removeEventListener('pointermove', handlePointerMove)
    } catch (e) {
      // ignore
    }

    // Cancel any pending scroll operations
    if (scrollRafRef.current) {
      cancelAnimationFrame(scrollRafRef.current)
      scrollRafRef.current = null
    }
    isScrollingRef.current = false
  }, [handlePointerMove])

  // Enhanced drag cancel handler
  const onDragCancel = useCallback(() => {
    console.log('[KANBAN] Enhanced drag cancelled');
    cleanupDrag()
    toast({
      title: "Drag cancelled",
      description: "Drag operation was cancelled.",
    })
  }, [cleanupDrag, toast])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (scrollRafRef.current) {
        cancelAnimationFrame(scrollRafRef.current)
      }
      try {
        window.removeEventListener('pointermove', handlePointerMove)
      } catch (e) {
        // ignore
      }
    }
  }, [handlePointerMove])

  // Enhanced modal handlers
  const handleEdit = useCallback((opportunityId: string) => {
    const opp = opportunities.find((o) => o.id === opportunityId)
    setSelectedOpportunity(opp || null)
    setIsModalOpen(true)
  }, [opportunities])

  const handleDelete = useCallback(async (opportunityId: string) => {
    const opp = opportunities.find((o) => o.id === opportunityId)
    if (!opp) return

    if (!confirm(`Are you sure you want to delete "${opp.title}"?`)) return

    const original = opportunities
    setOpportunities((prev) => prev.filter((o) => o.id !== opportunityId))

    try {
      const res = await fetch(`/api/opportunities/${opportunityId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      toast({
        title: "Opportunity deleted",
        description: `"${opp.title}" has been removed from your pipeline.`,
      })
    } catch (err) {
      console.error('Delete failed', err)
      setOpportunities(original)
      toast({
        title: "Delete failed",
        description: "Failed to delete opportunity. Please try again.",
        variant: "destructive",
      })
    }
  }, [opportunities, toast])

  const handleModalSuccess = useCallback((updated?: any) => {
    setIsModalOpen(false)
    setSelectedOpportunity(null)
    if (updated) {
      setOpportunities((prev) => prev.map((o) => (o.id === updated.id ? updated : o)))
    }
  }, [])

  // Stage management handlers
  const handleAddStage = useCallback(() => {
    setSelectedStage(null)
    setStageFormData({ name: '', color: '#3b82f6' })
    setIsStageModalOpen(true)
  }, [])

  const handleEditStage = useCallback((stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    if (stage) {
      setSelectedStage(stage)
      setStageFormData({ name: stage.name, color: stage.color })
      setIsStageModalOpen(true)
    }
  }, [stages])

  const handleDeleteStage = useCallback(async (stageId: string) => {
    const stage = stages.find(s => s.id === stageId)
    const stageOpportunities = getOpportunitiesForStage(stageId)

    let message = `Are you sure you want to delete "${stage?.name}"?`
    if (stageOpportunities.length > 0) {
      message += `\n\nThis stage contains ${stageOpportunities.length} opportunity(ies). They will remain in the system but won't be visible in the kanban.`
    }

    if (!confirm(message)) return

    setStages(prev => prev.filter(s => s.id !== stageId))

    toast({
      title: "Stage deleted",
      description: `"${stage?.name}" has been removed.`,
    })
  }, [stages, getOpportunitiesForStage, toast])

  const handleStageModalSave = useCallback(() => {
    if (!stageFormData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Stage name is required.",
        variant: "destructive",
      })
      return
    }

    if (selectedStage) {
      setStages(prev => prev.map(s => s.id === selectedStage.id ? { ...s, ...stageFormData } : s))
      toast({
        title: "Stage updated",
        description: `"${stageFormData.name}" has been updated.`,
      })
    } else {
      const newStage = {
        id: `stage-${Date.now()}`,
        name: stageFormData.name.trim(),
        color: stageFormData.color,
        order: stages.length + 1
      }
      setStages(prev => [...prev, newStage])
      toast({
        title: "Stage created",
        description: `"${newStage.name}" has been added to your pipeline.`,
      })
    }

    setIsStageModalOpen(false)
    setSelectedStage(null)
    setStageFormData({ name: '', color: '#3b82f6' })
  }, [stageFormData, selectedStage, stages, toast])

  const handleStageModalClose = useCallback(() => {
    setIsStageModalOpen(false)
    setSelectedStage(null)
    setStageFormData({ name: '', color: '#3b82f6' })
  }, [])

  const totalValue = opportunities.reduce((sum, opp) => sum + (opp.estimatedValueMax || 0), 0)
  const formattedTotalValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(totalValue)

  return (
    <div className={`w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex flex-col relative overflow-hidden transition-all duration-200 ${isDragging ? 'drag-active' : ''}`}>
      {/* Enhanced decorative background */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-br from-blue-400/8 to-purple-400/8 rounded-full blur-3xl -translate-y-36 translate-x-36 bg-decoration-float"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-emerald-400/6 to-teal-400/6 rounded-full blur-3xl translate-y-48 -translate-x-48 bg-decoration-float" style={{animationDelay: '3s'}}></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-br from-rose-400/4 to-pink-400/4 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2 bg-decoration-float" style={{animationDelay: '1s'}}></div>

      {/* Enhanced header with better responsive design */}
      <div className="relative flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-6 px-6 md:px-8 border-b border-slate-200/60 bg-white/60 backdrop-blur-xl shadow-sm">
        <div className="flex items-center space-x-6">
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
            <p className="text-slate-600 font-medium">{opportunities.length} opportunities tracking • {formattedTotalValue} total value</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <Button
            variant="outline"
            className="text-slate-700 hover:text-slate-900 hover:border-slate-400 relative bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border-slate-200"
            onClick={handleAddStage}
            disabled={isDragging}
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
            onClick={() => { setIsModalOpen(true); setSelectedOpportunity(null); }}
            disabled={isDragging}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <Plus className="mr-2 h-5 w-5 relative z-10" />
            <span className="font-semibold relative z-10">Add Opportunity</span>
          </Button>
        </div>
      </div>

      {/* Enhanced kanban board area */}
      <div className="flex-1 overflow-hidden h-full min-h-0">
        <DndContext
          sensors={sensors}
          collisionDetection={customCollisionDetection}
          onDragEnd={onDragEnd}
          onDragStart={onDragStart}
          onDragCancel={onDragCancel}
          modifiers={[restrictToWindowEdges]}
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
                isDragging={isDragging}

              />
            ))}

            {/* Enhanced drag overlay with better visual feedback */}
            <DragOverlay>
              {activeItem && (
                <div className="rotate-2 scale-105 overflow-hidden">
                  <div className="bg-card/95 backdrop-blur-sm border rounded-lg p-4 shadow-2xl scale-105 border-primary/30 bg-gradient-to-br from-blue-50/90 to-indigo-50/90 ring-4 ring-primary/20">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight text-foreground line-clamp-2 mb-2">
                          {activeItem.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <div className="h-3 w-3 rounded-full bg-muted-foreground text-white flex items-center justify-center text-xs">
                            <span>•</span>
                          </div>
                          <span className="truncate">{activeItem.agency}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t text-xs">
                      <div className="text-xs bg-muted px-2 py-1 rounded">
                        Dragging...
                      </div>
                      <div className="text-xs text-primary font-semibold">
                        Stage: {findStageById(activeItem.currentStageId)?.name}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </DragOverlay>
          </div>
        </DndContext>
      </div>

      {/* Enhanced opportunity modal */}
      {isModalOpen && (
        <OpportunityModal
          isOpen={isModalOpen}
          opportunity={selectedOpportunity}
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      )}

      {/* Enhanced stage management modal */}
      <Dialog open={isStageModalOpen} onOpenChange={setIsStageModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full border-2 border-white shadow-md"
                style={{ backgroundColor: stageFormData.color }}
              ></div>
              {selectedStage ? 'Edit Stage' : 'Add New Stage'}
            </DialogTitle>
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
                autoFocus
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
                title="Choose stage color"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleStageModalClose}>
              Cancel
            </Button>
            <Button onClick={handleStageModalSave} disabled={!stageFormData.name.trim()}>
              {selectedStage ? 'Update Stage' : 'Add Stage'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
