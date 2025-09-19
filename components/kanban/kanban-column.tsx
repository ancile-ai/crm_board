"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { OpportunityCard } from "./opportunity-card"

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
  onMoveOpportunity: (opportunityId: string, newStageId: string) => void
}

export function KanbanColumn({ stage, opportunities, onMoveOpportunity }: KanbanColumnProps) {
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
    <div className="flex-shrink-0 w-80">
      <Card className="h-full bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
              {stage.name}
            </CardTitle>
            <Badge variant="secondary" className="bg-muted text-muted-foreground">
              {opportunities.length}
            </Badge>
          </div>
          {totalValue > 0 && (
            <div className="text-sm text-muted-foreground">Total Value: {formatCurrency(totalValue)}</div>
          )}
        </CardHeader>
        <CardContent className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} onMove={onMoveOpportunity} />
          ))}
          {opportunities.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No opportunities in this stage</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
