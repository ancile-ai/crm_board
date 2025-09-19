"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, DollarSign, Building, FileText, Clock, AlertTriangle, TrendingUp } from "lucide-react"
import { format, differenceInDays } from "date-fns"

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
  onMove: (opportunityId: string, newStageId: string) => void
}

export function OpportunityCard({ opportunity, onMove }: OpportunityCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-destructive text-destructive-foreground"
      case "HIGH":
        return "bg-chart-1 text-white"
      case "MEDIUM":
        return "bg-accent text-accent-foreground"
      case "LOW":
        return "bg-muted text-muted-foreground"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const getDaysUntilDue = () => {
    if (!opportunity.dueDate) return null
    const days = differenceInDays(opportunity.dueDate, new Date())
    return days
  }

  const daysUntilDue = getDaysUntilDue()
  const isOverdue = daysUntilDue !== null && daysUntilDue < 0
  const isUrgent = daysUntilDue !== null && daysUntilDue <= 7 && daysUntilDue >= 0

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow bg-background border-border">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm text-foreground leading-tight line-clamp-2">{opportunity.title}</h3>
          <Badge className={`text-xs flex-shrink-0 ${getPriorityColor(opportunity.priority)}`}>
            {opportunity.priority}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Building className="h-3 w-3" />
          <span className="truncate">{opportunity.agency}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <FileText className="h-3 w-3" />
          <span>{opportunity.contractVehicle}</span>
          {opportunity.solicitationNumber && (
            <span className="text-xs bg-muted px-1 py-0.5 rounded">{opportunity.solicitationNumber}</span>
          )}
        </div>

        {(opportunity.estimatedValueMin || opportunity.estimatedValueMax) && (
          <div className="flex items-center gap-2 text-xs">
            <DollarSign className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {opportunity.estimatedValueMin && opportunity.estimatedValueMax
                ? `${formatCurrency(opportunity.estimatedValueMin)} - ${formatCurrency(opportunity.estimatedValueMax)}`
                : formatCurrency(opportunity.estimatedValueMax || opportunity.estimatedValueMin || 0)}
            </span>
          </div>
        )}

        {opportunity.dueDate && (
          <div
            className={`flex items-center gap-2 text-xs ${
              isOverdue ? "text-destructive" : isUrgent ? "text-chart-1" : "text-muted-foreground"
            }`}
          >
            <Calendar className="h-3 w-3" />
            <span>Due: {format(opportunity.dueDate, "MMM dd, yyyy")}</span>
            {isOverdue && <AlertTriangle className="h-3 w-3" />}
            {isUrgent && <Clock className="h-3 w-3" />}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          <span className="text-foreground font-medium">{opportunity.probability}% probability</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {opportunity.technicalFocus.slice(0, 2).map((focus, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {focus}
            </Badge>
          ))}
          {opportunity.technicalFocus.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{opportunity.technicalFocus.length - 2} more
            </Badge>
          )}
        </div>

        <Badge className="w-fit text-xs bg-secondary text-secondary-foreground">{opportunity.opportunityType}</Badge>
      </CardContent>
    </Card>
  )
}
