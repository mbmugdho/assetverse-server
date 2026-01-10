const { getDB } = require('../config/db')

/**
 * Demo user credentials:
 * 
 * HR Manager:
 *   Email: demo.hr@assetverse.app
 *   Password: Demo@123
 * 
 * Employee:
 *   Email: demo.employee@assetverse.app
 *   Password: Demo@123
 * 
 * NOTE: These users must also be created in Firebase Authentication
 * with the same email/password for login to work!
 */

const demoUsers = [
  {
    name: 'Demo HR Manager',
    email: 'demo.hr@assetverse.app',
    dateOfBirth: new Date('1985-06-15'),
    role: 'hr',
    profileImage: 'https://i.ibb.co/7tQVpHX/hr-avatar.png',
    companyName: 'AssetVerse Demo Company',
    companyLogo: 'https://i.ibb.co/4pHqKZk/demo-company-logo.png',
    packageLimit: 10,
    currentEmployees: 1,
    subscription: 'standard',
  },
  {
    name: 'Demo Employee',
    email: 'demo.employee@assetverse.app',
    dateOfBirth: new Date('1992-03-22'),
    role: 'employee',
    profileImage: 'https://i.ibb.co/0jZpLqL/employee-avatar.png',
  },
]

const demoAssets = [
  {
    productName: 'MacBook Pro 16" M3',
    productImage: 'https://i.ibb.co/k6Z5vLQ/macbook-pro.png',
    productType: 'Returnable',
    productQuantity: 5,
    availableQuantity: 3,
    hrEmail: 'demo.hr@assetverse.app',
    companyName: 'AssetVerse Demo Company',
  },
  {
    productName: 'Dell UltraSharp 27" Monitor',
    productImage: 'https://i.ibb.co/YhKvXpL/dell-monitor.png',
    productType: 'Returnable',
    productQuantity: 10,
    availableQuantity: 7,
    hrEmail: 'demo.hr@assetverse.app',
    companyName: 'AssetVerse Demo Company',
  },
  {
    productName: 'Herman Miller Aeron Chair',
    productImage: 'https://i.ibb.co/3mVzJdZ/office-chair.png',
    productType: 'Returnable',
    productQuantity: 8,
    availableQuantity: 5,
    hrEmail: 'demo.hr@assetverse.app',
    companyName: 'AssetVerse Demo Company',
  },
  {
    productName: 'Logitech MX Master 3 Mouse',
    productImage: 'https://i.ibb.co/VwKx5Lq/mouse.png',
    productType: 'Returnable',
    productQuantity: 15,
    availableQuantity: 12,
    hrEmail: 'demo.hr@assetverse.app',
    companyName: 'AssetVerse Demo Company',
  },
  {
    productName: 'Office Stationery Kit',
    productImage: 'https://i.ibb.co/5G8Lm2d/stationery.png',
    productType: 'Non-returnable',
    productQuantity: 50,
    availableQuantity: 45,
    hrEmail: 'demo.hr@assetverse.app',
    companyName: 'AssetVerse Demo Company',
  },
  {
    productName: 'Wireless Keyboard',
    productImage: 'https://i.ibb.co/JnQxZ5b/keyboard.png',
    productType: 'Returnable',
    productQuantity: 12,
    availableQuantity: 9,
    hrEmail: 'demo.hr@assetverse.app',
    companyName: 'AssetVerse Demo Company',
  },
]

const demoAffiliation = {
  employeeEmail: 'demo.employee@assetverse.app',
  employeeName: 'Demo Employee',
  hrEmail: 'demo.hr@assetverse.app',
  companyName: 'AssetVerse Demo Company',
  companyLogo: 'https://i.ibb.co/4pHqKZk/demo-company-logo.png',
  status: 'active',
}

const demoAssignedAssets = [
  {
    assetName: 'MacBook Pro 16" M3',
    assetImage: 'https://i.ibb.co/k6Z5vLQ/macbook-pro.png',
    assetType: 'Returnable',
    employeeEmail: 'demo.employee@assetverse.app',
    employeeName: 'Demo Employee',
    hrEmail: 'demo.hr@assetverse.app',
    companyName: 'AssetVerse Demo Company',
    status: 'assigned',
    returnDate: null,
  },
  {
    assetName: 'Dell UltraSharp 27" Monitor',
    assetImage: 'https://i.ibb.co/YhKvXpL/dell-monitor.png',
    assetType: 'Returnable',
    employeeEmail: 'demo.employee@assetverse.app',
    employeeName: 'Demo Employee',
    hrEmail: 'demo.hr@assetverse.app',
    companyName: 'AssetVerse Demo Company',
    status: 'assigned',
    returnDate: null,
  },
]

const seedDemoUsers = async () => {
  try {
    const db = getDB()
    const usersColl = db.collection('users')
    const assetsColl = db.collection('assets')
    const affiliationsColl = db.collection('employeeAffiliations')
    const assignedAssetsColl = db.collection('assignedAssets')

    const now = new Date()

    // Check if demo HR already exists
    const existingHR = await usersColl.findOne({ email: 'demo.hr@assetverse.app' })
    
    if (existingHR) {
      console.log('✓ Demo users already exist. Skipping seed.')
      return { 
        seeded: false, 
        message: 'Demo users already exist' 
      }
    }

    // Insert demo users
    for (const user of demoUsers) {
      await usersColl.insertOne({
        ...user,
        createdAt: now,
        updatedAt: now,
      })
    }
    console.log('✓ Demo users created')

    // Insert demo assets
    for (const asset of demoAssets) {
      await assetsColl.insertOne({
        ...asset,
        dateAdded: now,
      })
    }
    console.log('✓ Demo assets created')

    // Insert demo affiliation
    await affiliationsColl.insertOne({
      ...demoAffiliation,
      affiliationDate: now,
    })
    console.log('✓ Demo affiliation created')

    // Get inserted asset IDs for assigned assets
    const macbook = await assetsColl.findOne({ 
      productName: 'MacBook Pro 16" M3',
      hrEmail: 'demo.hr@assetverse.app'
    })
    const monitor = await assetsColl.findOne({ 
      productName: 'Dell UltraSharp 27" Monitor',
      hrEmail: 'demo.hr@assetverse.app'
    })

    // Insert demo assigned assets
    if (macbook) {
      await assignedAssetsColl.insertOne({
        ...demoAssignedAssets[0],
        assetId: macbook._id,
        assignmentDate: now,
      })
    }
    if (monitor) {
      await assignedAssetsColl.insertOne({
        ...demoAssignedAssets[1],
        assetId: monitor._id,
        assignmentDate: now,
      })
    }
    console.log('✓ Demo assigned assets created')

    console.log('')
    console.log('═══════════════════════════════════════════════════════')
    console.log('  DEMO USERS SEEDED SUCCESSFULLY!')
    console.log('═══════════════════════════════════════════════════════')
    console.log('')
    console.log('  ⚠️  IMPORTANT: You must also create these users in')
    console.log('     Firebase Authentication with these credentials:')
    console.log('')
    console.log('  👔 HR Manager:')
    console.log('     Email:    demo.hr@assetverse.app')
    console.log('     Password: Demo@123')
    console.log('')
    console.log('  👤 Employee:')
    console.log('     Email:    demo.employee@assetverse.app')
    console.log('     Password: Demo@123')
    console.log('')
    console.log('═══════════════════════════════════════════════════════')

    return { 
      seeded: true, 
      message: 'Demo users, assets, and affiliations created successfully' 
    }
  } catch (err) {
    console.error('Error seeding demo users:', err)
    throw err
  }
}

module.exports = seedDemoUsers