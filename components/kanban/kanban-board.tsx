"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, UniqueIdentifier, PointerSensor, useSensor, useSensors, closestCenter, pointerWithin, rectIntersection, CollisionDetection, useDroppable } from "@dnd-kit/core"
import { arrayMove } from "@dnd-kit/sortable"
import { restrictToWindowEdges } from "@dnd-kit/modifiers"
import KanbanColumn from "./kanban-column"
import { AddOpportunityModal } from "@/components/modals/add-opportunity-modal"
import { EditOpportunityModal } from "@/components/modals/edit-opportunity-modal"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

// Kanban Board Component

// Stage Drop Zone Component for reordering stages
function StageDropZone({ beforeIndex }: { beforeIndex: number }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `stage-position-${beforeIndex}`
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-16 h-full flex items-center justify-center transition-all duration-200 ${
        isOver
          ? 'bg-blue-100 border-2 border-blue-400 border-dashed rounded-xl shadow-sm'
          : 'bg-slate-50/50 border border-slate-200/50 border-dashed rounded-xl hover:bg-slate-100/70 hover:border-slate-300/70'
      }`}
      style={{ minWidth: '4rem' }}
    >
      {!isOver && (
        <div className="text-center text-slate-400 opacity-60">
          <div className="text-sm font-medium mb-1">↔</div>
          <div className="text-xs">Drop zone</div>
        </div>
      )}
      {isOver && (
        <div className="text-center text-blue-600">
          <div className="text-lg font-bold mb-1">⬇</div>
          <div className="text-xs font-medium">Drop here</div>
        </div>
      )}
    </div>
  )
}

export function KanbanBoard() {
  const [stages, setStages] = useState<any[]>([])
  const [opportunities, setOpportunities] = useState<any[]>([])
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
  const [activeStage, setActiveStage] = useState<any>(null)
  const [isStageDragging, setIsStageDragging] = useState(false)
  const [loading, setLoading] = useState(false)

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

  // Optimized collision detection specifically for stages (horizontal reordering)
  const stageCollisionDetection: CollisionDetection = useCallback((args) => {
    const { active, droppableRects, droppableContainers, collisionRect } = args

    // Only consider drop zones (not the drag overlay itself)
    const filteredContainers = droppableContainers.filter(container => {
      return !container.disabled && container.rect.current
    })

    const activeIdAsString = activeId as string

    if (filteredContainers.length === 0) return []

    // For horizontal stage reordering, prioritize left-right positioning
    const existingCollisions = filteredContainers.map(container => {
      const rect = container.rect.current
      if (!rect) return null

      const collisionAlgorithm = pointerWithin
      const collisions = collisionAlgorithm({
        ...args,
        droppableContainers: [container]
      })

      return collisions.length > 0 ? {
        id: container.id,
        data: container.data,
        rect,
        score: (container.id as string).includes('stage-position-') ? 0.1 : 0 // Prioritize drop zones
      } : null
    }).filter(Boolean)

    return existingCollisions as any
  }, [])

  // Optimized sensors for column drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 15, // Increased for more deliberate column drag start
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
    const scrollSpeed = 8 // Reduced speed for better control

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

    // Persist to backend
    try {
      console.log(`[KANBAN] Moving ${opportunityId} to stage ${destStageId}`)

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

      // Success toast for better UX feedback
      toast({
        title: "Opportunity moved",
        description: `${opportunity.title} moved to ${findStageById(destStageId)?.name}`,
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

  // Enhanced auto-refresh mechanism to sync with external changes
  useEffect(() => {
    let pollingInterval: NodeJS.Timeout
    let lastUpdateCheck = Date.now()
    let consecutiveFailures = 0
    const maxConsecutiveFailures = 3

    const pollForUpdates = async () => {
      // Only poll if not currently loading and not in the middle of drag operations
      if (!loading && !isDragging && !isStageDragging) {
        try {
          const opportunitiesResponse = await fetch('/api/opportunities', {
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          })

          if (opportunitiesResponse.ok) {
            const latestOpportunities = await opportunitiesResponse.json()
            const currentTime = Date.now()

            console.log('[KANBAN] Polling for updates...')
            console.log('[KANBAN] Latest opportunities from API:', latestOpportunities)
            console.log('[KANBAN] Current opportunities in state:', opportunities)

            // Check for actual changes by comparing key fields
            const hasChanges = latestOpportunities.length !== opportunities.length ||
              latestOpportunities.some((latestOpp: any) => {
                const currentOpp = opportunities.find(opp => opp.id === latestOpp.id)
                if (!currentOpp) return true // New opportunity

                console.log('[KANBAN] Comparing opportunity:', latestOpp.id)

                // Check if any important fields have changed
                const changedFields = [
                  'title', 'agency', 'priority', 'probability', 'currentStageId',
                  'estimatedValueMax', 'dueDate', 'updatedAt'
                ]

                return changedFields.some(field => {
                  if (field === 'dueDate') {
                    const latestDate = latestOpp.dueDate ? new Date(latestOpp.dueDate).getTime() : null
                    const currentDate = currentOpp.dueDate ? currentOpp.dueDate.getTime() : null
                    return latestDate !== currentDate
                  }
                  console.log(`[KANBAN] Comparing ${field}: ${latestOpp[field]} vs ${currentOpp[field]}`)
                  return latestOpp[field] !== currentOpp[field]
                })
              })

            console.log(`[KANBAN] Has changes detected: ${hasChanges}`)

            if (hasChanges) {
              console.log('[KANBAN] Detected external changes, updating opportunities')
              setOpportunities(latestOpportunities.map((opp: any) => ({
                id: opp.id,
                title: opp.title,
                description: opp.description || "",
                agency: opp.agency || "",
                contractVehicle: opp.contractVehicle || "",
                solicitationNumber: opp.solicitationNumber || "",
                estimatedValueMin: opp.estimatedValueMin || 0,
                estimatedValueMax: opp.estimatedValueMax || 0,
                dueDate: opp.dueDate ? new Date(opp.dueDate) : undefined,
                currentStageId: opp.currentStageId,
                stage: "LEAD",
                priority: opp.priority || "MEDIUM",
                probability: opp.probability || 0,
                opportunityType: opp.opportunityType || "RFP",
                technicalFocus: opp.technicalFocus || [],
                value: opp.estimatedValueMax?.toString() || "0",
                closeDate: opp.dueDate || "",
                companyId: opp.companyId || "",
                assignedToId: opp.assignedToId || "",
                samGovId: opp.samGovId || "",
                naicsCode: opp.naicsCodes?.[0] || "",
                setAsideType: opp.setAsideType,
                contractType: opp.contractType,
                placeOfPerformance: opp.placeOfPerformance || "",
                opportunityUrl: opp.opportunityUrl || "",
              })))

              // Reset failure count on successful sync
              consecutiveFailures = 0
              lastUpdateCheck = currentTime

              // Only show toast if it's been more than a minute since last sync to avoid spam
              if (currentTime - lastUpdateCheck > 60000) {
                console.log('[KANBAN] Data synced automatically')
              }
            }

            // Reset consecutive failures on success
            consecutiveFailures = 0
          } else {
            consecutiveFailures++
            console.warn(`[KANBAN] Polling failed: ${opportunitiesResponse.status}`)
          }
        } catch (error) {
          consecutiveFailures++
          console.warn('[KANBAN] Polling error:', error)
        }
      }

      // Adaptive polling: increase interval if there are consecutive failures
      const baseInterval = 15000 // 15 seconds
      const currentInterval = baseInterval * Math.pow(2, Math.min(consecutiveFailures, 3))

      pollingInterval = setTimeout(pollForUpdates, currentInterval)
    }

    // Start polling
    pollingInterval = setTimeout(pollForUpdates, 15000) // Initial delay of 15 seconds

    return () => {
      if (pollingInterval) {
        clearTimeout(pollingInterval)
      }
    }
  }, [opportunities.length, loading, isDragging, isStageDragging])



  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        // Load stages from API
        const stagesResponse = await fetch('/api/stages')
        if (stagesResponse.ok) {
          const pipelineStages = await stagesResponse.json()
          if (pipelineStages.length > 0) {
            setStages(pipelineStages.map((stage: any) => ({
              id: stage.id,
              name: stage.name,
              color: stage.color,
              order: stage.order
            })))
          }
        }

        // Load opportunities from API
        const opportunitiesResponse = await fetch('/api/opportunities')
        if (opportunitiesResponse.ok) {
          const pipelineOpportunities = await opportunitiesResponse.json()
          setOpportunities(pipelineOpportunities.map((opp: any) => ({
            id: opp.id,
            title: opp.title,
            description: opp.description || "",
            agency: opp.agency || "",
            contractVehicle: opp.contractVehicle || "",
            solicitationNumber: opp.solicitationNumber || "",
            estimatedValueMin: opp.estimatedValueMin || 0,
            estimatedValueMax: opp.estimatedValueMax || 0,
            dueDate: opp.dueDate ? new Date(opp.dueDate) : undefined,
            currentStageId: opp.currentStageId,
            stage: "LEAD",
            priority: opp.priority || "MEDIUM",
            probability: opp.probability || 0,
            opportunityType: opp.opportunityType || "RFP",
            technicalFocus: opp.technicalFocus || [],
            value: opp.estimatedValueMax?.toString() || "0",
            closeDate: opp.dueDate || "",
            companyId: opp.companyId || "",
            assignedToId: opp.assignedToId || "",
            samGovId: opp.samGovId || "",
            naicsCode: opp.naicsCodes?.[0] || "",
            setAsideType: opp.setAsideType,
            contractType: opp.contractType,
            placeOfPerformance: opp.placeOfPerformance || "",
            opportunityUrl: opp.opportunityUrl || "", // Add missing field
          })))
        }
      } catch (error) {
        console.error("[KANBAN] Error loading data:", error)
        toast({
          title: "Error loading data",
          description: "Failed to load pipeline data. Please refresh the page.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // Enhanced modal handlers
  const handleEdit = useCallback((opportunityId: string) => {
    const opp = opportunities.find((o) => o.id === opportunityId)
    setSelectedOpportunity(opp || null)
    setIsModalOpen(true)
  }, [opportunities])

  const handleDelete = useCallback(async (opportunityId: string) => {
    const opp = opportunities.find((o) => o.id === opportunityId)
    if (!opp) return

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
      // Transform the updated data from API response to match frontend format
      const transformedOpportunity = {
        id: updated.id,
        title: updated.title,
        description: updated.keyRequirements || "", // Convert from keyRequirements back to description
        agency: updated.agency || "",
        contractVehicle: updated.contractVehicle || "",
        solicitationNumber: updated.solicitationNumber || "",
        estimatedValueMin: updated.estimatedValueMin || 0,
        estimatedValueMax: updated.estimatedValueMax || 0,
        dueDate: updated.dueDate ? new Date(updated.dueDate) : undefined,
        currentStageId: updated.currentStageId,
        stage: "LEAD",
        priority: updated.priority || "MEDIUM",
        probability: updated.probability || 0,
        opportunityType: updated.opportunityType || "RFP",
        technicalFocus: updated.technicalFocus || [],
        value: updated.estimatedValueMax?.toString() || "0",
        closeDate: updated.dueDate || "",
        companyId: updated.companyId || "",
        assignedToId: updated.assignedToId || "",
        samGovId: updated.samGovId || "",
        naicsCode: updated.naicsCodes?.[0] || "",
        setAsideType: updated.setAsideType,
        contractType: updated.contractType,
        placeOfPerformance: updated.placeOfPerformance || "",
        opportunityUrl: updated.opportunityUrl || "" // Ensure this field is included
      }

      setOpportunities((prev) => {
        const exists = prev.some((o) => o.id === updated.id)
        if (exists) {
          return prev.map((o) => (o.id === updated.id ? transformedOpportunity : o))
        } else {
          return [...prev, transformedOpportunity]
        }
      })
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

    setStages(prev => prev.filter(s => s.id !== stageId))

    toast({
      title: "Stage deleted",
      description: `"${stage?.name}" has been removed.`,
    })
  }, [stages, toast])

  // Stage reordering functionality
  const onStageDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event
    console.log('[STAGES] Stage drag started');

    const activeId = active.id as string
    const stageId = activeId.replace('_stage', '') // Remove _stage suffix
    const stage = stages.find(s => s.id === stageId)

    console.log('[STAGES] Looking for stage:', stageId, 'Found stage:', stage);

    setActiveId(activeId)
    setActiveStage(stage)
    setIsStageDragging(true)

    document.body.style.cursor = 'grabbing'
  }, [stages])

  const onStageDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event
    console.log('[STAGES] Stage drag ended', { active: active.id, over: over?.id });

    if (!over) {
      cleanupStageDrag()
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const stageId = activeId.replace('_stage', '') // Remove _stage suffix
    const activeIndex = stages.findIndex(stage => stage.id === stageId)

    console.log('[STAGES] Stage ID:', stageId, 'Active Index:', activeIndex);

    if (activeIndex === -1) {
      cleanupStageDrag()
      return
    }

    // Determine the target position based on drop zone or stage
    let targetIndex = -1

    if (overId.includes('stage-position-')) {
      // Dropping on a stage position drop zone
      const positionIndex = parseInt(overId.replace('stage-position-', ''), 10)
      targetIndex = positionIndex
    } else {
      // Dropping on another stage - insert after the over stage
      const overStageId = overId.replace('_stage', '') // Remove _stage suffix if present
      const overIndex = stages.findIndex(stage => stage.id === overStageId)
      if (overIndex === -1) {
        console.log('[STAGES] Could not find stage with ID:', overStageId, 'from overId:', overId);
        cleanupStageDrag()
        return
      }
      // If dropping on another stage, insert at the over stage's position (before it)
      targetIndex = overIndex
    }

    // Don't reorder if dropping in the same position
    if (targetIndex === activeIndex) {
      cleanupStageDrag()
      return
    }

    // Reorder stages locally - move item from activeIndex to targetIndex
    const reorderedStages = arrayMove(stages, activeIndex, targetIndex)

    // Update orders in the reordered array
    const updatedStages = reorderedStages.map((stage, index) => ({
      ...stage,
      order: index + 1
    }))

    setStages(updatedStages)

    // Persist to backend
    try {
      // Send the complete new order to the API
      const stageUpdates = updatedStages.map((stage, index) => ({
        id: stage.id,
        order: index + 1
      }))

      const response = await fetch(`/api/stages/reorder`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stages: stageUpdates }),
      })

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('[STAGES] API success:', result)

      toast({
        title: "Stages reordered",
        description: "Pipeline stages have been reordered successfully.",
      })

    } catch (error) {
      console.error('[STAGES] Stage reorder failed:', error)

      // Revert optimistic update on error
      setStages(stages)

      toast({
        title: "Reorder failed",
        description: "Failed to reorder stages. Please try again.",
        variant: "destructive",
      })
    } finally {
      cleanupStageDrag()
    }
  }, [stages, toast])

  const onStageDragCancel = useCallback(() => {
    console.log('[STAGES] Stage drag cancelled');
    cleanupStageDrag()
    toast({
      title: "Stage drag cancelled",
      description: "Stage reordering was cancelled.",
    })
  }, [])

  const cleanupStageDrag = useCallback(() => {
    console.log('[STAGES] Stage drag cleanup');

    setActiveId(null)
    setActiveStage(null)
    setIsStageDragging(false)

    document.body.style.cursor = ''
  }, [])

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
          collisionDetection={(args) => {
            const { active } = args
            const activeId = (active.id as string)

            // Determine if we're dragging a stage or an opportunity
            if (activeId.includes('_stage')) {
              // Use simple rect intersection for stage dragging
              return rectIntersection(args)
            }

            return customCollisionDetection(args)
          }}
          onDragEnd={(event) => {
            const { active } = event
            const activeId = active.id as string

            // Route to appropriate handler
            if (activeId.includes('_stage')) {
              onStageDragEnd(event)
            } else {
              onDragEnd(event)
            }
          }}
          onDragStart={(event) => {
            const { active } = event
            const activeId = active.id as string

            // Route to appropriate handler
            if (activeId.includes('_stage')) {
              onStageDragStart(event)
            } else {
              onDragStart(event)
            }
          }}
          onDragCancel={(event) => {
            const { active } = event
            const activeId = active.id as string

            // Route to appropriate handler
            if (activeId.includes('_stage')) {
              onStageDragCancel()
            } else {
              onDragCancel()
            }
          }}
          modifiers={[restrictToWindowEdges]}
        >
          <div ref={boardRef} className="kanban-columns h-full flex items-start gap-6 md:gap-8 overflow-x-auto pb-4 px-6 md:px-8">
            {stages.map((stage, index) => (
              <div key={`stage-wrapper-${stage.id}`} className="flex items-start">
                {/* Stage Drop Zone Before Each Column (including first) */}
                {isStageDragging && (
                  <StageDropZone beforeIndex={index} />
                )}

                <KanbanColumn
                  index={index}
                  stage={stage}
                  opportunities={getOpportunitiesForStage(stage.id)}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onKeyboardMove={handleKeyboardMove}
                  onEditStage={handleEditStage}
                  onDeleteStage={handleDeleteStage}
                  isDragging={isDragging}
                  isStageDraggingActive={isStageDragging}
                />
              </div>
            ))}

            {/* Stage Drop Zone at the End */}
            {isStageDragging && (
              <StageDropZone beforeIndex={stages.length} />
            )}
          </div>

          {/* Enhanced drag overlay with better visual feedback */}
          <DragOverlay>
            {activeStage && (
              <div className="rotate-2 scale-105 opacity-90">
                <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/60 min-w-[24rem] w-96 md:w-[28rem] max-h-96 overflow-hidden">
                  {/* Column Header */}
                  <div className="bg-gradient-to-r from-white via-slate-50/80 to-white backdrop-blur-md border-b border-slate-200/60 rounded-t-2xl">
                    <div className="flex items-center justify-between px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div
                            className="w-5 h-5 rounded-full shadow-lg ring-2 ring-white flex-shrink-0"
                            style={{ backgroundColor: activeStage.color }}
                          ></div>
                          <div className="absolute inset-0 rounded-full" style={{ backgroundColor: activeStage.color, opacity: 0.3 }}></div>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 leading-tight tracking-tight">{activeStage.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="bg-gradient-to-r from-slate-100 to-slate-200 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 shadow-sm border border-slate-300/50">
                          {getOpportunitiesForStage(activeStage.id).length}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Show preview of opportunities */}
                  <div className="bg-slate-50/60 rounded-b-2xl p-4">
                    {getOpportunitiesForStage(activeStage.id).length === 0 ? (
                      <div className="flex items-center justify-center py-8 text-slate-500">
                        <span>Empty stage</span>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-hidden">
                        {getOpportunitiesForStage(activeStage.id).slice(0, 3).map((opp, index) => (
                          <div key={opp.id} className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
                            <div className="flex items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-slate-900 line-clamp-1 mb-1">{opp.title}</h4>
                                <div className="text-xs text-slate-500 line-clamp-1">{opp.agency}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {getOpportunitiesForStage(activeStage.id).length > 3 && (
                          <div className="text-center text-sm text-slate-500 py-2">
                            ...and {getOpportunitiesForStage(activeStage.id).length - 3} more
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
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
        </DndContext>
      </div>

      {/* New opportunity modals */}
      <AddOpportunityModal
        isOpen={isModalOpen && !selectedOpportunity}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <EditOpportunityModal
        isOpen={isModalOpen && !!selectedOpportunity}
        opportunity={selectedOpportunity}
        onClose={() => { setIsModalOpen(false); setSelectedOpportunity(null); }}
        onSuccess={handleModalSuccess}
      />

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
