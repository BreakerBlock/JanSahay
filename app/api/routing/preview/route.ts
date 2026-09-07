import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase } from '@/lib/db';
import { grievanceCategoryIds } from '@/lib/grievance-categories';
import { findRoutingDecision } from '@/lib/routing';

export async function GET(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });
  const params = new URL(request.url).searchParams;
  const category = params.get('category') || '';
  const pin = params.get('pin') || '';
  if (!grievanceCategoryIds.has(category) || !/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: 'A valid category and 6-digit PIN code are required.' }, { status: 422 });
  }
  const decision = await findRoutingDecision(category, pin);
  return NextResponse.json({ ...decision, provisional: true });
}
