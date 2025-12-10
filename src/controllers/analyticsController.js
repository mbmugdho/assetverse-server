const { getDB } = require('../config/db')

/**
 * GET /api/analytics/asset-type-distribution
 * HR: Returnable vs Non-returnable distribution (by total quantity)
 */
const getAssetTypeDistribution = async (req, res, next) => {
  try {
    const { email } = req.user
    const db = getDB()
    const assetsColl = db.collection('assets')

    const pipeline = [
      { $match: { hrEmail: email } },
      {
        $group: {
          _id: '$productType', // "Returnable" | "Non-returnable"
          totalQuantity: { $sum: '$productQuantity' },
        },
      },
    ]

    const raw = await assetsColl.aggregate(pipeline).toArray()

    const data = raw.map((doc) => ({
      type: doc._id || 'Unknown',
      count: doc.totalQuantity,
    }))

    res.json(data)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/analytics/top-requested-assets?limit=5
 * HR: Top N most requested assets (by request count)
 */
const getTopRequestedAssets = async (req, res, next) => {
  try {
    const { email } = req.user
    const limit = parseInt(req.query.limit, 10) || 5

    const db = getDB()
    const requestsColl = db.collection('requests')

    const pipeline = [
      { $match: { hrEmail: email } },
      {
        $group: {
          _id: '$assetId',
          assetName: { $first: '$assetName' },
          requestCount: { $sum: 1 },
        },
      },
      { $sort: { requestCount: -1 } },
      { $limit: limit },
    ]

    const raw = await requestsColl.aggregate(pipeline).toArray()

    const data = raw.map((doc) => ({
      assetId: doc._id,
      assetName: doc.assetName || 'Unknown asset',
      count: doc.requestCount,
    }))

    res.json(data)
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/analytics/hr-summary
 * HR: high-level stats for dashboard cards
 */
const getHRSummary = async (req, res, next) => {
  try {
    const { email } = req.user
    const db = getDB()

    const usersColl = db.collection('users')
    const assetsColl = db.collection('assets')
    const assignedColl = db.collection('assignedAssets')
    const requestsColl = db.collection('requests')

    const [hrUser, totalAssets, totalAssigned, pendingRequests] =
      await Promise.all([
        usersColl.findOne({ email }),
        assetsColl.countDocuments({ hrEmail: email }),
        assignedColl.countDocuments({ hrEmail: email, status: 'assigned' }),
        requestsColl.countDocuments({
          hrEmail: email,
          requestStatus: 'pending',
        }),
      ])

    res.json({
      totalAssets,
      activeEmployees: hrUser?.currentEmployees || 0,
      packageLimit: hrUser?.packageLimit || 0,
      totalAssignedAssets: totalAssigned,
      pendingRequests,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getAssetTypeDistribution,
  getTopRequestedAssets,
  getHRSummary,
}