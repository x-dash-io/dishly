import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import type { CloudflareEnv } from '../types/env';

export function getGemini(env: CloudflareEnv) {
  return new GoogleGenerativeAI(env.GEMINI_API_KEY);
}

// Use this model for all calls
export const GEMINI_MODEL = 'gemini-2.5-flash';

// Helper: convert an R2 public URL to a Gemini inline image part
export async function urlToImagePart(imageUrl: string): Promise<{
  inlineData: { data: string; mimeType: string }
}> {
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  
  let base64 = '';
  if (typeof Buffer !== 'undefined') {
    base64 = Buffer.from(buffer).toString('base64');
  } else {
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      base64 += String.fromCharCode(bytes[i]);
    }
    base64 = btoa(base64);
  }
  
  const mimeType = response.headers.get('content-type') ?? 'image/jpeg';
  return { inlineData: { data: base64, mimeType } };
}
