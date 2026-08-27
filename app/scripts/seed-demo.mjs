import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql = neon(process.env.DATABASE_URL);

const authorities = [
  ['Ministry of Jal Shakti', 'ministry', 'national', 'jalshakti@example.gov.in', null, 'https://jalshakti-dowr.gov.in/'],
  ['Ministry of Road Transport and Highways', 'ministry', 'national', 'roads@example.gov.in', null, 'https://morth.nic.in/'],
  ['Ministry of Power', 'ministry', 'national', 'power@example.gov.in', null, 'https://powermin.gov.in/'],
  ['New Delhi Municipal Council', 'municipality', 'municipal', 'contact@ndmc.gov.in', '011-2336-4010', 'https://ndmc.gov.in/'],
  ['Greater Hyderabad Municipal Corporation', 'municipality', 'municipal', 'contact@ghmc.gov.in', '040-2322-5353', 'https://www.ghmc.gov.in/'],
  ['Pune Municipal Corporation', 'municipality', 'municipal', 'contact@pmc.gov.in', '020-2550-1000', 'https://pmc.gov.in/'],
  ['Bengaluru City Corporation', 'municipality', 'municipal', 'contact@bcc.gov.in', '080-2297-5800', 'https://bbmp.gov.in/'],
  ['Chennai Corporation', 'municipality', 'municipal', 'contact@chennaicorporation.gov.in', '044-2561-9200', 'https://chennaicorporation.gov.in/'],
];

const reps = [
  ['Sushma A.', 'minister', 'Minister of Jal Shakti', 1],
  ['Arun K.', 'minister', 'Minister of Road Transport', 2],
  ['Meera P.', 'minister', 'Minister of Power', 3],
  ['Rohan D.', 'mp', 'New Delhi', 4],
  ['Aisha M.', 'mp', 'Hyderabad', 5],
  ['Vikram S.', 'mp', 'Pune', 6],
  ['Nandita R.', 'mla', 'Delhi Assembly', 4],
  ['Pranav T.', 'mla', 'Telangana Assembly', 5],
  ['Leena J.', 'mla', 'Karnataka Assembly', 7],
  ['Madhav K.', 'mla', 'Tamil Nadu Assembly', 8],
  ['City Commissioner NDMC', 'responsible_officer', 'New Delhi', 4],
  ['City Commissioner GHMC', 'responsible_officer', 'Hyderabad', 5],
];

const categories = ['water', 'roads', 'power', 'health', 'housing', 'other'];
const pins = ['110001', '110002', '110003', '110004', '500001', '500002', '411001', '411002', '560001', '560002', '600001', '600002'];
const titles = {
  water: ['Low water pressure', 'Drain overflow', 'Contaminated supply', 'No tanker delivery'],
  roads: ['Broken road surface', 'Pothole cluster', 'Signal outage', 'Blocked drain on road'],
  power: ['Streetlight out', 'Power outage', 'Transformer fault', 'Loose wiring'],
  health: ['Clinic queue issues', 'Medicine stockout', 'Ambulance delay', 'Facility cleanliness'],
  housing: ['Unauthorized encroachment', 'Permit delay', 'Garbage in lane', 'Drain cover missing'],
  other: ['Local service delay', 'Garbage pickup delay', 'Park maintenance issue', 'Public toilet issue'],
};

