const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Check if default pipeline already exists
  const existingPipeline = await prisma.pipeline.findFirst({
    where: { isDefault: true },
    include: {
      stages: true
    }
  })

  if (existingPipeline) {
    console.log('Default pipeline already exists with', existingPipeline.stages.length, 'stages')

    // Check if all stages exist, if not add missing ones
    const existingStageNames = existingPipeline.stages.map(s => s.name)
    const defaultStages = [
      { name: 'Lead Generation', color: '#3b82f6', order: 1 },
      { name: 'Qualification', color: '#f59e0b', order: 2 },
      { name: 'Proposal Development', color: '#8b5cf6', order: 3 },
      { name: 'Submitted/Under Review', color: '#06b6d4', order: 4 },
      { name: 'Won/Lost/Closed', color: '#10b981', order: 5 }
    ]

    const missingStages = defaultStages.filter(
      stage => !existingStageNames.includes(stage.name)
    )

    if (missingStages.length > 0) {
      console.log(`Adding ${missingStages.length} missing stages`)

      await prisma.stage.createMany({
        data: missingStages.map(stage => ({
          ...stage,
          pipelineId: existingPipeline.id
        }))
      })

      console.log('Missing stages added successfully')
    } else {
      console.log('All default stages already exist')
    }
  } else {
    // Create default pipeline and stages
    console.log('Creating default pipeline and stages')

    const pipeline = await prisma.pipeline.create({
      data: {
        name: 'Default Pipeline',
        description: 'Default sales pipeline',
        isDefault: true,
      }
    })

    await prisma.stage.createMany({
      data: [
        { name: 'Lead Generation', color: '#3b82f6', order: 1, pipelineId: pipeline.id },
        { name: 'Qualification', color: '#f59e0b', order: 2, pipelineId: pipeline.id },
        { name: 'Proposal Development', color: '#8b5cf6', order: 3, pipelineId: pipeline.id },
        { name: 'Submitted/Under Review', color: '#06b6d4', order: 4, pipelineId: pipeline.id },
        { name: 'Won/Lost/Closed', color: '#10b981', order: 5, pipelineId: pipeline.id }
      ]
    })

    console.log('Default pipeline and stages created successfully')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
