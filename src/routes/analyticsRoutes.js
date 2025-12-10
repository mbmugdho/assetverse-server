const express = require('express')
const {
  getAssetTypeDistribution,
  getTopRequestedAssets,
  getHRSummary,
} = require('../controllers/analyticsController')
const verifyToken = require('../middleware/verifyToken')
const verifyHR = require('../middleware/verifyHR')

const router = express.Router()

// HR-only analytics
router.get(
  '/asset-type-distribution',
  verifyToken,
  verifyHR,
  getAssetTypeDistribution
)

router.get(
  '/top-requested-assets',
  verifyToken,
  verifyHR,
  getTopRequestedAssets
)

router.get('/hr-summary', verifyToken, verifyHR, getHRSummary)

module.exports = router