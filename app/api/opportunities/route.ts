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
        ...(stage && { currentStageId: stage }),
        ...(priority && { priority: priority as any }),
        ...(assignedTo && { assignedToId: assignedTo }),
      },
      include: {
        company: true,
        assignedTo: true,
        currentStage: true,
        contacts: true,
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
      opportunityUrl,
    } = body

    // Get the first stage (Lead Generation) from the default pipeline
    const defaultPipeline = await db.pipeline.findFirst({
      where: { isDefault: true },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          take: 1
        }
      }
    })

    if (!defaultPipeline || !defaultPipeline.stages.length) {
      return NextResponse.json({ error: "Default pipeline with stages not found" }, { status: 500 })
    }

    const defaultStageId = defaultPipeline.stages[0].id

    // Get user ID from email if assignedToId not provided
    let finalAssignedToId = assignedToId;
    if (!assignedToId) {
      const user = await db.user.findUnique({
        where: { email: session.user.email! },
        select: { id: true }
      });
      if (user) {
        finalAssignedToId = user.id;
      }
    }

    // Get company information if provided
    let agency = "Unknown Agency"
    if (companyId) {
      const company = await db.company.findUnique({
        where: { id: companyId },
        select: { name: true }
      })
      if (company) {
        agency = company.name
      }
    }

    const opportunity = await (db.opportunity as any).create({
      data: {
        title,
        keyRequirements: description,
        agency: agency,
        contractVehicle: "SAM.gov",
        solicitationNumber: samGovId || null,
        estimatedValueMin: null,
        estimatedValueMax: value ? Number.parseInt(value) : null,
        dueDate: closeDate ? new Date(closeDate) : null,
        currentStageId: defaultStageId,
        companyId: companyId || null,
        assignedToId: finalAssignedToId,
        naicsCodes: naicsCode ? [naicsCode] : [],
        setAsideType: setAsideType as any,
        opportunityType: contractType === "NO_CONTRACT_TYPE" ? "RFP" : (contractType as any) || "RFP",
        priority: priority || "MEDIUM",
        probability: 50,
        technicalFocus: [],
        teamingPartners: [],
        opportunityUrl: opportunityUrl || null,
      },
    })

    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error("Error creating opportunity:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
