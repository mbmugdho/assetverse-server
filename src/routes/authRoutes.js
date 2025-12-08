const express = require('express')

const router = express.Router()

//  test route
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' })
})

module.exports = router