import { createSampleData } from '../firebase/migrateToUserSubcollections.js';

async function runMigration() {
  try {
    console.log('Starting Firebase migration...');
    
    // Create sample data for testing
    await createSampleData();
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
