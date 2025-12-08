// src/controllers/userController.js
const { getDB } = require('../config/db')

/**
 * POST /api/users
 * Body:
 *  Employee:
 *    { name, email, dateOfBirth, role: 'employee' }
 *  HR:
 *    { name, email, dateOfBirth, role: 'hr', companyName, companyLogo }
 */
const createUser = async (req, res, next) => {
  try {
    const db = getDB()
    const usersColl = db.collection('users')

    const {
      name,
      email,
      dateOfBirth,
      role,
      companyName,
      companyLogo,
    } = req.body

    if (!name || !email || !dateOfBirth || !role) {
      return res
        .status(400)
        .json({ message: 'name, email, dateOfBirth, role are required' })
    }

    const existing = await usersColl.findOne({ email })
    if (existing) {
      return res
        .status(409)
        .json({ message: 'User with this email already exists' })
    }

    const now = new Date()

    const userDoc = {
      name,
      email,
      dateOfBirth: new Date(dateOfBirth),
      role, // 'employee' or 'hr'
      profileImage: '',
      createdAt: now,
      updatedAt: now,
    }

    if (role === 'hr') {
      userDoc.companyName = companyName || ''
      userDoc.companyLogo = companyLogo || ''
      userDoc.packageLimit = 5
      userDoc.currentEmployees = 0
      userDoc.subscription = 'basic'
    }

    await usersColl.insertOne(userDoc)

    res.status(201).json({ message: 'User created', user: userDoc })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/users/me
 * Requires verifyToken; returns current user.
 */
const getMe = async (req, res, next) => {
  try {
    const db = getDB()
    const usersColl = db.collection('users')

    const user = await usersColl.findOne(
      { email: req.user.email },
      { projection: { password: 0 } } // we don't store passwords, just safety
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (err) {
    next(err)
  }
}

module.exports = { createUser, getMe }