import { eq } from 'drizzle-orm';
import { users } from '@dishly/db';
import type { Db } from '@dishly/db';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
}

/**
 * Send a single push notification to an Expo push token.
 * Fire-and-forget safe — never throws. Push failures never affect the caller.
 */
export async function sendPushNotification(message: PushMessage): Promise<void> {
  try {
    await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(message),
    });
  } catch {
    // Silently swallow — a push failure is never worth crashing a request
  }
}

/**
 * Look up a user's push token and send them a notification.
 * No-ops silently if the user has no token.
 */
export async function sendPushToUser(
  db: Db,
  userId: string,
  message: Omit<PushMessage, 'to'>
): Promise<void> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { pushToken: true },
  });
  if (!user?.pushToken) return;
  await sendPushNotification({ ...message, to: user.pushToken });
}
