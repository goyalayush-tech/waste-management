/**
 * Database migration runner utility
 * Handles running PostgreSQL migrations and MongoDB collection setup
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectPostgreSQL, connectMongoDB } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Run PostgreSQL migrations
 */
export const runPostgreSQLMigrations = async () => {
  try {
    console.log('Running PostgreSQL migrations...');
    
    const sequelize = await connectPostgreSQL();
    const queryInterface = sequelize.getQueryInterface();
    
    // Create migrations table if it doesn't exist
    await queryInterface.createTable('migrations', {
      id: {
        type: 'INTEGER',
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: 'STRING',
        allowNull: false,
        unique: true
      },
      executed_at: {
        type: 'DATE',
        defaultValue: 'NOW()'
      }
    });

    // Get list of executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM migrations ORDER BY executed_at'
    );
    const executedNames = executedMigrations.map(m => m.name);

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    // Run pending migrations
    for (const file of migrationFiles) {
      const migrationName = file.replace('.js', '');
      
      if (!executedNames.includes(migrationName)) {
        console.log(`Running migration: ${migrationName}`);
        
        const migrationPath = path.join(migrationsDir, file);
        const migration = await import(migrationPath);
        
        await migration.up(queryInterface);
        
        // Record migration as executed
        await sequelize.query(
          'INSERT INTO migrations (name) VALUES (?)',
          { replacements: [migrationName] }
        );
        
        console.log(`Migration completed: ${migrationName}`);
      }
    }

    console.log('PostgreSQL migrations completed successfully');
  } catch (error) {
    console.error('PostgreSQL migration failed:', error);
    throw error;
  }
};

/**
 * Setup MongoDB collections and indexes
 */
export const setupMongoDBCollections = async () => {
  try {
    console.log('Setting up MongoDB collections...');
    
    await connectMongoDB();
    const mongoose = (await import('mongoose')).default;
    const db = mongoose.connection.db;

    // Create collections if they don't exist
    const collections = [
      'users',
      'wastesubmissions',
      'wastecredits',
      'blockchaintransactions',
      'ipfsmetadata'
    ];

    for (const collectionName of collections) {
      const exists = await db.listCollections({ name: collectionName }).hasNext();
      if (!exists) {
        await db.createCollection(collectionName);
        console.log(`Created collection: ${collectionName}`);
      }
    }

    // Create indexes for better performance
    
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });
    await db.collection('users').createIndex({ role: 1 });
    await db.collection('users').createIndex({ 'profile.walletAddress': 1 });

    // WasteSubmissions collection indexes
    await db.collection('wastesubmissions').createIndex({ vendorId: 1 });
    await db.collection('wastesubmissions').createIndex({ status: 1 });
    await db.collection('wastesubmissions').createIndex({ batchId: 1 }, { unique: true });
    await db.collection('wastesubmissions').createIndex({ qrCode: 1 }, { unique: true });
    await db.collection('wastesubmissions').createIndex({ 'location.coordinates': '2dsphere' });
    await db.collection('wastesubmissions').createIndex({ createdAt: -1 });
    await db.collection('wastesubmissions').createIndex({ 'aiVerification.wasteType': 1 });

    // WasteCredits collection indexes
    await db.collection('wastecredits').createIndex({ submissionId: 1 });
    await db.collection('wastecredits').createIndex({ vendorId: 1 });
    await db.collection('wastecredits').createIndex({ wasteType: 1 });
    await db.collection('wastecredits').createIndex({ available: 1 });
    await db.collection('wastecredits').createIndex({ createdAt: -1 });
    await db.collection('wastecredits').createIndex({ blockchainTx: 1 });

    // BlockchainTransactions collection indexes
    await db.collection('blockchaintransactions').createIndex({ transactionHash: 1 }, { unique: true });
    await db.collection('blockchaintransactions').createIndex({ entityType: 1, entityId: 1 });
    await db.collection('blockchaintransactions').createIndex({ status: 1 });
    await db.collection('blockchaintransactions').createIndex({ createdAt: -1 });

    // IPFSMetadata collection indexes
    await db.collection('ipfsmetadata').createIndex({ ipfsHash: 1 }, { unique: true });
    await db.collection('ipfsmetadata').createIndex({ entityType: 1, entityId: 1 });
    await db.collection('ipfsmetadata').createIndex({ createdAt: -1 });

    console.log('MongoDB collections and indexes created successfully');
  } catch (error) {
    console.error('MongoDB setup failed:', error);
    throw error;
  }
};

/**
 * Run all database migrations and setup
 */
export const runAllMigrations = async () => {
  try {
    console.log('Starting database migration process...');
    
    await Promise.all([
      runPostgreSQLMigrations(),
      setupMongoDBCollections()
    ]);

    console.log('All database migrations completed successfully');
  } catch (error) {
    console.error('Database migration process failed:', error);
    throw error;
  }
};

/**
 * Rollback PostgreSQL migrations
 */
export const rollbackPostgreSQLMigrations = async (targetMigration = null) => {
  try {
    console.log('Rolling back PostgreSQL migrations...');
    
    const sequelize = await connectPostgreSQL();
    const queryInterface = sequelize.getQueryInterface();
    
    // Get list of executed migrations
    const [executedMigrations] = await sequelize.query(
      'SELECT name FROM migrations ORDER BY executed_at DESC'
    );

    // Get list of migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    
    for (const migration of executedMigrations) {
      if (targetMigration && migration.name === targetMigration) {
        break;
      }

      console.log(`Rolling back migration: ${migration.name}`);
      
      const migrationPath = path.join(migrationsDir, `${migration.name}.js`);
      const migrationModule = await import(migrationPath);
      
      await migrationModule.down(queryInterface);
      
      // Remove migration record
      await sequelize.query(
        'DELETE FROM migrations WHERE name = ?',
        { replacements: [migration.name] }
      );
      
      console.log(`Migration rolled back: ${migration.name}`);
    }

    console.log('PostgreSQL migrations rolled back successfully');
  } catch (error) {
    console.error('PostgreSQL rollback failed:', error);
    throw error;
  }
};