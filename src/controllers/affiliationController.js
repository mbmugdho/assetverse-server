const { getDB } = require('../config/db')

/**
 * GET /api/affiliations/me
 * Employee: list their active company affiliations
 */
const getMyAffiliations = async (req, res, next) => {
  try {
    const { email } = req.user
    const db = getDB()
    const affColl = db.collection('employeeAffiliations')

    const affiliations = await affColl
      .find({ employeeEmail: email, status: 'active' })
      .sort({ affiliationDate: -1 })
      .toArray()

    res.json(affiliations)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/affiliations/hr
 * HR: list active employees + assets count
 * Uses aggregation on assignedAssets to compute assetsCount per employee
 */
const getHREmployeesWithAssets = async (req, res, next) => {
  try {
    const { email } = req.user
    const db = getDB()
    const affColl = db.collection('employeeAffiliations')
    const assignedColl = db.collection('assignedAssets')

    // 1) Get active affiliations for this HR
    const affiliations = await affColl
      .find({ hrEmail: email, status: 'active' })
      .sort({ affiliationDate: -1 })
      .toArray()

    if (affiliations.length === 0) {
      return res.json([])
    }

    const employeeEmails = affiliations.map((a) => a.employeeEmail)

    // 2) Aggregate assigned asset counts per employee (only 'assigned' status)
    const counts = await assignedColl
      .aggregate([
        {
          $match: {
            hrEmail: email,
            status: 'assigned',
            employeeEmail: { $in: employeeEmails },
          },
        },
        {
          $group: {
            _id: '$employeeEmail',
            assetsCount: { $sum: 1 },
          },
        },
      ])
      .toArray()

    const countMap = {}
    counts.forEach((c) => {
      countMap[c._id] = c.assetsCount
    })

    // 3) Combine affiliations + counts
    const result = affiliations.map((a) => ({
      _id: a._id,
      employeeEmail: a.employeeEmail,
      employeeName: a.employeeName,
      hrEmail: a.hrEmail,
      companyName: a.companyName,
      companyLogo: a.companyLogo,
      affiliationDate: a.affiliationDate,
      status: a.status,
      assetsCount: countMap[a.employeeEmail] || 0,
    }))

    res.json(result)
  } catch (err) {
    next(err)
  }
}
/**
 * PATCH /api/affiliations/:id/remove
 * HR: remove employee from team
 */
const removeHREmployee = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid affiliation id' })
    }

    const db = getDB()
    const affColl = db.collection('employeeAffiliations')
    const assignedColl = db.collection('assignedAssets')
    const assetsColl = db.collection('assets')
    const usersColl = db.collection('users')

    //  Find the affiliation
    const affiliation = await affColl.findOne({ _id: new ObjectId(id) })
    if (!affiliation) {
      return res.status(404).json({ message: 'Affiliation not found' })
    }

    // Ensure this HR owns the affiliation
    if (affiliation.hrEmail !== req.user.email) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to remove this employee' })
    }

    if (affiliation.status === 'inactive') {
      return res
        .status(400)
        .json({ message: 'Employee is already inactive for this company' })
    }

    const { employeeEmail, hrEmail } = affiliation

    //  Mark affiliation as inactive
    await affColl.updateOne(
      { _id: affiliation._id },
      { $set: { status: 'inactive' } }
    )

    //  Find all currently assigned assets for this HR+employee
    const assigned = await assignedColl
      .find({
        employeeEmail,
        hrEmail,
        status: 'assigned',
      })
      .toArray()

    const now = new Date()

    // For each assigned asset:
    //    - mark as returned & increment asset.availableQuantity by 1
    for (const a of assigned) {
      await assignedColl.updateOne(
        { _id: a._id },
        { $set: { status: 'returned', returnDate: now } }
      )

      await assetsColl.updateOne(
        { _id: new ObjectId(a.assetId) },
        { $inc: { availableQuantity: 1 } }
      )
    }

    // Decrement HR currentEmployees by 1 (if > 0)
    await usersColl.updateOne(
      { email: hrEmail, currentEmployees: { $gt: 0 } },
      { $inc: { currentEmployees: -1 } }
    )

    res.json({
      message: 'Employee removed from team. Active assets have been returned.',
      affiliationId: id,
      returnedAssetsCount: assigned.length,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getMyAffiliations,
  getHREmployeesWithAssets,
  removeHREmployee,
}