function rand(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

async function ensureAuthorities() {
  for (const [name, authority_type, jurisdiction_level, contact_email, contact_phone, public_url] of authorities) {
    await sql`
      INSERT INTO authorities (name, authority_type, jurisdiction_level, contact_email, contact_phone, public_url)
      VALUES (${name}, ${authority_type}, ${jurisdiction_level}, ${contact_email}, ${contact_phone}, ${public_url})
      ON CONFLICT DO NOTHING`;
  }
}

async function ensureRepresentatives() {
  for (const [full_name, role, constituency, authorityIndex] of reps) {
    const authorityName = authorities[authorityIndex - 1][0];
    await sql`
      INSERT INTO representatives (full_name, role, constituency_or_jurisdiction, official_email, official_phone, office_address, authority_id, active)
      SELECT ${full_name}, ${role}, ${constituency}, lower(replace(${full_name}, ' ', '.')) || '@example.gov.in', NULL, ${constituency}, a.id, true
      FROM authorities a
      WHERE a.name = ${authorityName}
      ON CONFLICT DO NOTHING`;
  }
}

async function seedComplaints() {
  const authorityRows = await sql`SELECT id, name, authority_type FROM authorities ORDER BY name`;
  const complaintRows = [];
  for (let i = 0; i < 200; i += 1) {
    const category = categories[i % categories.length];
    const pin = pins[i % pins.length];
    const authority =
      category === 'water'
        ? authorityRows.find(row => row.name === 'Ministry of Jal Shakti') ?? authorityRows[0]
        : category === 'roads'
          ? authorityRows.find(row => row.name === 'Ministry of Road Transport and Highways') ?? authorityRows[0]
          : category === 'power'
            ? authorityRows.find(row => row.name === 'Ministry of Power') ?? authorityRows[0]
            : authorityRows[(i % authorityRows.length)];
    const title = rand(titles[category]);
    const publicId = `JAN-${String(100000 + i).slice(-6)}`;
    const email = `citizen${(i % 32) + 1}@example.com`;
    const submitted = new Date(Date.now() - (i % 140) * 86400000).toISOString();
    const status = i % 7 === 0 ? 'disputed' : i % 5 === 0 ? 'resolved_by_authority' : i % 3 === 0 ? 'in_progress' : 'submitted';
    const resolvedAt = status === 'resolved_by_authority' || status === 'disputed' ? new Date(Date.now() - (i % 60) * 86400000).toISOString() : null;
    const closedAt = status === 'disputed' ? null : resolvedAt;
    const reporterToken = `token-${publicId}`;
    const complaint = await sql`
      INSERT INTO complaints (
        public_id, reporter_access_hash, reporter_email, title, description, category_id, pin_code,
        latitude, longitude, location_precision_m, public_geohash, contact_phone, assigned_authority_id,
        status, sla_due_at, submitted_at, resolved_at, closed_at
      )
      VALUES (
        ${publicId}, ${hashToken(reporterToken)}, ${email}, ${title}, ${`Demo issue ${i + 1} created for showcase across JanSahay.`}, ${category}, ${pin},
        ${28 + (i % 50) / 1000}, ${77 + (i % 50) / 1000}, 25, ${`gh${String(i % 30).padStart(2, '0')}`}, ${null},
        ${authority.id}, ${status}, ${new Date(Date.now() + ((i % 12) + 3) * 86400000).toISOString()}, ${submitted}, ${resolvedAt}, ${closedAt}
      )
      RETURNING id`;
    complaintRows.push({ id: complaint[0].id, publicId, status });
  }

  for (const row of complaintRows.slice(0, 140)) {
    await sql`INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata) VALUES (${row.id}, 'submitted', 'reporter', 'Complaint submitted by citizen.', '{}'::jsonb)`;
    await sql`INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata) VALUES (${row.id}, 'routed', 'system', 'Automatically routed to the assigned authority.', '{}'::jsonb)`;
    if (row.status !== 'submitted') {
      await sql`INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata) VALUES (${row.id}, 'authority_marked_resolved', 'responsible_officer', 'Resolution marked by the responsible department.', '{}'::jsonb)`;
    }
    if (row.status === 'disputed') {
      await sql`INSERT INTO disputes (complaint_id, reason, status, opened_at) VALUES (${row.id}, 'The reported fix was incomplete or the issue still persists.', 'open', now()) ON CONFLICT (complaint_id) DO NOTHING`;
      await sql`INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata) VALUES (${row.id}, 'reporter_disputed', 'reporter', 'Reporter disputed the fix.', '{}'::jsonb)`;
    }
  }
}

await ensureAuthorities();
await ensureRepresentatives();
await seedComplaints();
console.log('Demo data seeded.');
