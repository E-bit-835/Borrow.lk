import crypto from 'crypto';
import { query } from '../config/db';
import { sendOtpEmail } from './emailService';

const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;
const MAX_VERIFY_ATTEMPTS = 5;

/**
 * Generate a cryptographically secure numeric OTP
 */
function generateOtp(): string {
  const max = Math.pow(10, OTP_LENGTH);
  const min = Math.pow(10, OTP_LENGTH - 1);
  const num = crypto.randomInt(min, max);
  return num.toString();
}

/**
 * Ensure the email_otps table exists (auto-creates on first use)
 */
let otpTableReady: Promise<void> | null = null;

function ensureOtpTable(): Promise<void> {
  // Run the DDL once per process instead of on every request; retry if it failed
  if (!otpTableReady) {
    otpTableReady = createOtpTable().catch((err) => {
      otpTableReady = null;
      throw err;
    });
  }
  return otpTableReady;
}

async function createOtpTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS email_otps (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      otp_code VARCHAR(10) NOT NULL,
      is_used BOOLEAN DEFAULT FALSE,
      attempts INT DEFAULT 0,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Older databases were created without the attempts counter
  await query(`ALTER TABLE email_otps ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0`);

  // Index for fast lookup
  await query(`
    CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email)
  `);
}

/**
 * Send OTP to user's email for verification
 */
export async function sendEmailOtp(email: string, userName?: string): Promise<{ success: boolean; message: string }> {
  await ensureOtpTable();

  const normalizedEmail = email.toLowerCase().trim();

  // Rate limit: max 5 OTPs per email in last 10 minutes
  const recentRes = await query(
    `SELECT COUNT(*) AS cnt FROM email_otps WHERE email = $1 AND created_at > NOW() - INTERVAL '10 minutes'`,
    [normalizedEmail]
  );

  if (parseInt(recentRes.rows[0].cnt, 10) >= 5) {
    return { success: false, message: 'Too many OTP requests. Please wait a few minutes and try again.' };
  }

  // Invalidate any existing unused OTPs for this email
  await query(
    `UPDATE email_otps SET is_used = TRUE WHERE email = $1 AND is_used = FALSE`,
    [normalizedEmail]
  );

  // Generate new OTP
  const otpCode = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store in database
  await query(
    `INSERT INTO email_otps (email, otp_code, expires_at) VALUES ($1, $2, $3)`,
    [normalizedEmail, otpCode, expiresAt.toISOString()]
  );

  // Send email
  const sent = await sendOtpEmail(normalizedEmail, otpCode, userName);
  if (!sent) {
    return { success: false, message: 'Failed to send verification email. Please try again.' };
  }

  return { success: true, message: `Verification code sent to ${normalizedEmail}` };
}

/**
 * Verify the OTP code entered by user
 */
export async function verifyEmailOtp(email: string, otpCode: string): Promise<{ success: boolean; message: string }> {
  await ensureOtpTable();

  const normalizedEmail = email.toLowerCase().trim();

  // Find valid (unused + not expired) OTP
  const res = await query(
    `SELECT id, otp_code, attempts FROM email_otps 
     WHERE email = $1 AND is_used = FALSE AND expires_at > NOW()
     ORDER BY created_at DESC LIMIT 1`,
    [normalizedEmail]
  );

  if (res.rows.length === 0) {
    return { success: false, message: 'No valid OTP found. It may have expired. Please request a new code.' };
  }

  const storedOtp = res.rows[0];

  if (storedOtp.otp_code !== otpCode.trim()) {
    // Burn the code after too many wrong guesses so it cannot be brute-forced
    const attempts = Number(storedOtp.attempts || 0) + 1;
    const exhausted = attempts >= MAX_VERIFY_ATTEMPTS;
    await query(`UPDATE email_otps SET attempts = $1, is_used = $2 WHERE id = $3`, [attempts, exhausted, storedOtp.id]);
    if (exhausted) {
      return { success: false, message: 'Too many incorrect attempts. Please request a new code.' };
    }
    return { success: false, message: 'Invalid verification code. Please check and try again.' };
  }

  // Mark OTP as used
  await query(`UPDATE email_otps SET is_used = TRUE WHERE id = $1`, [storedOtp.id]);

  // Mark user's email as verified
  await query(
    `UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE email = $1`,
    [normalizedEmail]
  );

  return { success: true, message: 'Email verified successfully!' };
}
