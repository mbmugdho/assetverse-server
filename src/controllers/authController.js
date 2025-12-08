// src/controllers/authController.js
const { getDB } = require('../config/db')
const { signToken } = require('../utils/jwt')

/**
 * POST /api/auth/jwt
 * Body: { email }
 * Use this after Firebase login to issue a backend JWT cookie.
 */
const issueJwt = async (req, res, next) => {
  try {
    const { email } = req.body
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const db = getDB()
    const usersColl = db.collection('users')

    const user = await usersColl.findOne({ email })
    if (!user) {
      return res
        .status(404)
        .json({ message: 'User not found in database. Register first.' })
    }

    const payload = {
      email: user.email,
      role: user.role,
    }

    const token = signToken(payload)

    res
      .cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      })
      .json({ message: 'JWT issued', user: payload })
  } catch (err) {
    next(err)
  }
}

/**
 * POST /api/auth/logout
 * Clear the JWT cookie.
 */
const logout = (req, res) => {
  res
    .clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })
    .json({ message: 'Logged out' })
}

module.exports = { issueJwt, logout }