import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
const noStore = { 'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0' };
type Vote = 'up' | 'down' | null;

export async function POST(request: NextRequest, { params }: { params: Promise<{ publicId: string }> }) {
  if (!hasDatabase()) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503, headers: noStore });
  const { publicId } = await params;
  const body = await request.json();
  const vote: Vote = body.vote === 'up' || body.vote === 'down' ? body.vote : null;
  const previous: Vote = body.previous === 'up' || body.previous === 'down' ? body.previous : null;
  if (body.vote !== null && body.vote !== 'up' && body.vote !== 'down') {
    return NextResponse.json({ error: 'Unsupported vote.' }, { status: 422, headers: noStore });
  }

  const upDelta = (vote === 'up' ? 1 : 0) - (previous === 'up' ? 1 : 0);
  const downDelta = (vote === 'down' ? 1 : 0) - (previous === 'down' ? 1 : 0);
  const rows = await sql`
    UPDATE complaints
    SET upvotes=GREATEST(0,upvotes+${upDelta}),downvotes=GREATEST(0,downvotes+${downDelta})
    WHERE public_id=${publicId}
    RETURNING upvotes,downvotes`;
  if (!rows[0]) return NextResponse.json({ error: 'Complaint not found.' }, { status: 404, headers: noStore });
  return NextResponse.json({ upvotes:Number(rows[0].upvotes),downvotes:Number(rows[0].downvotes),vote }, { headers: noStore });
}
