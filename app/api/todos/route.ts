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

    const { searchParams } = new URL(request.url)
    const assignedTo = searchParams.get('assignedTo')
    const completed = searchParams.get('completed')
    const priority = searchParams.get('priority')
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build where clause
    const where: any = {
      OR: [
        { creatorId: user.id },
        { assignedToId: user.id },
        {
          collaborators: {
            some: { userId: user.id }
          }
        }
      ]
    }

    if (assignedTo !== null && assignedTo !== '') {
      if (assignedTo === 'me') {
        where.assignedToId = user.id
      } else if (assignedTo === 'unassigned') {
        where.assignedToId = null
      } else {
        where.assignedToId = assignedTo
      }
    }

    if (completed !== null && completed !== '') {
      where.completed = completed === 'true'
    }

    if (priority) {
      where.priority = priority
    }

    if (categoryId) {
      where.categories = {
        some: { id: categoryId }
      }
    }

    if (search) {
      where.OR = where.OR.map((condition: any) => ({
        ...condition,
        AND: {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      }))
    }

    const todos = await (db as any).todo.findMany({
      where,
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
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      take: limit
    })

    return NextResponse.json(todos)
  } catch (error) {
    console.error('Error fetching todos:', error)
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

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, priority, dueDate, assignedToId, categoryIds = [] } = body

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const todo = await (db as any).todo.create({
      data: {
        title: title.trim(),
        description: description?.trim(),
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assignedToId: assignedToId || null,
        creatorId: user.id,
        categories: categoryIds.length > 0 ? {
          connect: categoryIds.map((id: string) => ({ id }))
        } : undefined
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
        }
      }
    })

    // Add creator as a collaborator with owner role if not already assigned
    await (db as any).todoCollaborator.upsert({
      where: {
        todoId_userId: {
          todoId: todo.id,
          userId: user.id
        }
      },
      update: { role: 'OWNER' },
      create: {
        todoId: todo.id,
        userId: user.id,
        role: 'OWNER'
      }
    })

    return NextResponse.json(todo)
  } catch (error) {
    console.error('Error creating todo:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
