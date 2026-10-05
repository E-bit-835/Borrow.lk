import dotenv from 'dotenv';
import path from 'path';

// Load .env and .env.local
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), override: false });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  databaseUrlUnpooled: process.env.DATABASE_URL_UNPOOLED || '',
  neonBranch: process.env.NEON_BRANCH || 'production',
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'borrowlk-dev-only-secret'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174')
    .split(',')
    // Render sets RENDER_EXTERNAL_URL to the service's own address, so the site may call its own API
    .concat(process.env.RENDER_EXTERNAL_URL || [])
    .map(origin => origin.trim()),
  // When true, "Become a Host / Provider" applications wait for admin approval instead of being approved instantly
  requirePartnerApproval: process.env.REQUIRE_PARTNER_APPROVAL === 'true',
  openSourceAi: {
    provider: process.env.OPEN_SOURCE_AI_PROVIDER || 'open_source_pipeline',
    model: process.env.OPEN_SOURCE_AI_MODEL || 'meta-llama/Llama-3.2-3B-Instruct',
    huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY || '',
  },
  customMl: {
    modelName: process.env.CUSTOM_ML_MODEL_NAME || 'BorrowLK-RentalIntelligence-Ensemble',
    modelVersion: process.env.CUSTOM_ML_MODEL_VERSION || 'v2.4.1',
  },
  // AI assistant: any OpenAI-compatible chat API. With no AI_* settings it uses the Gemini key through
  // Google's OpenAI-compatible endpoint; set AI_BASE_URL / AI_API_KEY / AI_MODEL to use Groq, OpenRouter or Ollama.
  ai: {
    baseUrl:
      process.env.AI_BASE_URL ||
      (process.env.GEMINI_API_KEY ? 'https://generativelanguage.googleapis.com/v1beta/openai' : ''),
    apiKey: process.env.AI_API_KEY || (process.env.AI_BASE_URL ? '' : process.env.GEMINI_API_KEY || ''),
    model: process.env.AI_MODEL || (process.env.AI_BASE_URL ? 'llama-3.3-70b-versatile' : process.env.GEMINI_MODEL || 'gemini-3.8-flash'),
  },
  // Card payments for subscription plans (PayHere). Off until the merchant id and secret are set.
  payhere: {
    merchantId: process.env.PAYHERE_MERCHANT_ID || '',
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET || '',
    sandbox: process.env.PAYHERE_SANDBOX !== 'false',
  },
  // Public address of the site, used in links that outside services call back (Render sets RENDER_EXTERNAL_URL)
  publicUrl: (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, ''),
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'BorrowLK',
    fromEmail: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || '',
  },
};

if (!config.databaseUrl) {
  console.warn('⚠️ WARNING: DATABASE_URL is not set in environment. Please check your .env file.');
}

if (!process.env.JWT_SECRET) {
  if (config.nodeEnv === 'production') {
    throw new Error('JWT_SECRET must be set in production.');
  }
  console.warn('⚠️ WARNING: JWT_SECRET is not set. Using a development-only fallback.');
}
