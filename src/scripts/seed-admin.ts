#!/usr/bin/env ts-node
/**
 * Seed Admin User Script
 * 
 * Usage:
 *   npm run seed:admin
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123 npm run seed:admin
 *   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=SecurePass123 ADMIN_NAME="Admin User" ADMIN_PHONE="+23012345678" npm run seed:admin
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from '../modules/seed/seed.service';
import * as readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function seedAdmin() {
  try {
    console.log('🌱 Starting admin user seeding...\n');

    // Get admin details from environment variables or prompt
    let email = process.env.ADMIN_EMAIL;
    let password = process.env.ADMIN_PASSWORD;
    let name = process.env.ADMIN_NAME;
    let phone = process.env.ADMIN_PHONE;

    // Prompt for missing values
    if (!email) {
      email = await question('Enter admin email: ');
    }
    if (!password) {
      password = await question('Enter admin password: ');
    }
    if (!name) {
      name = await question('Enter admin name (default: Admin User): ') || 'Admin User';
    }
    if (!phone) {
      phone = await question('Enter admin phone (optional, press Enter to skip): ') || undefined;
    }

    // Validate inputs
    if (!email || !email.includes('@')) {
      console.error('❌ Invalid email address');
      process.exit(1);
    }
    if (!password || password.length < 8) {
      console.error('❌ Password must be at least 8 characters long');
      process.exit(1);
    }

    // Create NestJS application context
    const app = await NestFactory.createApplicationContext(AppModule, {
      logger: ['error', 'warn', 'log'],
    });

    const seedService = app.get(SeedService);

    // Seed admin user
    const admin = await seedService.seedAdmin({
      email,
      password,
      name,
      phone,
    });

    console.log('\n✅ Admin user seeded successfully!');
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Roles: ${admin.roles.join(', ')}`);
    console.log(`   ID: ${admin._id}\n`);

    await app.close();
    rl.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding admin user:', error);
    rl.close();
    process.exit(1);
  }
}

// Run the seed function
seedAdmin();

