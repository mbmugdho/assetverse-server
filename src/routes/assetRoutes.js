const express = require('express')
const {
  createAsset,
  getAssets,
  updateAsset,
  deleteAsset,
} = require('../controllers/assetController')
const verifyToken = require('../middleware/verifyToken')
const verifyHR = require('../middleware/verifyHR')

const router = express.Router()

// HR only: create asset
router.post('/', verifyToken, verifyHR, createAsset)

// HR only: get assets with pagination & filters
router.get('/', verifyToken, verifyHR, getAssets)

// HR only: update asset
router.patch('/:id', verifyToken, verifyHR, updateAsset)

// HR only: delete asset
router.delete('/:id', verifyToken, verifyHR, deleteAsset)

module.exports = router
