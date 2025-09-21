export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const opportunityId = params.id

    // Verify the opportunity exists and user has access
    const opportunity = await db.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true }
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    const comments = await db.comment.findMany({
      where: { opportunityId },
      include: {
        user: true
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const opportunityId = params.id

  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized - not ancile.io domain' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify the opportunity exists
    const opportunity = await db.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true, title: true }
    })

    if (!opportunity) {
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    // Get user ID from email
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, email: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const comment = await db.comment.create({
      data: {
        content: content.trim(),
        opportunityId,
        userId: user.id
      },
      include: {
        user: true
      }
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error(`[COMMENTS-DEBUG] Error creating comment for opportunity ${opportunityId}:`, error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[COMMENTS-DEBUG] Error details:`, errorMessage)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    )
  }
}
