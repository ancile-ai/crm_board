import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the first pipeline's stages (fallback to any pipeline if no default)
    let pipeline = await db.pipeline.findFirst({
      where: { isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    })

    // If no default pipeline, get any pipeline
    if (!pipeline) {
      pipeline = await db.pipeline.findFirst({
        include: {
          stages: {
            orderBy: { order: 'asc' }
          }
        }
      })
    }

    if (!pipeline) {
      return NextResponse.json({ error: "No pipeline found" }, { status: 404 })
    }

    return NextResponse.json(pipeline.stages)

  } catch (error) {
    console.error("Error fetching stages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PATCH endpoint for reordering stages
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { stageId, newOrder, stages } = body

    if (stages) {
      // Handle reordering with complete stage list
      const updatePromises = stages.map((stage: { id: string }, index: number) => {
        const order = index + 1
        return db.stage.update({
          where: { id: stage.id },
          data: { order }
        })
      })
      await Promise.all(updatePromises)
    } else if (stageId && typeof newOrder === 'number') {
      // Handle single stage reordering (legacy support)
      await db.stage.update({
        where: { id: stageId },
        data: { order: newOrder }
      })
    } else {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: "Stage orders updated successfully"
    })

  } catch (error) {
    console.error("Error updating stage orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
