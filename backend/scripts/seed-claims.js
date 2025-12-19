/**
 * Seed Claims Data Script
 * Imports sample claims from CSV into MongoDB
 * 
 * Run with: node scripts/seed-claims.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Import Claim model after loading env
import Claim from '../src/modules/claimclean/models/Claim.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password@127.0.0.1:27017/waste-verification-mvp?authSource=admin';

async function seedClaims() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Read CSV file
    const csvPath = path.join(__dirname, '..', 'data', 'sample-claims.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    console.log(`Found ${records.length} claims in CSV`);

    // Clear existing claims (optional - comment out if you want to append)
    const deleteResult = await Claim.deleteMany({});
    console.log(`✓ Cleared ${deleteResult.deletedCount} existing claims`);

    let imported = 0;
    let errors = [];

    for (let i = 0; i < records.length; i++) {
      const record = records[i];
      try {
        const claimData = {
          brandId: record.brand_id,
          recyclerId: record.recycler_id,
          facilityId: record.facility_id,
          period: {
            from: new Date(record.period_from),
            to: new Date(record.period_to),
          },
          claimedWeightKg: parseFloat(record.weight_kg) || 0,
          status: record.status || 'submitted',
          plasticType: record.plastic_type || 'mixed',
          audit: record.score ? {
            score: parseFloat(record.score),
            issues: [],
          } : undefined,
        };

        await Claim.create(claimData);
        imported++;
        console.log(`  ✓ Imported: ${record.brand_id} - ${record.recycler_id} (${record.weight_kg} kg)`);
      } catch (error) {
        errors.push({ row: i + 2, error: error.message });
        console.log(`  ✗ Error row ${i + 2}: ${error.message}`);
      }
    }

    console.log('\n========================================');
    console.log('Claims seeded successfully!');
    console.log('========================================');
    console.log(`Total in CSV: ${records.length}`);
    console.log(`Imported: ${imported}`);
    console.log(`Errors: ${errors.length}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('Error seeding claims:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
}

seedClaims();
