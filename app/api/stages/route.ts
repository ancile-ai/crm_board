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

    // Get the default pipeline's stages
    const pipeline = await db.pipeline.findFirst({
      where: { isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!pipeline) {
      return NextResponse.json({ error: "Default pipeline not found" }, { status: 404 })
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

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const body = await request.json()
    const { stageId, newOrder } = body

    if (!stageId || typeof newOrder !== 'number') {
      return NextResponse.json({ error: "Stage ID and new order are required" }, { status: 400 })
    }

    // Get the default pipeline
    const pipeline = await db.pipeline.findFirst({
      where: { isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    })

    if (!pipeline) {
      return NextResponse.json({ error: "Default pipeline not found" }, { status: 404 })
    }

    // Update all stages with new order based on their sorted positions
    const updatePromises = pipeline.stages.map((stage, index) => {
      const order = index + 1
      return db.stage.update({
        where: { id: stage.id },
        data: { order }
      })
    })

    await Promise.all(updatePromises)

    return NextResponse.json({
      success: true,
      message: "Stage orders updated successfully"
    })

  } catch (error) {
    console.error("Error updating stage orders:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
