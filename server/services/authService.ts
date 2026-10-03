import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/db';
import { config } from '../config/env';
import { formatUser } from '../utils/formatUser';
import { sendEmailOtp, verifyEmailOtp } from './otpService';

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
  phone?: string;
  district?: string;
  city?: string;
  businessName?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

function suspendedError() {
  const error: any = new Error('This account has been suspended. Please contact BorrowLK support.');
  error.code = 'ACCOUNT_SUSPENDED';
  error.status = 401;
  return error;
}

export class AuthService {
  static async register(data: RegisterDTO) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      const error: any = new Error('An account with this email address already exists.');
      error.code = 'EMAIL_ALREADY_EXISTS';
      error.status = 400;
      throw error;
    }

    // Every sign-up creates a normal (renter) account; host / provider are added later to the same account
    const role = 'customer';
    const passwordHash = await bcrypt.hash(data.password, 10);
    const names = data.name.trim().split(' ');
    const firstName = names[0] || data.name;
    const lastName = names.slice(1).join(' ') || '';

    const res = await query(
      `INSERT INTO users (name, first_name, last_name, email, password_hash, phone, role, district, city, business_name, avatar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.name.trim(),
        firstName,
        lastName,
        data.email.toLowerCase().trim(),
        passwordHash,
        data.phone || null,
        role,
        data.district || 'Colombo',
        data.city || 'Colombo',
        data.businessName || null,
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80`
      ]
    );

    const user = formatUser(res.rows[0]);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return { user, token };
  }

  /** Admin-only: create another admin account */
  static async createAdmin(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [data.email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      const error: any = new Error('An account with this email address already exists.');
      error.code = 'EMAIL_ALREADY_EXISTS';
      error.status = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const names = data.name.trim().split(' ');
    const firstName = names[0] || data.name;
    const lastName = names.slice(1).join(' ') || '';

    const res = await query(
      `INSERT INTO users (name, first_name, last_name, email, password_hash, phone, role, district, city, avatar, verification_status, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, 'admin', 'Colombo', 'Colombo', $7, 'verified', TRUE)
       RETURNING id, name, first_name, last_name, email, phone, role, district, city, business_name, avatar, verification_status, email_verified, phone_verified, nic_verified, created_at`,
      [
        data.name.trim(),
        firstName,
        lastName,
        data.email.toLowerCase().trim(),
        passwordHash,
        data.phone || null,
        `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop&q=80`,
      ]
    );

    return formatUser(res.rows[0]);
  }

  static async login(data: LoginDTO) {
    const res = await query(
      `SELECT * FROM users WHERE email = $1`,
      [data.email.toLowerCase().trim()]
    );

    if (res.rows.length === 0) {
      const error: any = new Error('Invalid email or password.');
      error.code = 'INVALID_CREDENTIALS';
      error.status = 401;
      throw error;
    }

    const row = res.rows[0];
    const isMatch = await bcrypt.compare(data.password, row.password_hash);
    if (!isMatch) {
      const error: any = new Error('Invalid email or password.');
      error.code = 'INVALID_CREDENTIALS';
      error.status = 401;
      throw error;
    }

    if (row.is_suspended) {
      throw suspendedError();
    }

    const user = formatUser(row);
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn as any }
    );

    return { user, token };
  }

  static async getMe(userId: string) {
    const res = await query(
      `SELECT * FROM users WHERE id = $1`,
      [userId]
    );

    if (res.rows.length === 0) {
      const error: any = new Error('User not found.');
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    // A suspended account's session ends the next time the app checks it
    if (res.rows[0].is_suspended) {
      throw suspendedError();
    }

    return formatUser(res.rows[0]);
  }

  static async updateProfile(userId: string, updates: Record<string, any>) {
    const keyMap: Record<string, string> = {
      name: 'name',
      firstName: 'first_name',
      first_name: 'first_name',
      lastName: 'last_name',
      last_name: 'last_name',
      phone: 'phone',
      district: 'district',
      city: 'city',
      address: 'address',
      businessName: 'business_name',
      business_name: 'business_name',
      avatar: 'avatar',
      dob: 'dob',
    };

    const setClauses: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(updates)) {
      const column = keyMap[key];
      if (column && value !== undefined) {
        setClauses.push(`${column} = $${idx++}`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) {
      return this.getMe(userId);
    }

    setClauses.push(`updated_at = NOW()`);
    values.push(userId);

    const res = await query(
      `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${idx}
       RETURNING *`,
      values
    );

    return formatUser(res.rows[0]);
  }

  static async forgotPassword(email: string) {
    const normalized = email.toLowerCase().trim();
    const res = await query(`SELECT id, name FROM users WHERE email = $1`, [normalized]);

    // Always return a generic success message to avoid email enumeration
    if (res.rows.length === 0) {
      return { message: 'If an account exists for that email, a reset code has been sent.' };
    }

    // A failed or rate-limited send gets the same response, so the reply never reveals whether the account exists
    const result = await sendEmailOtp(normalized, res.rows[0].name);
    if (!result.success) {
      console.warn('⚠️ Password reset code was not sent:', result.message);
    }

    return { message: 'If an account exists for that email, a reset code has been sent.' };
  }

  static async resetPassword(email: string, otp: string, newPassword: string) {
    const normalized = email.toLowerCase().trim();
    const verified = await verifyEmailOtp(normalized, otp);
    if (!verified.success) {
      const error: any = new Error(verified.message);
      error.code = 'OTP_INVALID';
      error.status = 400;
      throw error;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    const res = await query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE email = $2 RETURNING id`,
      [passwordHash, normalized]
    );

    if (res.rows.length === 0) {
      const error: any = new Error('No account found for that email.');
      error.code = 'USER_NOT_FOUND';
      error.status = 404;
      throw error;
    }

    return { message: 'Password has been reset successfully.' };
  }
}
