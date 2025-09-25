import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email?.endsWith('@ancile.io')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const categories = await (db as any).todoCategory.findMany({
      include: {
        todos: {
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    })

    // Add todo count to response
    const categoriesWithCount = categories.map(category => ({
      ...category,
      todoCount: category.todos.length,
      todos: undefined // Remove todos array from response
    }))

    return NextResponse.json(categoriesWithCount)
  } catch (error) {
    console.error('Error fetching categories:', error)
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

    const body = await request.json()
    const { name, color } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const category = await (db as any).todoCategory.create({
      data: {
        name: name.trim(),
        color: color || '#6b7280'
      }
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
