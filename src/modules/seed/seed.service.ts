import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as argon2 from 'argon2';
import { User, UserDocument } from '../users/user.schema';

export interface AdminSeedConfig {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /**
   * Seed an admin user if it doesn't already exist
   * @param config Admin user configuration
   * @returns Created or existing admin user
   */
  async seedAdmin(config: AdminSeedConfig): Promise<UserDocument> {
    const { email, password, name, phone } = config;

    // Check if admin already exists
    const existingAdmin = await this.userModel.findOne({ email }).exec();
    if (existingAdmin) {
      this.logger.log(`Admin user with email ${email} already exists. Skipping seed.`);
      return existingAdmin;
    }

    // Create admin user
    const passwordHash = await argon2.hash(password);
    const adminUser = await this.userModel.create({
      name,
      email,
      passwordHash,
      phone,
      roles: ['admin'],
    });

    this.logger.log(`✅ Admin user created successfully: ${email}`);
    return adminUser;
  }

  /**
   * Seed admin from environment variables
   * @returns Created or existing admin user, or null if env vars not set
   */
  async seedAdminFromEnv(): Promise<UserDocument | null> {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const name = process.env.ADMIN_NAME || 'Admin User';
    const phone = process.env.ADMIN_PHONE;

    if (!email || !password) {
      this.logger.warn(
        'ADMIN_EMAIL and ADMIN_PASSWORD environment variables not set. Skipping admin seed.',
      );
      return null;
    }

    return this.seedAdmin({ email, password, name, phone });
  }

  /**
   * Check if any admin user exists in the database
   * @returns true if at least one admin exists
   */
  async hasAdmin(): Promise<boolean> {
    const adminCount = await this.userModel.countDocuments({ roles: 'admin' }).exec();
    return adminCount > 0;
  }
}

