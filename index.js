const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')
const { connectDB } = require('./src/config/db.js')

dotenv.config()

const app = express()
const port = process.env.PORT || 5000

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AssetVerse API is running' })
})

// Attach routes
const authRoutes = require('./src/routes/authRoutes.js')
const userRoutes = require('./src/routes/userRoutes.js')
const assetRoutes = require('./src/routes/assetRoutes.js')
const requestRoutes = require('./src/routes/requestRoutes.js')
const assignmentRoutes = require('./src/routes/assignmentRoutes.js')
const affiliationRoutes = require('./src/routes/affiliationRoutes.js')
const packageRoutes = require('./src/routes/packageRoutes.js')
const seedPackagesIfNeeded = require('./src/dbScripts/dbScriptsPackages.js')

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/assigned-assets', assignmentRoutes)
app.use('/api/affiliations', affiliationRoutes)
app.use('/api/packages', packageRoutes)

// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  })
})

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