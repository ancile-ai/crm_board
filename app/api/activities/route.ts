import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user ID and cleared timestamp
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, activitiesClearedAt: true } as any
    }) as any

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Fetch recent opportunities (all users, to show team activities)
    const recentOpportunities = await db.opportunity.findMany({
      take: limit * 2, // Fetch more to account for edits
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        agency: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Fetch recent comments (all users, to show team activities)
    const recentComments = await db.comment.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        opportunity: {
          select: {
            id: true,
            title: true,
            agency: true
          }
        }
      }
    })

    // Fetch recent deletion activities (all users, to show team activities)
    const recentDeletions = await (db as any).activityLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Process opportunities to create activities for both created and edited
    const opportunityActivities = []
    for (const opp of recentOpportunities) {
      // Always include the creation activity
      opportunityActivities.push({
        id: `opportunity-created-${opp.id}`,
        type: 'opportunity_created' as const,
        timestamp: opp.createdAt,
        opportunity: {
          id: opp.id,
          title: opp.title,
          agency: opp.agency
        },
        user: opp.assignedTo,
        content: opp.title
      })

      // Include edit activity if updatedAt is significantly different from createdAt (>30 seconds)
      const timeDiff = opp.updatedAt.getTime() - opp.createdAt.getTime()
      if (timeDiff > 30000) { // 30 seconds
        opportunityActivities.push({
          id: `opportunity-edited-${opp.id}`,
          type: 'opportunity_edited' as const,
          timestamp: opp.updatedAt,
          opportunity: {
            id: opp.id,
            title: opp.title,
            agency: opp.agency
          },
          user: opp.assignedTo,
          content: opp.title
        })
      }
    }

    // Process deletion activities
    const deletionActivities = recentDeletions.map((deletion: any) => ({
      id: `deletion-${deletion.id}`,
      type: deletion.type === 'OPPORTUNITY_DELETED' ? 'opportunity_deleted' : 'comment_deleted',
      timestamp: deletion.createdAt,
      opportunity: deletion.entityType === 'opportunity' ? {
        id: deletion.entityId,
        title: deletion.entityData?.title || 'Unknown Opportunity',
        agency: deletion.entityData?.agency || 'Unknown Agency'
      } : {
        id: deletion.entityId,
        title: deletion.entityData?.opportunityTitle || 'Unknown Opportunity',
        agency: deletion.entityData?.opportunityAgency || 'Unknown Agency'
      },
      user: deletion.user,
      content: deletion.type === 'OPPORTUNITY_DELETED' ? deletion.entityData?.title || 'Unknown Opportunity' : deletion.entityData?.content || 'Unknown Content'
    }))

    // Combine and sort all activities by timestamp
    const allActivities = [
      ...opportunityActivities,
      ...recentComments.map(comment => ({
        id: `comment-${comment.id}`,
        type: 'comment_added' as const,
        timestamp: comment.createdAt,
        opportunity: {
          id: comment.opportunity.id,
          title: comment.opportunity.title,
          agency: comment.opportunity.agency
        },
        user: comment.user,
        content: comment.content
      })),
      ...deletionActivities
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    // Filter out activities older than when the user last cleared their activities
    const clearedAt = user.activitiesClearedAt
    const activities = clearedAt
      ? allActivities.filter(activity => new Date(activity.timestamp) > clearedAt)
      : allActivities

    // Limit the combined results
    const limitedActivities = activities.slice(0, limit)

    return NextResponse.json(limitedActivities)
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear the user's activities by setting the timestamp
    await db.user.update({
      where: { email: session.user.email },
      data: {
        activitiesClearedAt: new Date()
      } as any
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing activities:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
