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

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const todo = await (db as any).todo.findFirst({
      where: {
        id: params.id,
        OR: [
          { creatorId: user.id },
          { assignedToId: user.id },
          {
            collaborators: {
              some: { userId: user.id }
            }
          }
        ]
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: true,
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!todo) {
      return NextResponse.json({ error: 'Todo not found' }, { status: 404 })
    }

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error fetching todo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to edit this todo
    const existingTodo = await (db as any).todo.findFirst({
      where: {
        id: params.id,
        OR: [
          { creatorId: user.id },
          { assignedToId: user.id },
          {
            collaborators: {
              some: {
                userId: user.id,
                role: { in: ['EDITOR', 'OWNER'] }
              }
            }
          }
        ]
      }
    })

    if (!existingTodo) {
      return NextResponse.json({ error: 'Todo not found or unauthorized' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, priority, dueDate, assignedToId, categoryIds, completed } = body

    const updateData: any = {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(priority !== undefined && { priority }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(assignedToId !== undefined && { assignedToId: assignedToId || null }),
      ...(completed !== undefined && { completed, completedAt: completed ? new Date() : null })
    }

    if (categoryIds !== undefined) {
      updateData.categories = {
        set: categoryIds.map((id: string) => ({ id }))
      }
    }

    const todo = await (db as any).todo.update({
      where: { id: params.id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        categories: true,
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        comments: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error updating todo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to delete this todo
    const existingTodo = await (db as any).todo.findFirst({
      where: {
        id: params.id,
        OR: [
          { creatorId: user.id },
          {
            collaborators: {
              some: {
                userId: user.id,
                role: 'OWNER'
              }
            }
          }
        ]
      }
    })

    if (!existingTodo) {
      return NextResponse.json({ error: 'Todo not found or unauthorized' }, { status: 404 })
    }

    await (db as any).todo.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Todo deleted successfully' })
  } catch (error) {
    console.error('Error deleting todo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
