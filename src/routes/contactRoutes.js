const express = require('express')
const {
  submitContactForm,
  getContactSubmissions,
  updateContactStatus,
} = require('../controllers/contactController')
const verifyToken = require('../middleware/verifyToken')
const verifyHR = require('../middleware/verifyHR')

const router = express.Router()

// Public: submit contact form
router.post('/', submitContactForm)

// HR only: view contact submissions (optional admin feature)
router.get('/', verifyToken, verifyHR, getContactSubmissions)

// HR only: update contact status
router.patch('/:id/status', verifyToken, verifyHR, updateContactStatus)

module.exports = router
