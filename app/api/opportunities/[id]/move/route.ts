import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

interface MoveOpportunityRequest {
  stage: string | undefined
  index?: number
  oldStageId?: string
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { stage, index, oldStageId } = await request.json() as MoveOpportunityRequest

    // Find the stage by ID or name to get the stage object
    const stageRecord = await db.stage.findFirst({
      where: {
        OR: [
          { id: stage },
          { name: stage }
        ]
      }
    })

    if (!stageRecord) {
      return NextResponse.json({ error: "Stage not found" }, { status: 404 })
    }

    // Update the opportunity's stage
    const opportunity = await db.opportunity.update({
      where: { id: params.id },
      data: {
        currentStageId: stageRecord.id,
        updatedAt: new Date(),
      },
      include: {
        assignedTo: true,
        currentStage: true,
      },
    })

    // Handle ordering within the stage if index and oldStageId are provided
    if (typeof index === 'number') {
      // If moving within the same stage, reorder other opportunities
      if (oldStageId && oldStageId !== stageRecord.id) {
        // Moving to different stage - we'll handle this on the frontend
        // as the client has the most current state
      } else if (oldStageId === stageRecord.id || !oldStageId) {
        // Reordering within same stage - update all opportunities in the stage
        // This would require more complex logic to reorder by index in the database
        // For now, we'll let the client manage ordering since Kanban boards
        // typically don't persist order in the database
      }
    }

    // Find the user to get their ID for stage history
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { id: true }
    })

    // Create stage history entry
    await db.stageHistory.create({
      data: {
        opportunityId: params.id,
        toStage: stageRecord.name,
        movedBy: user?.id,
      },
    })

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error("Error moving opportunity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
