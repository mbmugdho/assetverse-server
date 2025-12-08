const { ObjectId } = require('mongodb')
const { getDB } = require('../config/db.js')

/**
 * POST /api/assets
 * HR only
 * Body: { productName, productImage, productType, productQuantity }
 */
const createAsset = async (req, res, next) => {
  try {
    const { productName, productImage, productType, productQuantity } = req.body

    if (!productName || !productImage || !productType || !productQuantity) {
      return res
        .status(400)
        .json({ message: 'All fields are required for creating an asset' })
    }

    if (!['Returnable', 'Non-returnable'].includes(productType)) {
      return res
        .status(400)
        .json({ message: 'productType must be Returnable or Non-returnable' })
    }

    const quantityNum = Number(productQuantity)
    if (Number.isNaN(quantityNum) || quantityNum < 0) {
      return res
        .status(400)
        .json({ message: 'productQuantity must be a non-negative number' })
    }

    const db = getDB()
    const assetsColl = db.collection('assets')
    const usersColl = db.collection('users')

    // Get HR  to read companyName
    const hrUser = await usersColl.findOne({ email: req.user.email })
    if (!hrUser) {
      return res.status(404).json({ message: 'HR user not found' })
    }

    const now = new Date()

    const assetDoc = {
      productName,
      productImage,
      productType,                      
      productQuantity: quantityNum,
      availableQuantity: quantityNum,    
      dateAdded: now,
      hrEmail: req.user.email,
      companyName: hrUser.companyName || '',
    }

    const result = await assetsColl.insertOne(assetDoc)

    res.status(201).json({
      message: 'Asset created',
      asset: { ...assetDoc, _id: result.insertedId },
    })
  } catch (err) {
    next(err)
  }
}

/**
 * GET /api/assets
 * HR only
 * Query: page, limit, search, type
 */
const getAssets = async (req, res, next) => {
  try {
    const db = getDB()
    const assetsColl = db.collection('assets')

    const hrEmail = req.user.email

    let {
      page = 1,
      limit = 10,
      search = '',
      type = 'All',
    } = req.query

    page = Number(page) || 1
    limit = Number(limit) || 10

    const filter = { hrEmail }

    if (search) {
      filter.productName = { $regex: search, $options: 'i' }
    }

    if (type !== 'All') {
      filter.productType = type
    }

    const skip = (page - 1) * limit

    const [data, total] = await Promise.all([
      assetsColl
        .find(filter)
        .sort({ dateAdded: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
      assetsColl.countDocuments(filter),
    ])

    res.json({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (err) {
    next(err)
  }
}

/**
 * PATCH /api/assets/:id
 * HR only
 * Body can contain any of: { productName, productImage, productType, productQuantity }
 */
const updateAsset = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid asset id' })
    }

    const { productName, productImage, productType, productQuantity } = req.body

    const update = {}
    if (productName) update.productName = productName
    if (productImage) update.productImage = productImage
    if (productType) {
      if (!['Returnable', 'Non-returnable'].includes(productType)) {
        return res
          .status(400)
          .json({ message: 'productType must be Returnable or Non-returnable' })
      }
      update.productType = productType
    }

    const db = getDB()
    const assetsColl = db.collection('assets')

    if (productQuantity !== undefined) {
      const qtyNum = Number(productQuantity)
      if (Number.isNaN(qtyNum) || qtyNum < 0) {
        return res
          .status(400)
          .json({ message: 'productQuantity must be a non-negative number' })
      }

      const existing = await assetsColl.findOne({ _id: new ObjectId(id) })
      if (!existing) {
        return res.status(404).json({ message: 'Asset not found' })
      }

      const usedQuantity = existing.productQuantity - existing.availableQuantity
      if (qtyNum < usedQuantity) {
        return res.status(400).json({
          message:
            'New quantity cannot be less than number of already assigned units',
        })
      }

      update.productQuantity = qtyNum
      update.availableQuantity = qtyNum - usedQuantity
    }

    if (Object.keys(update).length === 0) {
      return res
        .status(400)
        .json({ message: 'No valid fields provided for update' })
    }

    update.updatedAt = new Date()

    const result = await assetsColl.updateOne(
      { _id: new ObjectId(id), hrEmail: req.user.email },
      { $set: update }
    )

    if (result.matchedCount === 0) {
      return res
        .status(404)
        .json({ message: 'Asset not found or not owned by this HR' })
    }

    const updated = await assetsColl.findOne({
      _id: new ObjectId(id),
    })

    res.json({ message: 'Asset updated', asset: updated })
  } catch (err) {
    next(err)
  }
}

/**
 * DELETE /api/assets/:id
 * HR only
 */
const deleteAsset = async (req, res, next) => {
  try {
    const { id } = req.params
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid asset id' })
    }

    const db = getDB()
    const assetsColl = db.collection('assets')

    const result = await assetsColl.deleteOne({
      _id: new ObjectId(id),
      hrEmail: req.user.email,
    })

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ message: 'Asset not found or not owned by this HR' })
    }

    res.json({ message: 'Asset deleted' })
  } catch (err) {
    next(err)
  }
}

module.exports = { createAsset, getAssets, updateAsset, deleteAsset }