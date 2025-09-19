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
    const search = searchParams.get("search")

    const companies = await db.company.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { industry: { contains: search, mode: "insensitive" } },
              { cageCode: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
      include: {
        contacts: true,
        opportunities: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true,
          },
        },
        _count: {
          select: {
            opportunities: true,
            contacts: true,
          },
        },
      },
      orderBy: { name: "asc" },
    })

    return NextResponse.json(companies)
  } catch (error) {
    console.error("Error fetching companies:", error)
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
      name,
      industry,
      website,
      phone,
      email,
      address,
      city,
      state,
      zipCode,
      country,
      cageCode,
      duns,
      samRegistered,
      smallBusiness,
      womanOwned,
      veteranOwned,
      hubzone,
      eightA,
    } = body

    const company = await db.company.create({
      data: {
        name,
        industry,
        website,
        phone,
        email,
        address,
        city,
        state,
        zipCode,
        country: country || "USA",
        cageCode,
        duns,
        samRegistered: samRegistered || false,
        smallBusiness: smallBusiness || false,
        womanOwned: womanOwned || false,
        veteranOwned: veteranOwned || false,
        hubzone: hubzone || false,
        eightA: eightA || false,
      },
      include: {
        contacts: true,
        _count: {
          select: {
            opportunities: true,
            contacts: true,
          },
        },
      },
    })

    return NextResponse.json(company, { status: 201 })
  } catch (error) {
    console.error("Error creating company:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
