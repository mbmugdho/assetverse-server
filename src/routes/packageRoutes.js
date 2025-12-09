const express = require('express')
const { getPackages } = require('../controllers/packageController')

const router = express.Router()

router.get('/', getPackages)

module.exports = router