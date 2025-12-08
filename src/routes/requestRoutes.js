const express = require('express')
const {
  createRequest,
  getHRRequests,
  getMyRequests,
  approveRequest,
  rejectRequest,
} = require('../controllers/requestController')
const verifyToken = require('../middleware/verifyToken')
const verifyHR = require('../middleware/verifyHR')

const router = express.Router()

// Employee: create a request
router.post('/', verifyToken, createRequest)

// HR: get all requests for this HR (optional status filter)
router.get('/hr', verifyToken, verifyHR, getHRRequests)

// Employee: get own requests
router.get('/me', verifyToken, getMyRequests)

// HR: approve/reject
router.patch('/:id/approve', verifyToken, verifyHR, approveRequest)
router.patch('/:id/reject', verifyToken, verifyHR, rejectRequest)

module.exports = router