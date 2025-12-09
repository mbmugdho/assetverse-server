const { getDB } = require('../config/db')
const stripe = require('../config/stripe')

// POST /api/payments/create-checkout-session
// Body: { packageName }
const createCheckoutSession = async (req, res, next) => {
  try {
    const hrEmail = req.user.email
    const { packageName } = req.body

    if (!packageName) {
      return res.status(400).json({ message: 'packageName is required' })
    }

    const db = getDB()
    const packagesColl = db.collection('packages')
    const paymentsColl = db.collection('payments')

    const pkg = await packagesColl.findOne({ name: packageName })
    if (!pkg) {
      return res.status(404).json({ message: 'Package not found' })
    }

    // For simplicity: charge price * employeeLimit once (e.g., monthly)
    const amountPerMonth = pkg.price * pkg.employeeLimit // USD
    const amountInCents = amountPerMonth * 100

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${pkg.name} Package (${pkg.employeeLimit} employees)`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/dashboard/hr/upgrade-package?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/hr/upgrade-package?canceled=1`,
    })

    // Record pending payment
    await paymentsColl.insertOne({
      hrEmail,
      packageName: pkg.name,
      employeeLimit: pkg.employeeLimit,
      amount: amountPerMonth,
      transactionId: session.id,
      paymentDate: null,
      status: 'pending',
      createdAt: new Date(),
    })

    res.json({ url: session.url })
  } catch (err) {
    next(err)
  }
}

// GET /api/payments/confirm?session_id=...
const confirmPayment = async (req, res, next) => {
  try {
    const { session_id } = req.query
    const hrEmail = req.user.email

    if (!session_id) {
      return res.status(400).json({ message: 'session_id is required' })
    }

    const db = getDB()
    const paymentsColl = db.collection('payments')
    const usersColl = db.collection('users')

    // Retrieve session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id)

    if (session.payment_status !== 'paid') {
      return res
        .status(400)
        .json({ message: 'Payment not completed yet' })
    }

    // Find pending payment
    const payment = await paymentsColl.findOne({
      hrEmail,
      transactionId: session_id,
      status: 'pending',
    })

    if (!payment) {
      return res.status(404).json({ message: 'Pending payment not found' })
    }

    // Update payment record
    await paymentsColl.updateOne(
      { _id: payment._id },
      {
        $set: {
          status: 'completed',
          paymentDate: new Date(),
        },
      }
    )

    // Update HR subscription
    await usersColl.updateOne(
      { email: hrEmail },
      {
        $set: {
          subscription: payment.packageName.toLowerCase(),
          packageLimit: payment.employeeLimit,
        },
      }
    )

    res.json({
      message: 'Payment confirmed and subscription updated',
      payment,
    })
  } catch (err) {
    next(err)
  }
}

// GET /api/payments
// HR: list own payments
const getMyPayments = async (req, res, next) => {
  try {
    const hrEmail = req.user.email
    const db = getDB()
    const paymentsColl = db.collection('payments')

    const payments = await paymentsColl
      .find({ hrEmail })
      .sort({ paymentDate: -1, createdAt: -1 })
      .toArray()

    res.json(payments)
  } catch (err) {
    next(err)
  }
}

module.exports = {
  createCheckoutSession,
  confirmPayment,
  getMyPayments,
}