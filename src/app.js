const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'https://assetverse-client-five.vercel.app/',
    credentials: true,
  })
)
app.use(express.json())
app.use(cookieParser())

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AssetVerse API is running' })
})

// Attach routes (note: paths are now from src/, not root)
const authRoutes = require('./routes/authRoutes.js')
const userRoutes = require('./routes/userRoutes.js')
const assetRoutes = require('./routes/assetRoutes.js')
const requestRoutes = require('./routes/requestRoutes.js')
const assignmentRoutes = require('./routes/assignmentRoutes.js')
const affiliationRoutes = require('./routes/affiliationRoutes.js')
const packageRoutes = require('./routes/packageRoutes.js')
const paymentRoutes = require('./routes/paymentRoutes.js')
const analyticsRoutes = require('./routes/analyticsRoutes.js')

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/assets', assetRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/assigned-assets', assignmentRoutes)
app.use('/api/affiliations', affiliationRoutes)
app.use('/api/packages', packageRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/analytics', analyticsRoutes)

// Global error handler (simple)
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
  })
})

module.exports = app
