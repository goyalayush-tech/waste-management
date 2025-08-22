#!/usr/bin/env node

/**
 * Database migration CLI script
 * Usage: node src/scripts/migrate.js [command] [options]
 */

import { program } from 'commander';
import { 
  runAllMigrations, 
  runPostgreSQLMigrations, 
  setupMongoDBCollections,
  rollbackPostgreSQLMigrations 
} from '../utils/migrationRunner.js';
import { initializeDatabases, closeDatabases } from '../config/database.js';
import { healthChecker } from '../utils/connectionUtils.js';

program
  .name('migrate')
  .description('Database migration utility for Waste Verification MVP')
  .version('1.0.0');

program
  .command('up')
  .description('Run all pending migrations')
  .action(async () => {
    try {
      console.log('🚀 Starting database migration...');
      
      await initializeDatabases();
      await runAllMigrations();
      
      console.log('✅ All migrations completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      await closeDatabases();
    }
  });

program
  .command('postgres')
  .description('Run only PostgreSQL migrations')
  .action(async () => {
    try {
      console.log('🚀 Starting PostgreSQL migrations...');
      
      await initializeDatabases();
      await runPostgreSQLMigrations();
      
      console.log('✅ PostgreSQL migrations completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ PostgreSQL migration failed:', error);
      process.exit(1);
    } finally {
      await closeDatabases();
    }
  });

program
  .command('mongo')
  .description('Setup MongoDB collections and indexes')
  .action(async () => {
    try {
      console.log('🚀 Setting up MongoDB collections...');
      
      await initializeDatabases();
      await setupMongoDBCollections();
      
      console.log('✅ MongoDB setup completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ MongoDB setup failed:', error);
      process.exit(1);
    } finally {
      await closeDatabases();
    }
  });

program
  .command('rollback')
  .description('Rollback PostgreSQL migrations')
  .option('-t, --target <migration>', 'Target migration to rollback to')
  .action(async (options) => {
    try {
      console.log('🔄 Rolling back PostgreSQL migrations...');
      
      await initializeDatabases();
      await rollbackPostgreSQLMigrations(options.target);
      
      console.log('✅ PostgreSQL rollback completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ PostgreSQL rollback failed:', error);
      process.exit(1);
    } finally {
      await closeDatabases();
    }
  });

program
  .command('status')
  .description('Check database connection status')
  .action(async () => {
    try {
      console.log('🔍 Checking database connections...');
      
      await initializeDatabases();
      const status = await healthChecker.checkAllConnections();
      
      console.log('\n📊 Database Status:');
      console.log(`MongoDB: ${status.mongodb ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`PostgreSQL: ${status.postgresql ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`Redis: ${status.redis ? '✅ Connected' : '❌ Disconnected'}`);
      console.log(`Timestamp: ${status.timestamp}`);
      
      const allConnected = status.mongodb && status.postgresql && status.redis;
      process.exit(allConnected ? 0 : 1);
    } catch (error) {
      console.error('❌ Status check failed:', error);
      process.exit(1);
    } finally {
      await closeDatabases();
    }
  });

program
  .command('stats')
  .description('Get database statistics')
  .action(async () => {
    try {
      console.log('📈 Gathering database statistics...');
      
      await initializeDatabases();
      const stats = await healthChecker.getDatabaseStats();
      
      console.log('\n📊 Database Statistics:');
      console.log(JSON.stringify(stats, null, 2));
      
      process.exit(0);
    } catch (error) {
      console.error('❌ Stats gathering failed:', error);
      process.exit(1);
    } finally {
      await closeDatabases();
    }
  });

program
  .command('reset')
  .description('Reset all databases (WARNING: This will delete all data)')
  .option('--confirm', 'Confirm that you want to delete all data')
  .action(async (options) => {
    if (!options.confirm) {
      console.log('⚠️  This command will delete all data in the databases.');
      console.log('Use --confirm flag to proceed: node src/scripts/migrate.js reset --confirm');
      process.exit(1);
    }

    try {
      console.log('🗑️  Resetting all databases...');
      
      await initializeDatabases();
      
      // Rollback all PostgreSQL migrations
      await rollbackPostgreSQLMigrations();
      
      // Drop MongoDB collections
      const mongoose = (await import('mongoose')).default;
      const db = mongoose.connection.db;
      const collections = await db.listCollections().toArray();
      
      for (const collection of collections) {
        if (collection.name !== 'migrations') {
          await db.dropCollection(collection.name);
          console.log(`Dropped MongoDB collection: ${collection.name}`);
        }
      }
      
      // Clear Redis
      const { getRedisClient } = await import('../utils/connectionUtils.js');
      const redis = getRedisClient();
      await redis.flushAll();
      console.log('Cleared Redis cache');
      
      console.log('✅ Database reset completed successfully');
      process.exit(0);
    } catch (error) {
      console.error('❌ Database reset failed:', error);
      process.exit(1);
    } finally {
      await closeDatabases();
    }
  });

// Handle uncaught errors
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  await closeDatabases();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  await closeDatabases();
  process.exit(1);
});

// Parse command line arguments
program.parse();