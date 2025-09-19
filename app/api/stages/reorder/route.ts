export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

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
    const { stages } = body

    if (!stages || !Array.isArray(stages)) {
      return NextResponse.json({ error: "Stages array is required" }, { status: 400 })
    }

    // Get the default pipeline
    const pipeline = await db.pipeline.findFirst({
      where: { isDefault: true },
    })

    if (!pipeline) {
      return NextResponse.json({ error: "Default pipeline not found" }, { status: 404 })
    }

    // Update all stages with the new order
    const updatePromises = stages.map((stageUpdate: { id: string; order: number }) => {
      return db.stage.update({
        where: { id: stageUpdate.id },
        data: { order: stageUpdate.order }
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
