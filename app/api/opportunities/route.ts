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
    const stage = searchParams.get("stage")
    const priority = searchParams.get("priority")
    const assignedTo = searchParams.get("assignedTo")

    const opportunities = await db.opportunity.findMany({
      where: {
        ...(stage && { stage }),
        ...(priority && { priority }),
        ...(assignedTo && { assignedToId: assignedTo }),
      },
      include: {
        company: true,
        assignedTo: true,
        contacts: true,
        activities: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json(opportunities)
  } catch (error) {
    console.error("Error fetching opportunities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const opportunity = await db.opportunity.create({
      data: {
        title,
        description,
        stage,
        priority,
        value: value ? Number.parseFloat(value) : null,
        closeDate: closeDate ? new Date(closeDate) : null,
        companyId,
        assignedToId,
        samGovId,
        naicsCode,
        setAsideType,
        contractType,
        placeOfPerformance,
        createdById: session.user.id,
      },
      include: {
        company: true,
        assignedTo: true,
        contacts: true,
      },
    })

    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error("Error creating opportunity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
