const express = require('express')
const { createUser, getMe, updateMe } = require('../controllers/userController')
const verifyToken = require('../middleware/verifyToken')

const router = express.Router()

router.post('/', createUser)
router.get('/me', verifyToken, getMe)
router.patch('/me', verifyToken, updateMe)

module.exports = router
