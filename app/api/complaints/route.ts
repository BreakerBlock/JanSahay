import { NextRequest, NextResponse } from 'next/server';
import { hasDatabase, sql } from '@/lib/db';
import { hashToken, publicId, reporterToken, toPublicGeohash } from '@/lib/ids';
import { grievanceCategoryIds } from '@/lib/grievance-categories';
import { findRoutingDecision } from '@/lib/routing';

type Attachment = { url: string; pathname: string; contentType: string; size: number; filename: string };

export async function POST(request: NextRequest) {
  if (!hasDatabase()) return NextResponse.json({ error: 'Database is not connected.' }, { status: 503 });
  const body = await request.json();
  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const pin = String(body.pin || '');
  const category = String(body.category || 'other');
  const email = String(body.email || 'demo@jansahay.local').trim().toLowerCase();
  if (title.length < 5 || title.length > 180 || description.length < 20 || description.length > 5000 || !/^\d{6}$/.test(pin) || !grievanceCategoryIds.has(category) || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: 'Please provide a valid title, description, category, PIN code and email address.' }, { status: 422 });
  const latitude = body.latitude === '' || body.latitude == null ? null : Number(body.latitude);
  const longitude = body.longitude === '' || body.longitude == null ? null : Number(body.longitude);
  if ((latitude !== null || longitude !== null) && (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude! < -90 || latitude! > 90 || longitude! < -180 || longitude! > 180)) return NextResponse.json({ error: 'Location coordinates are invalid.' }, { status: 422 });
  const route = await findRoutingDecision(category, pin);
  const token = reporterToken(); const id = publicId(); const due = new Date(Date.now() + route.defaultSlaDays * 86400000);
  const rows = await sql`INSERT INTO complaints (public_id,reporter_access_hash,reporter_email,title,description,category_id,pin_code,latitude,longitude,location_precision_m,public_geohash,contact_phone,assigned_authority_id,status,sla_due_at) VALUES (${id},${hashToken(token)},${email},${title},${description},${category},${pin},${latitude},${longitude},${latitude === null ? null : 25},${toPublicGeohash(latitude ?? undefined,longitude ?? undefined)},${body.contact ? String(body.contact).slice(0,32) : null},${route.id},'submitted',${due.toISOString()}) RETURNING id,public_id,status,sla_due_at`;
  const complaint = rows[0];
  await sql`INSERT INTO complaint_events (complaint_id,event_type,actor_role,public_note,metadata) VALUES (${complaint.id},'submitted','reporter','Complaint submitted by citizen.',${JSON.stringify({ category, aadhaarVerifiedDemo: body.aadhaarVerifiedDemo === true })}::jsonb),(${complaint.id},'routed','system',${`Provisionally auto-routed to ${route.name} using the issue type and PIN code.`},${JSON.stringify({ authority: route.name, basis: route.basis, routingVersion: 'provisional-v1' })}::jsonb)`;
  for (const item of (Array.isArray(body.attachments) ? body.attachments : []) as Attachment[]) {
    if (typeof item.url !== 'string' || typeof item.pathname !== 'string' || !item.url.includes('blob.vercel-storage.com')) continue;
    await sql`INSERT INTO attachments (complaint_id,blob_url,blob_pathname,content_type,byte_size,original_filename,visibility) VALUES (${complaint.id},${item.url},${item.pathname},${String(item.contentType).slice(0,100)},${Number(item.size) || 1},${String(item.filename).slice(0,180)},'private')`;
    await sql`INSERT INTO complaint_events (complaint_id,event_type,actor_role,public_note) VALUES (${complaint.id},'evidence_added','reporter','Supporting evidence added.')`;
  }
  return NextResponse.json({ publicId: complaint.public_id, reporterToken: token, status: complaint.status, assignedAuthority: route.name, routingBasis: route.basis, slaDueAt: complaint.sla_due_at }, { status: 201 });
}
