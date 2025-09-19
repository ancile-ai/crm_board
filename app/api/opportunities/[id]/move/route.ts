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

    const { stage } = await request.json()

    const opportunity = await db.opportunity.update({
      where: { id: params.id },
      data: {
        stage,
        updatedAt: new Date(),
      },
      include: {
        company: true,
        assignedTo: true,
      },
    })

    // Create activity log for stage change
    await db.activity.create({
      data: {
        type: "STAGE_CHANGE",
        description: `Opportunity moved to ${stage}`,
        opportunityId: params.id,
        userId: session.user.id,
      },
    })

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error("Error moving opportunity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
