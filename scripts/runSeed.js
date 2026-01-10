const { connectDB } = require('../src/config/db')
const seedDemoUsers = require('../src/dbScripts/seedDemoUsers')

const runSeed = async () => {
  try {
    console.log('Connecting to database...')
    await connectDB()

    console.log('Running demo users seed...')
    const result = await seedDemoUsers()

    console.log('')
    console.log('Seed completed:', result.message)

    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  }
}

runSeed()
