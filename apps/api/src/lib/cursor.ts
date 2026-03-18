// Encode a cursor from the last item in a page
export function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ t: createdAt.toISOString(), id }))
    .toString('base64url');
}

// Decode a cursor string back to { createdAt, id }
export function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const { t, id } = JSON.parse(Buffer.from(cursor, 'base64url').toString());
    return { createdAt: new Date(t), id };
  } catch {
    return null;
  }
}
