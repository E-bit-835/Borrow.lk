import { query } from '../config/db';

type NotificationType = 'bookings' | 'messages' | 'system';

/**
 * Stores an in-app notification for a user. Never throws: a failed notification
 * must not break the action (request, message, approval) that triggered it.
 */
export async function notify(
  userId: string | null | undefined,
  type: NotificationType,
  title: string,
  description: string,
  actionUrl?: string
) {
  if (!userId) return;
  try {
    await query(
      `INSERT INTO notifications (user_id, type, title, description, action_url) VALUES ($1, $2, $3, $4, $5)`,
      [userId, type, title, description, actionUrl || null]
    );
  } catch (err: any) {
    console.warn('⚠️ Could not store notification:', err.message);
  }
}
