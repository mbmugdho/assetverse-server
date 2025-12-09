const express = require('express')
const {
  getMyAffiliations,
  getHREmployeesWithAssets,
  removeHREmployee,
} = require('../controllers/affiliationController')
const verifyToken = require('../middleware/verifyToken')
const verifyHR = require('../middleware/verifyHR')

const router = express.Router()

// Employee: get companies they are affiliated with
router.get('/me', verifyToken, getMyAffiliations)

// HR: get employees + asset counts
router.get('/hr', verifyToken, verifyHR, getHREmployeesWithAssets)

// HR: remove employee from team
router.patch('/:id/remove', verifyToken, verifyHR, removeHREmployee)

module.exports = router
