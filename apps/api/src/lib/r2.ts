import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { CloudflareEnv } from '../types/env';

/**
 * Dishly R2 Integration Helper
 * Uses S3-compatible API for Cloudflare R2
 */

export function getR2Client(env: CloudflareEnv) {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

/**
 * Generate a consistent R2 key for storage
 * Format: uploads/{userId}/{purpose}/{uuid}.{ext}
 */
export function generateR2Key(
  userId: string,
  purpose: 'cover' | 'hero' | 'step' | 'avatar' | 'ai-input',
  ext: string
): string {
  const uuid = crypto.randomUUID();
  const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
  return `uploads/${userId}/${purpose}/${uuid}.${cleanExt}`;
}

/**
 * Get a pre-signed PUT URL for direct-to-R2 upload from client
 * Valid for 5 minutes (300 seconds)
 */
export async function getPresignedUploadUrl(
  client: S3Client,
  env: CloudflareEnv,
  key: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  // Generate the pre-signed URL (expires in 300 seconds)
  const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });

  // Public URL format: https://<R2_BUCKET_NAME>.<R2_ACCOUNT_ID>.r2.dev/<key>
  const publicUrl = `https://${env.R2_BUCKET_NAME}.${env.R2_ACCOUNT_ID}.r2.dev/${key}`;

  return { uploadUrl, publicUrl };
}

/**
 * Delete an object from R2
 */
export async function deleteR2Object(
  client: S3Client,
  env: CloudflareEnv,
  key: string
): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  await client.send(command).catch((err: unknown) => {
    console.error(`Failed to delete R2 object: ${key}`, err);
    throw err;
  });
}
