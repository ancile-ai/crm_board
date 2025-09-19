"use client"

import { useState } from "react"
import { KanbanColumn } from "./kanban-column"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

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

  const getOpportunitiesForStage = (stageId: string) => {
    return opportunities.filter((opp) => opp.currentStageId === stageId)
  }

  const handleMoveOpportunity = (opportunityId: string, newStageId: string) => {
    setOpportunities((prev) =>
      prev.map((opp) => (opp.id === opportunityId ? { ...opp, currentStageId: newStageId } : opp)),
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-foreground">Pipeline Overview</h2>
          <div className="text-sm text-muted-foreground">{opportunities.length} total opportunities</div>
        </div>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Add Opportunity
        </Button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            opportunities={getOpportunitiesForStage(stage.id)}
            onMoveOpportunity={handleMoveOpportunity}
          />
        ))}
      </div>
    </div>
  )
}
