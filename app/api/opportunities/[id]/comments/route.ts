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
    console.log(`[COMMENTS-DEBUG] POST request to /api/opportunities/${opportunityId}/comments`)

    const session = await getServerSession(authOptions)
    console.log(`[COMMENTS-DEBUG] Session check:`, {
      exists: !!session,
      email: session?.user?.email,
      isAncile: session?.user?.email?.endsWith('@ancile.io')
    })

    if (!session?.user?.email?.endsWith('@ancile.io')) {
      console.log(`[COMMENTS-DEBUG] Failed authentication - not ancile.io domain`)
      return NextResponse.json({ error: 'Unauthorized - not ancile.io domain' }, { status: 401 })
    }

    console.log(`[COMMENTS-DEBUG] Authentication passed`)

    const body = await request.json()
    const { content } = body
    console.log(`[COMMENTS-DEBUG] Request body parsed:`, { contentLength: content?.length })

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      console.log(`[COMMENTS-DEBUG] Content validation failed`)
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify the opportunity exists
    console.log(`[COMMENTS-DEBUG] Checking if opportunity exists: ${opportunityId}`)
    const opportunity = await db.opportunity.findUnique({
      where: { id: opportunityId },
      select: { id: true, title: true }
    })

    console.log(`[COMMENTS-DEBUG] Opportunity lookup result:`, opportunity ? `Found: ${opportunity.title}` : 'Not found')

    if (!opportunity) {
      console.log(`[COMMENTS-DEBUG] Opportunity not found, returning 404`)
      return NextResponse.json({ error: 'Opportunity not found' }, { status: 404 })
    }

    // Get user ID from email
    console.log(`[COMMENTS-DEBUG] Looking up user: ${session.user.email}`)
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true, email: true }
    })

    console.log(`[COMMENTS-DEBUG] User lookup result:`, user ? `Found user: ${user.email}` : 'User not found')

    if (!user) {
      console.log(`[COMMENTS-DEBUG] User not found, returning 404`)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log(`[COMMENTS-DEBUG] Creating comment...`)
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

    console.log(`[COMMENTS-DEBUG] Comment created successfully, ID: ${comment.id}`)
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
