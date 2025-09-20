import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: opportunityId, commentId } = params
    const { content } = await request.json()

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Get user ID from email
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Update the comment (ensure user owns it or is admin)
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, opportunityId: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.opportunityId !== opportunityId) {
      return NextResponse.json({ error: 'Comment does not belong to this opportunity' }, { status: 400 })
    }

    // Only allow updating own comments (comment ownership check)
    if (comment.userId !== user.id) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 })
    }

    const updatedComment = await db.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim(),
        updatedAt: new Date()
      },
      include: {
        user: true
      }
    })

    return NextResponse.json(updatedComment)
  } catch (error) {
    console.error('Error updating comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; commentId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: opportunityId, commentId } = params

    // Get user ID from email
    const user = await db.user.findUnique({
      where: { email: session.user.email! },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if comment exists and user can delete it
    const comment = await db.comment.findUnique({
      where: { id: commentId },
      include: { opportunity: true }
    })

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }

    if (comment.opportunityId !== opportunityId) {
      return NextResponse.json({ error: 'Comment does not belong to this opportunity' }, { status: 400 })
    }

    // Only allow deleting own comments (comment ownership check)
    if (comment.userId !== user.id) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 })
    }

    // Log the deletion activity before deleting
    await (db as any).activityLog.create({
      data: {
        type: "COMMENT_DELETED",
        entityType: "comment",
        entityId: comment.id,
        entityData: {
          content: comment.content,
          opportunityTitle: comment.opportunity.title,
          opportunityAgency: comment.opportunity.agency,
        },
        userId: user.id,
      }
    })

    await db.comment.delete({
      where: { id: commentId }
    })

    return NextResponse.json({ message: 'Comment deleted successfully' })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
