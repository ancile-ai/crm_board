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
          where: { samGovId: opp.noticeId },
        })

        if (existing) {
          continue // Skip if already imported
        }

        // Parse contract value
        let value = null
        if (opp.award?.amount) {
          const amountStr = opp.award.amount.replace(/[$,]/g, "")
          const parsedAmount = Number.parseFloat(amountStr)
          if (!isNaN(parsedAmount)) {
            value = parsedAmount
          }
        }

        // Map set-aside type
        const setAsideMapping: { [key: string]: string } = {
          SBA: "SMALL_BUSINESS",
          WOSB: "WOMAN_OWNED",
          VOSB: "VETERAN_OWNED",
          SDVOSB: "SERVICE_DISABLED_VETERAN",
          HUBZONE: "HUBZONE",
          "8A": "8A",
        }

        const setAsideType = setAsideMapping[opp.typeOfSetAside] || "NO_SET_ASIDE"

        // Create opportunity
        const opportunity = await db.opportunity.create({
          data: {
            title: opp.title,
            description: opp.description || `${opp.department} - ${opp.office}`,
            stage: "LEAD",
            priority: "MEDIUM",
            value,
            closeDate: opp.responseDeadLine ? new Date(opp.responseDeadLine) : null,
            samGovId: opp.noticeId,
            naicsCode: opp.naicsCode,
            setAsideType,
            contractType: "NO_CONTRACT_TYPE",
            placeOfPerformance: `${opp.department}, ${opp.office}`,
            createdById: session.user.id,
          },
        })

        importedOpportunities.push(opportunity)

        // Create activity log
        await db.activity.create({
          data: {
            type: "NOTE",
            description: `Imported from SAM.gov - Solicitation: ${opp.solicitationNumber}`,
            opportunityId: opportunity.id,
            userId: session.user.id,
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
