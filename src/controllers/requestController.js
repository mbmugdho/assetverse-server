const { ObjectId } = require('mongodb')
const { getDB } = require('../config/db')

/**
 * POST /api/requests
 * Employee creates a request
 * Body: { assetId, note? }
 */
const createRequest = async (req, res, next) => {
  try {
    const { role, email, name } = req.user || {}
    if (!email) {
      return res.status(401).json({ message: 'Unauthorized' })
    }

    // Only employees create requests 
    if (role !== 'employee') {
      return res
        .status(403)
        .json({ message: 'Only employees can create requests' })
    }

    const { assetId, note = '' } = req.body
    if (!assetId) {
      return res.status(400).json({ message: 'assetId is required' })
    }
    if (!ObjectId.isValid(assetId)) {
      return res.status(400).json({ message: 'Invalid assetId' })
    }

    const db = getDB()
    const assetsColl = db.collection('assets')
    const requestsColl = db.collection('requests')

    const asset = await assetsColl.findOne({ _id: new ObjectId(assetId) })
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' })
    }
    if (asset.availableQuantity <= 0) {
      return res
        .status(400)
        .json({ message: 'This asset is currently out of stock' })
    }

    const now = new Date()

    const requestDoc = {
      assetId: asset._id,
      assetName: asset.productName,
      assetType: asset.productType,
      requesterName: req.user.name || name || '',
      requesterEmail: email,
      hrEmail: asset.hrEmail,
      companyName: asset.companyName,
      requestDate: now,
      approvalDate: null,
      requestStatus: 'pending',
      note,
      processedBy: null,
    }

    const result = await requestsColl.insertOne(requestDoc)

    res.status(201).json({
      message: 'Request created',
      request: { ...requestDoc, _id: result.insertedId },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/requests/hr?status=Pending|Approved|Rejected
 * HR: list requests for this HR
 */
const getHRRequests = async (req, res, next) => {
  try {
    const { email } = req.user
    const { status = 'All' } = req.query

    const db = getDB()
    const requestsColl = db.collection('requests')

    const filter = { hrEmail: email }
    if (status !== 'All') {
      filter.requestStatus = status.toLowerCase()
    }

    const requests = await requestsColl
      .find(filter)
      .sort({ requestDate: -1 })
      .toArray()

    res.json(requests)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/requests/me
 * Employee: list own requests
 */
const getMyRequests = async (req, res, next) => {
  try {
    const { email } = req.user
    const db = getDB()
    const requestsColl = db.collection('requests')

    const requests = await requestsColl
      .find({ requesterEmail: email })
      .sort({ requestDate: -1 })
      .toArray()

    res.json(requests)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/requests/:id/approve
 * HR approves a request
 */
const approveRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request id' })
    }

    const db = getDB()
    const requestsColl = db.collection('requests')
    const assetsColl = db.collection('assets')
    const usersColl = db.collection('users')
    const affiliationsColl = db.collection('employeeAffiliations')
    const assignedAssetsColl = db.collection('assignedAssets')

    const request = await requestsColl.findOne({ _id: new ObjectId(id) })
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    // Check this HR owns the request
    if (request.hrEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to process this request' })
    }

    if (request.requestStatus !== 'pending') {
      return res
        .status(400)
        .json({ message: 'Only pending requests can be approved' })
    }

    // Find asset
    const asset = await assetsColl.findOne({
      _id: new ObjectId(request.assetId),
    })
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' })
    }
    if (asset.availableQuantity <= 0) {
      return res
        .status(400)
        .json({ message: 'No available quantity left for this asset' })
    }

    // Get HR user to check package limit
    const hrUser = await usersColl.findOne({ email: req.user.email })
    if (!hrUser) {
      return res.status(404).json({ message: 'HR user not found' })
    }

    // Check if employee is already affiliated
    const existingAffiliation = await affiliationsColl.findOne({
      employeeEmail: request.requesterEmail,
      hrEmail: request.hrEmail,
      status: 'active',
    })

    let newAffiliationCreated = false

    if (!existingAffiliation) {
      // Enforce package limit
      if (hrUser.currentEmployees >= hrUser.packageLimit) {
        return res.status(403).json({
          message:
            'Employee limit reached. Please upgrade your package to add more employees.',
        })
      }

      // Create new affiliation
      const now = new Date()
      await affiliationsColl.insertOne({
        employeeEmail: request.requesterEmail,
        employeeName: request.requesterName,
        hrEmail: request.hrEmail,
        companyName: request.companyName,
        companyLogo: hrUser.companyLogo || '',
        affiliationDate: now,
        status: 'active',
      })

      // Increment HR currentEmployees
      await usersColl.updateOne(
        { _id: hrUser._id },
        { $inc: { currentEmployees: 1 } }
      )

      newAffiliationCreated = true
    }

    // Create assigned asset record
    const assignmentDate = new Date()
    const assignedDoc = {
      assetId: asset._id,
      assetName: asset.productName,
      assetImage: asset.productImage,
      assetType: asset.productType,
      employeeEmail: request.requesterEmail,
      employeeName: request.requesterName,
      hrEmail: request.hrEmail,
      companyName: request.companyName,
      assignmentDate,
      returnDate: null,
      status: 'assigned',
    }

    await assignedAssetsColl.insertOne(assignedDoc)

    // Decrement availableQuantity
    await assetsColl.updateOne(
      { _id: asset._id },
      { $inc: { availableQuantity: -1 } }
    )

    // Update request status
    await requestsColl.updateOne(
      { _id: request._id },
      {
        $set: {
          requestStatus: 'approved',
          approvalDate: new Date(),
          processedBy: req.user.email,
        },
      }
    )

    const updatedRequest = await requestsColl.findOne({ _id: request._id })

    res.json({
      message: 'Request approved',
      request: updatedRequest,
      newAffiliationCreated,
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/requests/:id/reject
 * HR rejects a request
 */
const rejectRequest = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid request id' })
    }

    const db = getDB()
    const requestsColl = db.collection('requests')

    const request = await requestsColl.findOne({ _id: new ObjectId(id) })
    if (!request) {
      return res.status(404).json({ message: 'Request not found' })
    }

    if (request.hrEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to process this request' })
    }

    if (request.requestStatus !== 'pending') {
      return res
        .status(400)
        .json({ message: 'Only pending requests can be rejected' })
    }

    await requestsColl.updateOne(
      { _id: request._id },
      {
        $set: {
          requestStatus: 'rejected',
          approvalDate: null,
          processedBy: req.user.email,
        },
      }
    )

    const updatedRequest = await requestsColl.findOne({ _id: request._id })

    res.json({
      message: 'Request rejected',
      request: updatedRequest,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createRequest,
  getHRRequests,
  getMyRequests,
  approveRequest,
  rejectRequest,
}
