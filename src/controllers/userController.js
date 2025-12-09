const { getDB } = require('../config/db')

/**
 * POST /api/users
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
      role, 
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
      { projection: { password: 0 } } 
    )

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.json(user)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/users/me
 * Update current user's profile
 */
const updateMe = async (req, res, next) => {
  try {
    const db = getDB()
    const usersColl = db.collection('users')

    const email = req.user.email
    if (!email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    const existing = await usersColl.findOne({ email })
    if (!existing) {
      return res.status(404).json({ message: 'User not found' })
    }

    const {
      name,
      dateOfBirth,
      profileImage,
      companyName,
      companyLogo,
    } = req.body

    const update = {}
    if (name !== undefined) update.name = name
    if (profileImage !== undefined) update.profileImage = profileImage
    if (dateOfBirth) update.dateOfBirth = new Date(dateOfBirth)

    // Only HR can update company info
    if (existing.role === 'hr') {
      if (companyName !== undefined) update.companyName = companyName
      if (companyLogo !== undefined) update.companyLogo = companyLogo
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ message: 'No valid fields provided to update' })
    }

    update.updatedAt = new Date()

    await usersColl.updateOne({ _id: existing._id }, { $set: update })

    const updatedUser = await usersColl.findOne(
      { _id: existing._id },
      { projection: { password: 0 } }
    )

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { createUser, getMe, updateMe  }