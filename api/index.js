const app = require('../src/app')
const { connectDB } = require('../src/config/db')
const seedPackagesIfNeeded = require('../src/dbScripts/dbScriptsPackages')

let isDbReady = false 

module.exports = async (req, res) => {
  if (!isDbReady) {
    try {
      await connectDB()
      await seedPackagesIfNeeded()
      isDbReady = true
      console.log('DB connected & packages seeded (serverless)')
    } catch (err) {
      console.error('DB init error (serverless):', err)
      return res
        .status(500)
        .json({ message: 'Failed to initialize database connection' })
    }
  }

  return app(req, res)
}