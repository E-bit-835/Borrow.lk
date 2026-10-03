import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/authController';
import { requireAuth, optionalAuth, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { sendEmailOtp, verifyEmailOtp } from '../services/otpService';
import { CapabilityService } from '../services/capabilityService';
import type { AuthRequest } from '../middleware/auth';
import type { Response, NextFunction } from 'express';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
  // No role here: every sign-up is a normal account (unknown keys such as "role" are stripped)
  district: z.string().optional(),
  city: z.string().optional(),
  businessName: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const createAdminSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().min(4, 'OTP is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(255).optional(),
  firstName: z.string().trim().max(120).optional(),
  lastName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(50).optional(),
  district: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  address: z.string().trim().max(500).optional(),
  businessName: z.string().trim().max(255).optional(),
  avatar: z.string().trim().max(2000).regex(/^https?:\/\//i, 'Profile photo must be an http(s) image link').optional(),
  dob: z.string().trim().max(50).optional(),
});

const sendOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const verifyOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  otp: z.string().trim().min(4, 'OTP is required').max(10),
});

router.post('/register', validate(registerSchema), AuthController.register);
router.post('/login', validate(loginSchema), AuthController.login);
router.get('/me', requireAuth, AuthController.getMe);
router.put('/profile', requireAuth, validate(updateProfileSchema), AuthController.updateProfile);

router.post(
  '/create-admin',
  requireAuth,
  requireRole('admin'),
  validate(createAdminSchema),
  AuthController.createAdmin
);

router.post('/forgot-password', validate(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), AuthController.resetPassword);

// Become a Host / Become a Provider: adds a capability to the signed-in account
const partnerBaseSchema = {
  phone: z.string().trim().min(8, 'A valid phone number is required').max(50),
  district: z.string().trim().min(2, 'District is required').max(100),
  city: z.string().trim().min(2, 'City is required').max(100),
  businessName: z.string().trim().max(255).optional(),
  nicNumber: z.string().trim().max(50).optional(),
  acceptTerms: z.literal(true, 'You must accept the platform terms'),
};

const becomeHostSchema = z.object({
  ...partnerBaseSchema,
  hostType: z.enum(['individual', 'business']),
  categories: z.array(z.string().trim().min(1).max(60)).min(1, 'Choose at least one category').max(12),
  about: z.string().trim().max(1000).optional(),
});

const becomeProviderSchema = z.object({
  ...partnerBaseSchema,
  serviceCategory: z.string().trim().min(2, 'Service category is required').max(100),
  description: z.string().trim().min(10, 'Describe your service (at least 10 characters)').max(1000),
  experience: z.string().trim().max(500).optional(),
});

router.post('/become-host', requireAuth, validate(becomeHostSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone, district, city, businessName, acceptTerms: _terms, ...details } = req.body;
    const user = await CapabilityService.apply(req.user!.id, 'HOST', { phone, district, city, businessName, details });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

router.post('/become-provider', requireAuth, validate(becomeProviderSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { phone, district, city, businessName, acceptTerms: _terms, ...details } = req.body;
    const user = await CapabilityService.apply(req.user!.id, 'PROVIDER', { phone, district, city, businessName, details });
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
});

// Email OTP Verification
router.post('/send-otp', optionalAuth, validate(sendOtpSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const result = await sendEmailOtp(email, req.user?.name);
    if (!result.success) {
      return res.status(429).json({ success: false, error: { code: 'OTP_SEND_FAILED', message: result.message } });
    }
    res.json({ success: true, data: { message: result.message } });
  } catch (error) {
    next(error);
  }
});

router.post('/verify-otp', optionalAuth, validate(verifyOtpSchema), async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    const result = await verifyEmailOtp(email, otp);
    if (!result.success) {
      return res.status(400).json({ success: false, error: { code: 'OTP_INVALID', message: result.message } });
    }
    res.json({ success: true, data: { message: result.message, emailVerified: true } });
  } catch (error) {
    next(error);
  }
});

export default router;
