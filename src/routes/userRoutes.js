// src/routes/userRoutes.js
const express = require('express')
const { createUser, getMe } = require('../controllers/userController')
const verifyToken = require('../middleware/verifyToken')

const router = express.Router()

// Called from frontend after Firebase registration
router.post('/', createUser)

// Get current user profile (JWT required)
router.get('/me', verifyToken, getMe)

module.exports = router