import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { opportunities } = await request.json()

    if (!Array.isArray(opportunities)) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 })
    }

    const importedOpportunities = []

    for (const opp of opportunities) {
      try {
        // Check if opportunity already exists
        const existing = await db.opportunity.findFirst({
          where: { solicitationNumber: opp.noticeId },
        })

        if (existing) {
          continue // Skip if already imported
        }

        // Get user
        const user = await db.user.findUnique({
          where: { email: session.user.email }
        })

        if (!user) {
          throw new Error("User not found")
        }

        // Parse contract value
        let estimatedValueMax = null
        if (opp.award?.amount) {
          const amountStr = opp.award.amount.replace(/[$,]/g, "")
          const parsedAmount = Number.parseFloat(amountStr)
          if (!isNaN(parsedAmount)) {
            estimatedValueMax = parsedAmount
          }
        }

        // Map set-aside type
        const setAsideMapping = {
          SBA: "SMALL_BUSINESS",
          WOSB: "WOSB",
          VOSB: "VOSB",
          SDVOSB: "SDVOSB",
          HUBZONE: "HUBZONE",
          "8A": "EIGHT_A",
        } as const

        const setAsideType = setAsideMapping[opp.typeOfSetAside as keyof typeof setAsideMapping] || null

        // Create opportunity
        const opportunity = await db.opportunity.create({
          data: {
            title: opp.title,
            keyRequirements: opp.description || `${opp.department} - ${opp.office}`,
            agency: opp.department || "Unknown Agency",
            contractVehicle: opp.office || "SAM.gov",
            solicitationNumber: opp.noticeId,
            estimatedValueMax,
            currentStageId: "default-lead-stage",
            dueDate: opp.responseDeadLine ? new Date(opp.responseDeadLine) : null,
            naicsCodes: opp.naicsCode ? [opp.naicsCode] : [],
            setAsideType,
            opportunityType: "RFP",
            priority: "MEDIUM" as const,
            technicalFocus: [],
            teamingPartners: [],
          },
        })

        importedOpportunities.push(opportunity)

        // Create comment log
        await db.comment.create({
          data: {
            content: `Imported from SAM.gov - Solicitation: ${opp.solicitationNumber}`,
            opportunityId: opportunity.id,
            userId: user.id,
          },
        })
      } catch (error) {
        console.error(`Error importing opportunity ${opp.noticeId}:`, error)
        continue
      }
    }

    return NextResponse.json({
      message: `Successfully imported ${importedOpportunities.length} opportunities`,
      imported: importedOpportunities.length,
      total: opportunities.length,
    })
  } catch (error) {
    console.error("Error importing opportunities:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
