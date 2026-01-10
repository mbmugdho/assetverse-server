const express = require('express')
const {
  createAsset,
  getAssets,
  updateAsset,
  deleteAsset,
  getAvailableAssetsForRequest,
  getPublicAssets,
  getAssetById,
} = require('../controllers/assetController')
const verifyToken = require('../middleware/verifyToken')
const verifyHR = require('../middleware/verifyHR')

const router = express.Router()

// PUBLIC: Get all assets for public listing (no auth required)
router.get('/public', getPublicAssets)

// Authenticated: Get single asset details (requires login)
router.get('/details/:id', verifyToken, getAssetById)

// Authenticated (employee or HR): get all available assets to request
router.get('/available', verifyToken, getAvailableAssetsForRequest)

// HR only: create asset
router.post('/', verifyToken, verifyHR, createAsset)

// HR only: get assets with pagination & filters
router.get('/', verifyToken, verifyHR, getAssets)

// HR only: update asset
router.patch('/:id', verifyToken, verifyHR, updateAsset)

// HR only: delete asset
router.delete('/:id', verifyToken, verifyHR, deleteAsset)

module.exports = router