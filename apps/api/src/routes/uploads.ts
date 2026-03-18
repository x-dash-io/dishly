import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import type { CloudflareEnv } from '../types/env';
import { getR2Client, generateR2Key, getPresignedUploadUrl } from '../lib/r2';

export const uploadRoutes = new Hono<{ Bindings: CloudflareEnv }>()
  /**
   * POST /presign
   * Generates a pre-signed URL for direct-to-R2 upload.
   * Auth is required (assumed handled by parent mount or middleware).
   */
  .post(
    '/presign',
    zValidator(
      'json',
      z.object({
        purpose: z.enum(['cover', 'hero', 'step', 'avatar', 'ai-input']),
        contentType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
        fileSizeBytes: z.number().max(20_000_000, 'File size must be less than 20MB'),
      })
    ),
    async (c) => {
      const { purpose, contentType, fileSizeBytes } = c.req.valid('json');
      // clerkId is set by verifyClerkToken middleware
      const userId = (c.get('clerkId') ?? 'anonymous') as string;

      // Map content type to extension
      const extMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/heic': 'heic',
      };
      const ext = extMap[contentType] || 'jpg';

      const client = getR2Client(c.env);
      const key = generateR2Key(userId, purpose, ext);

      try {
        const { uploadUrl, publicUrl } = await getPresignedUploadUrl(
          client,
          c.env,
          key,
          contentType
        );

        return c.json({
          uploadUrl,
          publicUrl,
          key,
          expiresIn: 300,
        });
      } catch (error) {
        console.error('Failed to generate pre-signed URL', error);
        return c.json({ error: 'Failed to generate upload URL' }, 500);
      }
    }
  );
