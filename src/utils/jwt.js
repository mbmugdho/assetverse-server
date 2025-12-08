const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-this'
const JWT_EXPIRES_IN = '7d'

const signToken = payload =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })

const verifyToken = token => jwt.verify(token, JWT_SECRET)

module.exports = { signToken, verifyToken }