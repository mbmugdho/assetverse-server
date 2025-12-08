// src/routes/assignmentRoutes.js
const express = require('express')
const {
  getMyAssignedAssets,
  getHRAssignedAssets,
  returnAssignedAsset,
} = require('../controllers/assignmentController')
const verifyToken = require('../middleware/verifyToken')
const verifyHR = require('../middleware/verifyHR')

const router = express.Router()

// Employee: get own assigned assets
router.get('/me', verifyToken, getMyAssignedAssets)

// HR: (optional) get assigned assets under this HR
router.get('/hr', verifyToken, verifyHR, getHRAssignedAssets)

// Employee: return an assigned asset (Returnable only)
router.patch('/:id/return', verifyToken, returnAssignedAsset)

module.exports = router