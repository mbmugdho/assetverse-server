const { getDB } = require('../config/db')

const seedPackagesIfNeeded = async () => {
  const db = getDB()
  const packagesColl = db.collection('packages')
  const count = await packagesColl.countDocuments()
  if (count === 0) {
    await packagesColl.insertMany([
      {
        name: 'Basic',
        employeeLimit: 5,
        price: 5,
        features: [
          'Asset Tracking',
          'Employee Management',
          'Basic Support',
        ],
      },
      {
        name: 'Standard',
        employeeLimit: 10,
        price: 8,
        features: [
          'All Basic features',
          'Advanced Analytics',
          'Priority Support',
        ],
      },
      {
        name: 'Premium',
        employeeLimit: 20,
        price: 15,
        features: [
          'All Standard features',
          'Custom Branding',
          '24/7 Support',
        ],
      },
    ])
    console.log('Seeded packages collection')
  }
}

module.exports = seedPackagesIfNeeded