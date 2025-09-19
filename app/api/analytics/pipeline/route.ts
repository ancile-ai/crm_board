export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "30" // days

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - Number.parseInt(period))

    // Pipeline metrics by stage
    const pipelineData = await db.opportunity.groupBy({
      by: ["currentStageId"],
      _count: { _all: true },
      _sum: {
        estimatedValueMin: true,
        estimatedValueMax: true,
      },
      where: {
        createdAt: { gte: startDate },
      },
    })

    // Conversion rates
    const totalOpportunities = await db.opportunity.count({
      where: { createdAt: { gte: startDate } },
    })

    const wonOpportunities = await db.opportunity.count({
      where: {
        currentStage: {
          name: "WON"
        },
        createdAt: { gte: startDate },
      },
    })

    // Recent comments as activities
    const recentActivities = await db.comment.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        user: true,
        opportunity: {
          select: { title: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })

    // Top performers
    const topPerformers = await db.opportunity.groupBy({
      by: ["assignedToId"],
      _count: { _all: true },
      _sum: {
        estimatedValueMax: true,
      },
      where: {
        currentStage: {
          name: "WON"
        },
        createdAt: { gte: startDate },
      },
      orderBy: { _sum: { estimatedValueMax: "desc" } },
      take: 5,
    })

    // Get user details for top performers
    const userIds = topPerformers.map((p) => p.assignedToId).filter(Boolean) as string[]
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    })

    const topPerformersWithUsers = topPerformers.map((performer) => ({
      ...performer,
      user: users.find((u) => u.id === performer.assignedToId),
    }))

    const analytics = {
      pipeline: pipelineData,
      metrics: {
        totalOpportunities,
        wonOpportunities,
        conversionRate: totalOpportunities > 0 ? (wonOpportunities / totalOpportunities) * 100 : 0,
        totalValue: pipelineData.reduce((sum, stage) => sum + (stage._sum.estimatedValueMax || 0), 0),
      },
      recentActivities,
      topPerformers: topPerformersWithUsers,
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Error fetching analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
