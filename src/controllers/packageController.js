const { getDB } = require('../config/db')

// GET /api/packages
const getPackages = async (req, res, next) => {
  try {
    const db = getDB()
    const packagesColl = db.collection('packages')
    const pkgs = await packagesColl.find({}).sort({ price: 1 }).toArray()
    res.json(pkgs)
  } catch (err) {
    next(err)
  }
}

module.exports = { getPackages }