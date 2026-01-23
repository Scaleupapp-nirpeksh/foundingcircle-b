/**
 * Fix the email_1 index issue
 * Run with: node scripts/fix-email-index.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function fixEmailIndex() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foundingcircle';
    console.log('Connecting to MongoDB...');

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // First, remove the email field from all documents where it's null
    console.log('\nRemoving null email values from existing users...');
    const updateResult = await db.collection('users').updateMany(
      { email: null },
      { $unset: { email: '' } }
    );
    console.log(`Updated ${updateResult.modifiedCount} users (removed null email)`);

    // Also remove empty string emails
    const updateResult2 = await db.collection('users').updateMany(
      { email: '' },
      { $unset: { email: '' } }
    );
    console.log(`Updated ${updateResult2.modifiedCount} users (removed empty email)`);

    // List current indexes on users collection
    const indexes = await db.collection('users').indexes();
    console.log('\nCurrent indexes on users collection:');
    indexes.forEach(idx => {
      console.log('  -', idx.name, ':', JSON.stringify(idx.key), idx.unique ? '(UNIQUE)' : '', idx.sparse ? '(SPARSE)' : '');
    });

    // Check for email_1 index
    const emailIndex = indexes.find(idx => idx.name === 'email_1');

    if (emailIndex) {
      console.log('\nFound email_1 index:', JSON.stringify(emailIndex, null, 2));

      if (emailIndex.unique && !emailIndex.sparse) {
        console.log('This index is UNIQUE but NOT SPARSE - this is causing the duplicate null error');
        console.log('Dropping the index...');

        await db.collection('users').dropIndex('email_1');
        console.log('Index dropped successfully!');

        // Recreate as sparse index (only enforces uniqueness on non-null emails)
        console.log('Recreating as sparse unique index...');
        await db.collection('users').createIndex(
          { email: 1 },
          { unique: true, sparse: true, name: 'email_1' }
        );
        console.log('New sparse unique index created!');
      } else if (emailIndex.unique && emailIndex.sparse) {
        console.log('Index is already configured correctly (unique + sparse)');
      } else {
        console.log('Index is not unique, no action needed');
      }
    } else {
      console.log('\nNo email_1 index found - creating sparse unique index...');
      await db.collection('users').createIndex(
        { email: 1 },
        { unique: true, sparse: true, name: 'email_1' }
      );
      console.log('Sparse unique index created!');
    }

    // Show final indexes
    const finalIndexes = await db.collection('users').indexes();
    console.log('\nFinal indexes on users collection:');
    finalIndexes.forEach(idx => {
      console.log('  -', idx.name, ':', JSON.stringify(idx.key), idx.unique ? '(UNIQUE)' : '', idx.sparse ? '(SPARSE)' : '');
    });

    await mongoose.disconnect();
    console.log('\nDone! You can now onboard new users.');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixEmailIndex();
