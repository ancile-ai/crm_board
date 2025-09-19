import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const opportunity = await db.opportunity.findUnique({
      where: { id: params.id },
      include: {
        assignedTo: true,
        currentStage: true,
      },
    })

    if (!opportunity) {
      return NextResponse.json({ error: "Opportunity not found" }, { status: 404 })
    }

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error("Error fetching opportunity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      stage,
      priority,
      value,
      closeDate,
      companyId,
      assignedToId,
      samGovId,
      naicsCode,
      setAsideType,
      contractType,
      placeOfPerformance,
    } = body

    const opportunity = await db.opportunity.update({
      where: { id: params.id },
      data: {
        title,
        // Consistent field mapping: use description consistently with keyRequirements
        keyRequirements: description,
        // Update related fields with consistent handling
        solicitationNumber: samGovId || null,
        estimatedValueMin: null,
        estimatedValueMax: value ? Number.parseInt(value) : null,
        dueDate: closeDate ? new Date(closeDate) : null,
        priority: priority || "MEDIUM",
        samGovLink: samGovId || null,
        naicsCodes: naicsCode ? [naicsCode] : [],
        updatedAt: new Date(),
      },
    })

    return NextResponse.json(opportunity)
  } catch (error) {
    console.error("Error updating opportunity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    await db.opportunity.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Opportunity deleted successfully" })
  } catch (error) {
    console.error("Error deleting opportunity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
