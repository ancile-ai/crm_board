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

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get the default pipeline for the user, or get the first pipeline if none is marked as default
    let pipeline = await db.pipeline.findFirst({
      where: { isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!pipeline) {
      // If no default pipeline exists, create one
      pipeline = await db.pipeline.create({
        data: {
          name: "Default Pipeline",
          description: "Default sales pipeline",
          isDefault: true,
        },
        include: {
          stages: {
            orderBy: { order: 'asc' }
          }
        }
      })

      // Create default stages if none exist
      if (pipeline.stages.length === 0) {
        await db.stage.createMany({
          data: [
            { name: "Lead Generation", color: "#3b82f6", order: 1, pipelineId: pipeline.id },
            { name: "Qualification", color: "#f59e0b", order: 2, pipelineId: pipeline.id },
            { name: "Proposal Development", color: "#8b5cf6", order: 3, pipelineId: pipeline.id },
            { name: "Submitted/Under Review", color: "#06b6d4", order: 4, pipelineId: pipeline.id },
            { name: "Won/Lost/Closed", color: "#10b981", order: 5, pipelineId: pipeline.id },
          ]
        })

        // Get the pipeline again with stages
        pipeline = await db.pipeline.findFirst({
          where: { id: pipeline.id },
          include: {
            stages: {
              orderBy: { order: 'asc' }
            }
          }
        })
      }
    }

    return NextResponse.json(pipeline)

  } catch (error) {
    console.error("Error fetching pipeline:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
