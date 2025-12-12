const verifyHR = (req, res, next) => {
  if (!req.user || req.user.role !== 'hr') {
    return res.status(403).json({ message: 'Forbidden: HR only' })
  }
  next()
}

module.exports = verifyHR