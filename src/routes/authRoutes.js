const express = require('express')
const { issueJwt, logout } = require('../controllers/authController')

const router = express.Router()

router.post('/jwt', issueJwt)
router.post('/logout', logout)

module.exports = router