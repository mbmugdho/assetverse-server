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

module.exports = { getMyAffiliations, getHREmployeesWithAssets }
