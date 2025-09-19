import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { stage, index } = await request.json()

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

    // Find the user to get their ID for stage history
    const user = await db.user.findFirst({
      where: { email: session.user.email },
      select: { id: true }
    })

    // Create stage history entry instead of activity
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
