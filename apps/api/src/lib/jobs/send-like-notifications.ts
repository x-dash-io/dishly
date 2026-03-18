import { and, eq, lt } from 'drizzle-orm';
import { notificationBatches, recipes } from '@dishly/db';
import type { Db } from '@dishly/db';
import { sendPushToUser } from '../notifications';

/**
 * Sends batched like notifications for all unsent batches older than 5 minutes.
 * Called by the Cloudflare Cron Trigger every 5 minutes.
 */
export async function sendLikeNotifications(db: Db): Promise<void> {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const batches = await db
    .select()
    .from(notificationBatches)
    .where(
      and(
        eq(notificationBatches.sent, false),
        eq(notificationBatches.type, 'likes'),
        lt(notificationBatches.updatedAt, fiveMinutesAgo)
      )
    );

  for (const batch of batches) {
    const recipe = await db.query.recipes.findFirst({
      where: eq(recipes.id, batch.recipeId),
      columns: { title: true },
    });

    const body =
      batch.count === 1
        ? `${batch.lastActorName} liked your recipe`
        : `${batch.lastActorName} and ${batch.count - 1} other${batch.count - 1 === 1 ? '' : 's'} liked ${recipe?.title ?? 'your recipe'}`;

    await sendPushToUser(db, batch.userId, {
      title: 'New likes on your recipe',
      body,
      data: { type: 'like', recipeId: batch.recipeId },
    });

    await db
      .update(notificationBatches)
      .set({ sent: true })
      .where(eq(notificationBatches.id, batch.id));
  }
}
