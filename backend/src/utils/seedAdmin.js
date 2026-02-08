import connectDB from '../config/db.js';
import { config } from '../config/env.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

/**
 * Seed admin user (for reference - admin login uses .env credentials)
 * This is optional - admin authentication is handled via .env
 */
const seedAdmin = async () => {
  try {
    await connectDB();

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });

    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    // Note: Admin login uses .env credentials, not database user
    // This seed is just for reference
    console.log('ℹ️  Admin authentication uses .env credentials (ADMIN_USERNAME, ADMIN_PASSWORD)');
    console.log('ℹ️  No database admin user needed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();


