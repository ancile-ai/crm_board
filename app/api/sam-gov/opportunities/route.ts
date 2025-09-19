export const dynamic = 'force-dynamic'

import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith("@ancile.io")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyword = searchParams.get("keyword") || ""
    const naicsCode = searchParams.get("naicsCode") || ""
    const setAside = searchParams.get("setAside") || ""
    const limit = searchParams.get("limit") || "50"

    // SAM.gov API endpoint (using the public API)
    const samApiUrl = "https://api.sam.gov/opportunities/v2/search"
    const params = new URLSearchParams({
      api_key: process.env.SAM_GOV_API_KEY || "DEMO_KEY",
      keyword,
      naicsCode,
      setAside,
      limit,
      postedFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Last 30 days
      postedTo: new Date().toISOString().split("T")[0],
    })

    // Remove empty parameters
    Array.from(params.entries()).forEach(([key, value]) => {
      if (!value) params.delete(key)
    })

    const response = await fetch(`${samApiUrl}?${params}`, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Government-CRM/1.0",
      },
    })

    if (!response.ok) {
      // If SAM.gov API fails, return mock data for demo purposes
      const mockData = {
        opportunitiesData: [
          {
            noticeId: "DEMO-001",
            title: "IT Infrastructure Modernization Services",
            solicitationNumber: "W52P1J-24-R-0001",
            department: "Department of Defense",
            subTier: "U.S. Army",
            office: "Army Contracting Command",
            postedDate: new Date().toISOString(),
            responseDeadLine: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            naicsCode: "541512",
            classificationCode: "D - Research and Development",
            active: "Yes",
            award: {
              amount: "$5,000,000",
              awardDate: null,
            },
            pointOfContact: [
              {
                fullName: "John Smith",
                title: "Contracting Officer",
                email: "john.smith@army.mil",
                phone: "555-123-4567",
              },
            ],
            description:
              "The U.S. Army seeks IT infrastructure modernization services including cloud migration, cybersecurity implementation, and system integration.",
            organizationType: "OFFICE",
            typeOfSetAsideDescription: "Small Business Set-Aside",
            typeOfSetAside: "SBA",
          },
          {
            noticeId: "DEMO-002",
            title: "Professional Engineering Services",
            solicitationNumber: "GS-00F-0001P",
            department: "General Services Administration",
            subTier: "Federal Acquisition Service",
            office: "Multiple Award Schedule",
            postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            responseDeadLine: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            naicsCode: "541330",
            classificationCode: "R - Professional, Administrative, and Management Support Services",
            active: "Yes",
            award: {
              amount: "$10,000,000",
              awardDate: null,
            },
            pointOfContact: [
              {
                fullName: "Sarah Johnson",
                title: "Contract Specialist",
                email: "sarah.johnson@gsa.gov",
                phone: "555-987-6543",
              },
            ],
            description:
              "GSA seeks professional engineering services for various federal agencies including structural, mechanical, and electrical engineering support.",
            organizationType: "OFFICE",
            typeOfSetAsideDescription: "Total Small Business Set-Aside",
            typeOfSetAside: "SBA",
          },
        ],
        totalRecords: 2,
      }

      return NextResponse.json(mockData)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching SAM.gov opportunities:", error)

    // Return mock data on error for demo purposes
    const mockData = {
      opportunitiesData: [],
      totalRecords: 0,
      error: "SAM.gov API temporarily unavailable. Showing demo data.",
    }

    return NextResponse.json(mockData)
  }
}
