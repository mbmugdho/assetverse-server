const express = require('express') 
const dotenv = require('dotenv')
const { connectDB } = require('./src/config/db.js')
const seedPackagesIfNeeded = require('./src/dbScripts/dbScriptsPackages.js')
const app = require('./src/app.js')

dotenv.config()
const port = process.env.PORT || 5000

const startServer = async () => {
  try {
    await connectDB()
    await seedPackagesIfNeeded()
    app.listen(port, () => {
      console.log(`AssetVerse server running on port ${port}`)
    })
  } catch (err) {
    console.error('Failed to start server:', err)
    process.exit(1)
  }
}

startServer()