const { getDB } = require('../config/db')

/**
 * POST /api/contact
 * Public: Submit contact form
 * Body: { name, email, subject, message }
 */
const submitContactForm = async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: 'All fields are required: name, email, subject, message',
      })
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email format' })
    }

    // Check message length
    if (message.length < 10) {
      return res.status(400).json({
        message: 'Message must be at least 10 characters long',
      })
    }

    if (message.length > 2000) {
      return res.status(400).json({
        message: 'Message must be less than 2000 characters',
      })
    }

    const db = getDB()
    const contactsColl = db.collection('contacts')

    const contactDoc = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      status: 'unread', // unread, read, replied
      createdAt: new Date(),
      repliedAt: null,
    }

    const result = await contactsColl.insertOne(contactDoc)

    res.status(201).json({
      message:
        'Your message has been sent successfully. We will get back to you soon!',
      contactId: result.insertedId,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/contact
 * Admin/HR: Get all contact submissions (optional - for future admin panel)
 */
const getContactSubmissions = async (req, res, next) => {
  try {
    const db = getDB()
    const contactsColl = db.collection('contacts')

    const { status = 'all', page = 1, limit = 20 } = req.query

    const filter = {}
    if (status !== 'all') {
      filter.status = status
    }

    const skip = (Number(page) - 1) * Number(limit)

    const [data, total] = await Promise.all([
      contactsColl
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .toArray(),
      contactsColl.countDocuments(filter),
    ])

    res.json({
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/contact/:id/status
 * Admin/HR: Update contact status
 */
const updateContactStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!['unread', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        message: 'Status must be: unread, read, or replied',
      })
    }

    const { ObjectId } = require('mongodb')

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid contact id' })
    }

    const db = getDB()
    const contactsColl = db.collection('contacts')

    const update = { status }
    if (status === 'replied') {
      update.repliedAt = new Date()
    }

    const result = await contactsColl.updateOne(
      { _id: new ObjectId(id) },
      { $set: update }
    )

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Contact not found' })
    }

    res.json({ message: 'Contact status updated' })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  submitContactForm,
  getContactSubmissions,
  updateContactStatus,
}
