const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

// ❌ PROBLEM before:
// You only allowed a single origin from CLIENT_URL or localhost.
// If CLIENT_URL is not exactly "https://assetverse.vercel.app",
// CORS will not send Access-Control-Allow-Origin, and the browser blocks it.
//
// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || 'http://localhost:5173',
//     credentials: true,
//   })
// )

// ✅ FIX: explicitly allow all known frontend origins
const allowedOrigins = [
  process.env.CLIENT_URL,                       // if you still want to keep using env
  'https://assetverse.vercel.app',             // NEW: your current frontend domain
  'https://assetverse-client-five.vercel.app', // optional: old frontend domain, safe to keep
  'http://localhost:5173',                     // local dev
].filter(Boolean)

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
)

// Body & cookies
app.use(express.json())
app.use(cookieParser())

// Health check (note: if your mentor expects /health, you can add it back too)
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'AssetVerse API is running' })
})

// Attach routes (note: paths are from src/, not root)
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