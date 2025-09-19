const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Seed federal government agencies and departments commonly found on sam.gov
  console.log('Seeding federal government agencies...')

  const federalAgencies = [
    {
      name: 'Department of Defense (DoD)',
      industry: 'Federal Government - Defense',
      website: 'https://www.defense.gov',
      samRegistered: true
    },
    {
      name: 'Department of Veterans Affairs (VA)',
      industry: 'Federal Government - Veterans Affairs',
      website: 'https://www.va.gov',
      samRegistered: true
    },
    {
      name: 'Department of Health and Human Services (HHS)',
      industry: 'Federal Government - Health',
      website: 'https://www.hhs.gov',
      samRegistered: true
    },
    {
      name: 'Department of Homeland Security (DHS)',
      industry: 'Federal Government - Homeland Security',
      website: 'https://www.dhs.gov',
      samRegistered: true
    },
    {
      name: 'Department of Transportation (DOT)',
      industry: 'Federal Government - Transportation',
      website: 'https://www.transportation.gov',
      samRegistered: true
    },
    {
      name: 'NASA',
      industry: 'Federal Government - Space & Aeronautics',
      website: 'https://www.nasa.gov',
      samRegistered: true
    },
    {
      name: 'General Services Administration (GSA)',
      industry: 'Federal Government - Procurement',
      website: 'https://www.gsa.gov',
      samRegistered: true
    },
    {
      name: 'US Army Corps of Engineers',
      industry: 'Federal Government - Engineering & Construction',
      website: 'https://www.usace.army.mil',
      samRegistered: true
    },
    {
      name: 'Department of Agriculture (USDA)',
      industry: 'Federal Government - Agriculture',
      website: 'https://www.usda.gov',
      samRegistered: true
    },
    {
      name: 'Department of Energy (DOE)',
      industry: 'Federal Government - Energy',
      website: 'https://www.energy.gov',
      samRegistered: true
    },
    {
      name: 'Department of Interior (DOI)',
      industry: 'Federal Government - Natural Resources',
      website: 'https://www.doi.gov',
      samRegistered: true
    },
    {
      name: 'Federal Aviation Administration (FAA)',
      industry: 'Federal Government - Aviation',
      website: 'https://www.faa.gov',
      samRegistered: true
    },
    {
      name: 'Federal Emergency Management Agency (FEMA)',
      industry: 'Federal Government - Emergency Management',
      website: 'https://www.fema.gov',
      samRegistered: true
    },
    {
      name: 'US Customs and Border Protection (CBP)',
      industry: 'Federal Government - Border Security',
      website: 'https://www.cbp.gov',
      samRegistered: true
    },
    {
      name: 'US Agency for International Development (USAID)',
      industry: 'Federal Government - International Development',
      website: 'https://www.usaid.gov',
      samRegistered: true
    },
    {
      name: 'Centers for Disease Control (CDC)',
      industry: 'Federal Government - Public Health',
      website: 'https://www.cdc.gov',
      samRegistered: true
    },
    {
      name: 'National Institutes of Health (NIH)',
      industry: 'Federal Government - Medical Research',
      website: 'https://www.nih.gov',
      samRegistered: true
    },
    {
      name: 'Department of Commerce (DOC)',
      industry: 'Federal Government - Commerce',
      website: 'https://www.commerce.gov',
      samRegistered: true
    },
    {
      name: 'Department of Labor (DOL)',
      industry: 'Federal Government - Labor',
      website: 'https://www.dol.gov',
      samRegistered: true
    },
    {
      name: 'Department of Education (ED)',
      industry: 'Federal Government - Education',
      website: 'https://www.ed.gov',
      samRegistered: true
    },
    {
      name: 'Department of State (DOS)',
      industry: 'Federal Government - Foreign Affairs',
      website: 'https://www.state.gov',
      samRegistered: true
    },
    {
      name: 'US Army',
      industry: 'Federal Government - Military - Army',
      website: 'https://www.army.mil',
      samRegistered: true
    },
    {
      name: 'US Navy',
      industry: 'Federal Government - Military - Navy',
      website: 'https://www.navy.mil',
      samRegistered: true
    },
    {
      name: 'US Air Force',
      industry: 'Federal Government - Military - Air Force',
      website: 'https://www.airforce.com',
      samRegistered: true
    },
    {
      name: 'US Marine Corps',
      industry: 'Federal Government - Military - Marine Corps',
      website: 'https://www.marines.mil',
      samRegistered: true
    },
    {
      name: 'US Coast Guard',
      industry: 'Federal Government - Military - Coast Guard',
      website: 'https://www.uscg.mil',
      samRegistered: true
    },
    {
      name: 'US Space Force',
      industry: 'Federal Government - Military - Space Force',
      website: 'https://www.spaceforce.mil',
      samRegistered: true
    },
    {
      name: 'Special Operations Command (SOCOM)',
      industry: 'Federal Government - Military - Special Operations',
      website: 'https://www.socom.mil',
      samRegistered: true
    },
    {
      name: 'US Army Corps of Engineers',
      industry: 'Federal Government - Military - Engineering',
      website: 'https://www.usace.army.mil',
      samRegistered: true
    },
    {
      name: 'Naval Air Warfare Center',
      industry: 'Federal Government - Military - Naval Research',
      website: 'https://www.navair.navy.mil',
      samRegistered: true
    },
    {
      name: 'Air Force Research Laboratory (AFRL)',
      industry: 'Federal Government - Military - Air Force Research',
      website: 'https://www.afrl.af.mil',
      samRegistered: true
    },
    {
      name: 'Defence Intelligence Agency (DIA)',
      industry: 'Federal Government - Military - Intelligence',
      website: 'https://www.dia.mil',
      samRegistered: true
    },
    {
      name: 'National Reconnaissance Office (NRO)',
      industry: 'Federal Government - Military - Reconnaissance',
      website: 'https://www.nro.gov',
      samRegistered: true
    },
    {
      name: 'National Geospatial-Intelligence Agency (NGA)',
      industry: 'Federal Government - Military - Geospatial Intelligence',
      website: 'https://www.nga.mil',
      samRegistered: true
    },
    {
      name: 'Defense Advanced Research Projects Agency (DARPA)',
      industry: 'Federal Government - Military - Research & Development',
      website: 'https://www.darpa.mil',
      samRegistered: true
    },
    {
      name: 'Missile Defense Agency (MDA)',
      industry: 'Federal Government - Military - Missile Defense',
      website: 'https://www.mda.mil',
      samRegistered: true
    },
    {
      name: 'US Strategic Command (USSTRATCOM)',
      industry: 'Federal Government - Military - Strategic Command',
      website: 'https://www.stratcom.mil',
      samRegistered: true
    },
    {
      name: 'US Cyber Command (USCYBERCOM)',
      industry: 'Federal Government - Military - Cyber Command',
      website: 'https://www.cybercom.mil',
      samRegistered: true
    },
    {
      name: 'US Transportation Command (USTRANSCOM)',
      industry: 'Federal Government - Military - Transportation',
      website: 'https://www.ustranscom.mil',
      samRegistered: true
    },
    {
      name: 'US Northern Command (USNORTHCOM)',
      industry: 'Federal Government - Military - Northern Command',
      website: 'https://www.northcom.mil',
      samRegistered: true
    }
  ]

  // Create or update agencies (check existence first to avoid duplicates)
  for (const agency of federalAgencies) {
    const existingCompany = await prisma.company.findFirst({
      where: { name: agency.name }
    })

    if (existingCompany) {
      await prisma.company.update({
        where: { id: existingCompany.id },
        data: agency
      })
    } else {
      await prisma.company.create({
        data: agency
      })
    }
  }

  console.log(`Seeded ${federalAgencies.length} federal government agencies`)

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
