const express = require('express')
const {
  createCheckoutSession,
  confirmPayment,
  getMyPayments,
} = require('../controllers/paymentController')
const verifyToken = require('../middleware/verifyToken')
const verifyHR = require('../middleware/verifyHR')

const router = express.Router()

// HR: create Stripe checkout session
router.post(
  '/create-checkout-session',
  verifyToken,
  verifyHR,
  createCheckoutSession
)

// HR: confirm payment after returning from Stripe
router.get('/confirm', verifyToken, verifyHR, confirmPayment)

// HR: payment history
router.get('/', verifyToken, verifyHR, getMyPayments)

module.exports = router