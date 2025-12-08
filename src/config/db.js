const { MongoClient, ServerApiVersion } = require('mongodb')

let db = null

const connectDB = async () => {
  if (db) return db

  const uri = process.env.MONGODB_URI
  const dbName = process.env.DB_NAME || 'assetverse'

  if (!uri) {
    throw new Error('MONGODB_URI is not set in .env')
  }

  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  })

  await client.connect()
  db = client.db(dbName)
  console.log('MongoDB connected:', dbName)
  return db
}

const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB() first.')
  }
  return db
}

module.exports = { connectDB, getDB }