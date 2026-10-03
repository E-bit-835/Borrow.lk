import { Router } from 'express';
import type { Response, NextFunction } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { ChatService } from '../services/chatService';

const router = Router();

// The assistant uses a metered AI provider, so each account gets a fair share
const LIMIT = 30;
const WINDOW_MS = 60 * 60 * 1000;
const usage = new Map<string, number[]>();

function rateLimit(req: AuthRequest, res: Response, next: NextFunction) {
  const now = Date.now();
  const recent = (usage.get(req.user!.id) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= LIMIT) {
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'You have reached the hourly limit for the assistant. Please try again later.' },
    });
  }
  recent.push(now);
  usage.set(req.user!.id, recent);
  next();
}

const chatSchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(20)
    .refine((m) => m[m.length - 1].role === 'user', 'The last message must be from the user'),
  location: z.string().trim().max(100).optional(),
});

router.post('/chat', requireAuth, validate(chatSchema), rateLimit, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const result = await ChatService.reply(req.body.messages, req.body.location);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
