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
    const company = searchParams.get("company")
    const closeDateFrom = searchParams.get("closeDateFrom")
    const closeDateTo = searchParams.get("closeDateTo")

    const opportunities = await db.opportunity.findMany({
      where: {
        ...(stage && { currentStageId: stage }),
        ...(priority && { priority: priority as any }),
        ...(assignedTo && { assignedToId: assignedTo }),
        ...(company && { companyId: company }),
        ...(closeDateFrom || closeDateTo ? {
          dueDate: {
            ...(closeDateFrom && { gte: new Date(closeDateFrom) }),
            ...(closeDateTo && { lte: new Date(closeDateTo) }),
          }
        } : {}),
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
  let body: any = null
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    body = await request.json()
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
    if (!assignedToId && session?.user?.email) {
      try {
        const user = await db.user.findUnique({
          where: { email: session.user.email },
          select: { id: true }
        });
        if (user) {
          finalAssignedToId = user.id;
        } else {
          console.warn(`User ${session.user.email} not found in database`);
          finalAssignedToId = null; // Set to null explicitly if user doesn't exist
        }
      } catch (error) {
        console.error('Error fetching user for assignment:', error);
        finalAssignedToId = null; // Set to null on error
      }
    } else if (!session?.user?.email) {
      console.warn('No user session available');
      finalAssignedToId = null; // No user to assign to
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

    // Safely parse the value to a number
    const parsedValue = value && !isNaN(Number(value)) ? Number(value) : null;

    // Map setAsideType from form to enum
    const mapSetAsideType = (type: string | undefined): any => {
      const mapping = {
        "SMALL_BUSINESS": "SMALL_BUSINESS",
        "EIGHT_A": "EIGHT_A",
        "HUBZONE": "HUBZONE",
        "WOSB": "WOSB",
        "VOSB": "VOSB",
        "SDVOSB": "SDVOSB",
      };
      return type && mapping[type as keyof typeof mapping] ? type : null;
    };

    // Map contractType from form to enum
    const mapOpportunityType = (type: string): any => {
      const mapping = {
        "FIXED_PRICE": "RFP",
        "COST_PLUS": "RFI",
        "TIME_AND_MATERIALS": "RFQ",
        "INDEFINITE_DELIVERY": "SOURCES_SOUGHT",
        "NO_CONTRACT_TYPE": "RFP",
      };
      return mapping[type as keyof typeof mapping] || "RFP";
    };

    // Map priority from form to enum
    const mapPriority = (priority: string): any => {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
      return validPriorities.includes(priority) ? priority : "MEDIUM";
    };

    const opportunity = await (db.opportunity as any).create({
      data: {
        title,
        keyRequirements: description || null,
        agency: agency,
        contractVehicle: "SAM.gov",
        solicitationNumber: samGovId || null,
        estimatedValueMin: null,
        estimatedValueMax: parsedValue,
        dueDate: closeDate ? new Date(closeDate) : null,
        currentStageId: defaultStageId,
        companyId: companyId || null,
        assignedToId: finalAssignedToId,
        naicsCodes: naicsCode ? [naicsCode] : [],
        setAsideType: mapSetAsideType(setAsideType),
        opportunityType: mapOpportunityType(contractType),
        priority: mapPriority(priority),
        probability: 50,
        technicalFocus: [],
        teamingPartners: [],
        opportunityUrl: opportunityUrl || null,
      },
    })

    return NextResponse.json(opportunity, { status: 201 })
  } catch (error) {
    console.error("Error creating opportunity:", error)
    console.error("Request body:", body)

    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.json({
      error: `Failed to create opportunity: ${errorMessage}`,
      details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    }, { status: 500 })
  }
}
