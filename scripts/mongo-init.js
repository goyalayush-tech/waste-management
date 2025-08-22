// MongoDB initialization script for Waste Verification MVP

db = db.getSiblingDB('waste-verification-mvp');

// Create collections
db.createCollection('users');
db.createCollection('wasteSubmissions');
db.createCollection('wasteCredits');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ walletAddress: 1 }, { sparse: true });

db.wasteSubmissions.createIndex({ vendorId: 1 });
db.wasteSubmissions.createIndex({ status: 1 });
db.wasteSubmissions.createIndex({ createdAt: -1 });
db.wasteSubmissions.createIndex({ batchId: 1 }, { unique: true });
db.wasteSubmissions.createIndex({ qrCode: 1 }, { unique: true });

db.wasteCredits.createIndex({ submissionId: 1 });
db.wasteCredits.createIndex({ vendorId: 1 });
db.wasteCredits.createIndex({ available: 1 });
db.wasteCredits.createIndex({ wasteType: 1 });
db.wasteCredits.createIndex({ createdAt: -1 });

// Create admin user
db.users.insertOne({
  email: 'admin@wasteVerification.com',
  role: 'admin',
  profile: {
    name: 'System Administrator',
    organization: 'Waste Verification MVP'
  },
  createdAt: new Date(),
  updatedAt: new Date()
});

print('✅ Database initialized successfully');
print('📊 Collections created: users, wasteSubmissions, wasteCredits');
print('🔍 Indexes created for optimal performance');
print('👤 Admin user created: admin@wasteVerification.com');