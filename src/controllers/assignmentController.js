const { ObjectId } = require('mongodb')
const { getDB } = require('../config/db')

/**
 * GET /api/assigned-assets/me
 * Employee: list all assigned assets for current user
 */
const getMyAssignedAssets = async (req, res, next) => {
  try {
    const { email } = req.user
    const db = getDB()
    const assignedColl = db.collection('assignedAssets')

    const assets = await assignedColl
      .find({ employeeEmail: email })
      .sort({ assignmentDate: -1 })
      .toArray()

    res.json(assets)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assigned-assets/hr
 * HR: list all assigned assets under this HR
 */
const getHRAssignedAssets = async (req, res, next) => {
  try {
    const { email } = req.user
    const db = getDB()
    const assignedColl = db.collection('assignedAssets')

    const assets = await assignedColl
      .find({ hrEmail: email })
      .sort({ assignmentDate: -1 })
      .toArray()

    res.json(assets)
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/assigned-assets/:id/return
 * Employee returns a Returnable asset
 */
const returnAssignedAsset = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid assignment id' })
    }

    const db = getDB()
    const assignedColl = db.collection('assignedAssets')
    const assetsColl = db.collection('assets')
    const requestsColl = db.collection('requests')

    const assignment = await assignedColl.findOne({
      _id: new ObjectId(id),
    })

    if (!assignment) {
      return res.status(404).json({ message: 'Assigned asset not found' })
    }

    // Only the employee who owns it can return it
    if (assignment.employeeEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to return this asset' })
    }

    if (assignment.status !== 'assigned') {
      return res
        .status(400)
        .json({ message: 'Only currently assigned assets can be returned' })
    }

    if (assignment.assetType !== 'Returnable') {
      return res
        .status(400)
        .json({ message: 'This asset is not marked as returnable' })
    }

    // Update assigned asset
    const now = new Date()
    await assignedColl.updateOne(
      { _id: assignment._id },
      { $set: { status: 'returned', returnDate: now } }
    )

    // Increment inventory
    await assetsColl.updateOne(
      { _id: new ObjectId(assignment.assetId) },
      { $inc: { availableQuantity: 1 } }
    )

    // Optional: update related request to 'returned' if exists
    await requestsColl.updateOne(
      {
        requesterEmail: assignment.employeeEmail,
        assetId: assignment.assetId,
        requestStatus: 'approved',
      },
      {
        $set: {
          requestStatus: 'returned',
          approvalDate: now,
          processedBy: req.user.email,
        },
      }
    )

    const updatedAssignment = await assignedColl.findOne({
      _id: assignment._id,
    })

    res.json({
      message: 'Asset returned successfully',
      assignment: updatedAssignment,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getMyAssignedAssets,
  getHRAssignedAssets,
  returnAssignedAsset,
}
