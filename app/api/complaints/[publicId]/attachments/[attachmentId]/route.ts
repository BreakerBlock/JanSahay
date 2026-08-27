import { get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
import { hashToken } from '@/lib/ids';

export async function GET(request: NextRequest, { params }: { params: Promise<{ publicId: string; attachmentId: string }> }) {
  if (!hasDatabase()) return new NextResponse('Database is not connected.', { status: 503 });
  const { publicId, attachmentId } = await params;
  const rows = await sql`SELECT a.blob_pathname,a.content_type,c.reporter_access_hash FROM attachments a JOIN complaints c ON c.id=a.complaint_id WHERE a.id=${attachmentId} AND c.public_id=${publicId} LIMIT 1`;
  const attachment = rows[0];
  if (!attachment) return new NextResponse('Not found', { status: 404 });
  const reporterAllowed = request.headers.get('x-reporter-token') && hashToken(request.headers.get('x-reporter-token')!) === attachment.reporter_access_hash;
  const responderAllowed = process.env.RESPONDER_PORTAL_KEY && request.headers.get('x-responder-key') === process.env.RESPONDER_PORTAL_KEY;
  if (!reporterAllowed && !responderAllowed) return new NextResponse('Forbidden', { status: 403 });
  const result = await get(attachment.blob_pathname, { access: 'private', ifNoneMatch: request.headers.get('if-none-match') || undefined });
  if (!result) return new NextResponse('Not found', { status: 404 });
  if (result.statusCode === 304) return new NextResponse(null, { status: 304, headers: { ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } });
  return new NextResponse(result.stream, { headers: { 'Content-Type': attachment.content_type, 'X-Content-Type-Options': 'nosniff', ETag: result.blob.etag, 'Cache-Control': 'private, no-cache' } });
}
