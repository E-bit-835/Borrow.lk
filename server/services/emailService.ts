import nodemailer from 'nodemailer';
import { config } from '../config/env';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: false, // true for 465, false for 587 (STARTTLS)
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

/**
 * Send an email OTP verification code
 */
export async function sendOtpEmail(toEmail: string, otpCode: string, userName?: string): Promise<boolean> {
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('⚠️ SMTP not configured. OTP code for', toEmail, 'is:', otpCode);
    return true; // Allow dev flow to continue
  }

  const mailOptions = {
    from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
    to: toEmail,
    subject: `${otpCode} is your BorrowLK verification code`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #001A48; font-size: 24px; margin: 0;">Borrow<span style="color: #14b8a6;">.lk</span></h1>
        </div>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Hi${userName ? ` ${userName}` : ''},
        </p>
        
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">
          Your verification code is:
        </p>
        
        <div style="text-align: center; margin: 24px 0;">
          <div style="display: inline-block; background: #f1f5f9; border: 2px solid #e2e8f0; border-radius: 12px; padding: 16px 32px;">
            <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #001A48;">${otpCode}</span>
          </div>
        </div>
        
        <p style="color: #64748b; font-size: 13px; line-height: 1.6;">
          This code will expire in <strong>10 minutes</strong>. Do not share this code with anyone.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        
        <p style="color: #94a3b8; font-size: 11px; text-align: center;">
          If you didn't request this code, you can safely ignore this email.<br/>
          &copy; ${new Date().getFullYear()} BorrowLK — Sri Lanka's Rental Marketplace
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent to ${toEmail}`);
    return true;
  } catch (error: any) {
    console.error('❌ Failed to send OTP email:', error.message);
    return false;
  }
}

/**
 * Verify SMTP connection is working
 */
export async function verifySmtpConnection(): Promise<boolean> {
  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('⚠️ SMTP credentials not set. Email OTP will log codes to console in dev mode.');
    return false;
  }

  try {
    await transporter.verify();
    console.log('✅ Gmail SMTP connection verified');
    return true;
  } catch (error: any) {
    console.error('❌ Gmail SMTP connection failed:', error.message);
    return false;
  }
}
