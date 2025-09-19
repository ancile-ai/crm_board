"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Target, DollarSign, Users } from "lucide-react"

interface MetricsCardsProps {
  metrics: {
    totalOpportunities: number
    wonOpportunities: number
    conversionRate: number
    totalValue: number
  }
}

export function MetricsCards({ metrics }: MetricsCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const cards = [
    {
      title: "Total Opportunities",
      value: metrics.totalOpportunities.toString(),
      icon: Target,
      description: "Active opportunities in pipeline",
    },
    {
      title: "Won Opportunities",
      value: metrics.wonOpportunities.toString(),
      icon: TrendingUp,
      description: "Successfully closed deals",
    },
    {
      title: "Conversion Rate",
      value: `${metrics.conversionRate.toFixed(1)}%`,
      icon: Users,
      description: "Lead to win conversion",
    },
    {
      title: "Pipeline Value",
      value: formatCurrency(metrics.totalValue),
      icon: DollarSign,
      description: "Total contract value",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
