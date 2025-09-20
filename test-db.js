
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('Testing database connection...')

    // Check companies
    const companies = await prisma.company.findMany({
      take: 5
    })
    console.log(`Found ${companies.length} companies`)
    companies.forEach(company => {
      console.log(`- ${company.name}`)
    })

    // Check pipelines
    const pipelines = await prisma.pipeline.findMany({
      include: {
        stages: true
      }
    })
    console.log(`\nFound ${pipelines.length} pipelines`)
    pipelines.forEach(pipeline => {
      console.log(`- ${pipeline.name} (${pipeline.stages.length} stages)`)
    })

    // Check opportunities
    const opportunities = await prisma.opportunity.findMany({
      take: 5,
      include: {
        currentStage: true,
        company: true
      }
    })
    console.log(`\nFound ${opportunities.length} opportunities`)
    opportunities.forEach(opp => {
      console.log(`- ${opp.title} (${opp.currentStage.name})`)
    })

  } catch (error) {
    console.error('Database test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()
