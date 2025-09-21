export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized - not ancile.io domain' }, { status: 401 })
    }

    const opportunities = await db.opportunity.findMany({
      take: 5,
      select: { id: true, title: true, createdAt: true }
    })

    return NextResponse.json({
      success: true,
      session: {
        exists: !!session,
        userEmail: session?.user?.email,
        isAncileDomain: session?.user?.email?.endsWith('@ancile.io')
      },
      opportunities: opportunities.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('[TEST] Error in GET:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized - not ancile.io domain' }, { status: 401 })
    }

    // Test database connection
    const user = await db.user.findFirst({
      where: { email: session?.user?.email },
      select: { id: true, email: true, name: true }
    })

    return NextResponse.json({
      success: true,
      message: 'Test request successful',
      body: body,
      session: {
        exists: !!session,
        userEmail: session?.user?.email
      },
      user: user,
      timestamp: new Date().toISOString()
    }, { status: 201 })
  } catch (error) {
    console.error('[TEST] Error in POST:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
