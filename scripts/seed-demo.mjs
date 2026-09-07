import { createHash } from 'node:crypto';
import { neon } from '@neondatabase/serverless';

const databaseUrl = (
  process.env.DATABASE_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING ||
  ''
).trim().replace(/^=/, '');

if (!/^postgres(?:ql)?:\/\//.test(databaseUrl)) {
  throw new Error('A valid DATABASE_URL or POSTGRES_URL is required. It must begin with postgresql://');
}

const sql = neon(databaseUrl);
const DAY = 86_400_000;
const HOUR = 3_600_000;
const requestedCount = Number(process.env.DEMO_COMPLAINT_COUNT || 6000);
const complaintCount = Math.min(10_000, Math.max(100, Number.isFinite(requestedCount) ? Math.floor(requestedCount) : 6000));

const categoryDefinitions = [
  { id: 'water', name: 'Water & sanitation', sla: 7, weight: 11 },
  { id: 'roads', name: 'Roads & public transport', sla: 10, weight: 12 },
  { id: 'power', name: 'Power & street lighting', sla: 3, weight: 9 },
  { id: 'health', name: 'Health services', sla: 7, weight: 8 },
  { id: 'housing', name: 'Housing & urban services', sla: 14, weight: 7 },
  { id: 'waste', name: 'Waste collection & cleanliness', sla: 3, weight: 8 },
  { id: 'pensions', name: 'Pensions', sla: 21, weight: 7 },
  { id: 'epfo_labour', name: 'EPFO & labour', sla: 21, weight: 8 },
  { id: 'banking', name: 'Banking & financial services', sla: 21, weight: 8 },
  { id: 'railways', name: 'Railways', sla: 14, weight: 7 },
  { id: 'telecom', name: 'Telecom & mobile services', sla: 14, weight: 7 },
  { id: 'education', name: 'Education & scholarships', sla: 21, weight: 6 },
  { id: 'police_home', name: 'Police, safety & home affairs', sla: 14, weight: 5 },
  { id: 'land_revenue', name: 'Land, property & revenue', sla: 21, weight: 7 },
  { id: 'food_distribution', name: 'Ration & food distribution', sla: 7, weight: 6 },
  { id: 'social_welfare', name: 'Social welfare & benefits', sla: 21, weight: 6 },
  { id: 'vehicle_services', name: 'Driving licence & vehicle services', sla: 14, weight: 5 },
  { id: 'environment', name: 'Environment & pollution', sla: 14, weight: 5 },
  { id: 'postal', name: 'Postal services', sla: 14, weight: 4 },
  { id: 'digital_services', name: 'Government portals & digital services', sla: 10, weight: 6 },
  { id: 'taxation', name: 'Taxation & public revenue', sla: 21, weight: 4 },
  { id: 'agriculture', name: 'Agriculture & farmer services', sla: 14, weight: 5 },
  { id: 'consumer', name: 'Consumer affairs', sla: 21, weight: 4 },
  { id: 'aadhaar_identity', name: 'Aadhaar & identity services', sla: 21, weight: 5 },
  { id: 'other', name: 'Other public service', sla: 14, weight: 4 },
];

const locations = [
  { city: 'Delhi', pin: '110001', latitude: 28.6139, longitude: 77.2090, municipality: 'New Delhi Municipal Council' },
  { city: 'Chandigarh', pin: '160017', latitude: 30.7333, longitude: 76.7794, municipality: 'Municipal Corporation Chandigarh' },
  { city: 'Gurugram', pin: '122001', latitude: 28.4595, longitude: 77.0266, municipality: 'Municipal Corporation Gurugram' },
  { city: 'Lucknow', pin: '226001', latitude: 26.8467, longitude: 80.9462, municipality: 'Lucknow Municipal Corporation' },
  { city: 'Jaipur', pin: '302001', latitude: 26.9124, longitude: 75.7873, municipality: 'Jaipur Municipal Corporation' },
  { city: 'Ahmedabad', pin: '380001', latitude: 23.0225, longitude: 72.5714, municipality: 'Ahmedabad Municipal Corporation' },
  { city: 'Surat', pin: '395003', latitude: 21.1702, longitude: 72.8311, municipality: 'Surat Municipal Corporation' },
  { city: 'Mumbai', pin: '400001', latitude: 19.0760, longitude: 72.8777, municipality: 'Municipal Corporation of Greater Mumbai' },
  { city: 'Pune', pin: '411001', latitude: 18.5204, longitude: 73.8567, municipality: 'Pune Municipal Corporation' },
  { city: 'Bhopal', pin: '462001', latitude: 23.2599, longitude: 77.4126, municipality: 'Bhopal Municipal Corporation' },
  { city: 'Indore', pin: '452001', latitude: 22.7196, longitude: 75.8577, municipality: 'Indore Municipal Corporation' },
  { city: 'Hyderabad', pin: '500001', latitude: 17.3850, longitude: 78.4867, municipality: 'Greater Hyderabad Municipal Corporation' },
  { city: 'Vijayawada', pin: '520001', latitude: 16.5062, longitude: 80.6480, municipality: 'Vijayawada Municipal Corporation' },
  { city: 'Bengaluru', pin: '560001', latitude: 12.9716, longitude: 77.5946, municipality: 'Bruhat Bengaluru Mahanagara Palike' },
  { city: 'Chennai', pin: '600001', latitude: 13.0827, longitude: 80.2707, municipality: 'Greater Chennai Corporation' },
  { city: 'Kochi', pin: '682001', latitude: 9.9312, longitude: 76.2673, municipality: 'Kochi Municipal Corporation' },
  { city: 'Thiruvananthapuram', pin: '695001', latitude: 8.5241, longitude: 76.9366, municipality: 'Thiruvananthapuram Municipal Corporation' },
  { city: 'Kolkata', pin: '700001', latitude: 22.5726, longitude: 88.3639, municipality: 'Kolkata Municipal Corporation' },
  { city: 'Bhubaneswar', pin: '751001', latitude: 20.2961, longitude: 85.8245, municipality: 'Bhubaneswar Municipal Corporation' },
  { city: 'Guwahati', pin: '781001', latitude: 26.1445, longitude: 91.7362, municipality: 'Guwahati Municipal Corporation' },
  { city: 'Patna', pin: '800001', latitude: 25.5941, longitude: 85.1376, municipality: 'Patna Municipal Corporation' },
  { city: 'Ranchi', pin: '834001', latitude: 23.3441, longitude: 85.3096, municipality: 'Ranchi Municipal Corporation' },
];

const ministries = [
  { name: 'Ministry of Jal Shakti', categories: ['water'], minister: 'Ananya Rao (Demo)' },
  { name: 'Ministry of Road Transport and Highways', categories: ['roads', 'vehicle_services'], minister: 'Dev Malhotra (Demo)' },
  { name: 'Ministry of Power', categories: ['power'], minister: 'Meera Iyer (Demo)' },
  { name: 'Ministry of Housing and Urban Affairs', categories: ['housing', 'waste', 'roads'], minister: 'Kabir Singh (Demo)' },
  { name: 'Ministry of Health and Family Welfare', categories: ['health'], minister: 'Nisha Kulkarni (Demo)' },
  { name: 'Ministry of Rural Development', categories: ['roads', 'housing', 'land_revenue'], minister: 'Arjun Menon (Demo)' },
  { name: 'Ministry of Social Justice and Empowerment', categories: ['social_welfare', 'pensions'], minister: 'Farah Qureshi (Demo)' },
  { name: 'Ministry of Consumer Affairs, Food and Public Distribution', categories: ['consumer', 'food_distribution'], minister: 'Rohan Desai (Demo)' },
  { name: 'Ministry of Railways', categories: ['railways'], minister: 'Kavya Sen (Demo)' },
  { name: 'Ministry of Environment, Forest and Climate Change', categories: ['environment', 'water'], minister: 'Siddharth Bose (Demo)' },
  { name: 'Ministry of Education', categories: ['education'], minister: 'Tara Bhat (Demo)' },
  { name: 'Ministry of Labour and Employment', categories: ['epfo_labour'], minister: 'Vivek Nair (Demo)' },
  { name: 'Ministry of Communications', categories: ['telecom', 'postal'], minister: 'Leela Chatterjee (Demo)' },
  { name: 'Ministry of Home Affairs', categories: ['police_home'], minister: 'Aman Prakash (Demo)' },
  { name: 'Ministry of Finance', categories: ['banking', 'taxation'], minister: 'Jaya Suri (Demo)' },
  { name: 'Ministry of Electronics and Information Technology', categories: ['digital_services', 'aadhaar_identity'], minister: 'Neil Fernandes (Demo)' },
  { name: 'Ministry of Agriculture and Farmers Welfare', categories: ['agriculture'], minister: 'Bhavna Kaur (Demo)' },
  { name: 'Department of Administrative Reforms and Public Grievances', categories: ['other'], minister: 'Ishaan Pillai (Demo)' },
];

const mpDefinitions = [
  ['New Delhi', 'Aarav Khanna (Demo)', 0], ['South Delhi', 'Diya Bansal (Demo)', 0],
  ['Chandigarh', 'Manav Sethi (Demo)', 1], ['Gurugram', 'Ishita Yadav (Demo)', 2],
  ['Lucknow Central', 'Reyansh Tripathi (Demo)', 3], ['Jaipur City', 'Aditi Rathore (Demo)', 4],
  ['Ahmedabad East', 'Dhruv Mehta (Demo)', 5], ['Surat', 'Kiara Shah (Demo)', 6],
  ['Mumbai South', 'Neel Patil (Demo)', 7], ['Mumbai North', 'Sara Dsouza (Demo)', 7],
  ['Pune', 'Advik Kulkarni (Demo)', 8], ['Bhopal', 'Myra Tiwari (Demo)', 9],
  ['Indore', 'Arnav Jain (Demo)', 10], ['Hyderabad', 'Zoya Reddy (Demo)', 11],
  ['Secunderabad', 'Vihaan Naidu (Demo)', 11], ['Bengaluru Central', 'Saanvi Rao (Demo)', 13],
  ['Bengaluru South', 'Kabir Gowda (Demo)', 13], ['Chennai Central', 'Anika Krishnan (Demo)', 14],
  ['Chennai South', 'Ritvik Kumar (Demo)', 14], ['Ernakulam', 'Maya Thomas (Demo)', 15],
  ['Thiruvananthapuram', 'Aditya Nair (Demo)', 16], ['Kolkata North', 'Ira Banerjee (Demo)', 17],
  ['Bhubaneswar', 'Ayaan Das (Demo)', 18], ['Guwahati', 'Naina Bora (Demo)', 19],
  ['Patna Sahib', 'Rudra Sinha (Demo)', 20], ['Ranchi', 'Avni Verma (Demo)', 21],
];

const mlaDefinitions = [
  ['Connaught Place', 'Riya Kapoor (Demo)', 0], ['Saket', 'Arjun Arora (Demo)', 0],
  ['Chandigarh Central', 'Meher Gill (Demo)', 1], ['Gurugram City', 'Nakul Dahiya (Demo)', 2],
  ['Lucknow East', 'Aanya Shukla (Demo)', 3], ['Jaipur Central', 'Veer Chauhan (Demo)', 4],
  ['Jaipur North', 'Navya Joshi (Demo)', 4], ['Ahmedabad Central', 'Prisha Trivedi (Demo)', 5],
  ['Surat East', 'Yuvan Patel (Demo)', 6], ['Colaba', 'Tanya Sawant (Demo)', 7],
  ['Andheri West', 'Krish More (Demo)', 7], ['Pune Cantonment', 'Aisha Deshpande (Demo)', 8],
  ['Bhopal Central', 'Atharv Mishra (Demo)', 9], ['Indore South', 'Samaira Goyal (Demo)', 10],
  ['Nampally', 'Rehaan Ali (Demo)', 11], ['Jubilee Hills', 'Amaira Reddy (Demo)', 11],
  ['Vijayawada Central', 'Darsh Varma (Demo)', 12], ['Shivajinagar', 'Anvi Shetty (Demo)', 13],
  ['Jayanagar', 'Arin Hegde (Demo)', 13], ['Thousand Lights', 'Nila Raman (Demo)', 14],
  ['Mylapore', 'Kavin Subramaniam (Demo)', 14], ['Ernakulam Central', 'Mira Joseph (Demo)', 15],
  ['Kazhakkoottam', 'Nirav Pillai (Demo)', 16], ['Kolkata Central', 'Ishani Ghosh (Demo)', 17],
  ['Salt Lake', 'Abeer Roy (Demo)', 17], ['Bhubaneswar Central', 'Tia Mohanty (Demo)', 18],
  ['Guwahati East', 'Ronav Saikia (Demo)', 19], ['Patna Central', 'Siya Prasad (Demo)', 20],
  ['Ranchi Central', 'Vivaan Ekka (Demo)', 21], ['Kochi Suburban', 'Ahaana Mathew (Demo)', 15],
  ['Chennai Harbour', 'Hari Narayanan (Demo)', 14], ['Hyderabad South', 'Inaya Khan (Demo)', 11],
];

const titles = {
  water: ['Low water pressure', 'Contaminated water supply', 'Drain overflow', 'Pipeline leakage', 'Irregular tanker service', 'Sewer line blockage'],
  roads: ['Potholes on arterial road', 'Broken pedestrian crossing', 'Traffic signal outage', 'Damaged service lane', 'Unsafe road excavation', 'Bus stop access blocked'],
  power: ['Streetlights not working', 'Repeated power outage', 'Unsafe transformer enclosure', 'Incorrect electricity bill', 'Loose overhead wiring', 'Voltage fluctuation'],
  health: ['Medicine stock unavailable', 'Long clinic waiting time', 'Ambulance response delayed', 'Facility sanitation concern', 'Diagnostic service unavailable', 'Vaccination centre overcrowding'],
  housing: ['Building permit delayed', 'Garbage collection missed', 'Encroachment on public land', 'Drain cover missing', 'Public park maintenance pending', 'Construction debris not removed'],
  waste: ['Door-to-door waste pickup missed', 'Garbage pile not cleared', 'Public bin overflowing', 'Street sweeping irregular', 'Waste burning reported', 'Debris dumped on public land'],
  pensions: ['Pension payment delayed', 'Life certificate not updated', 'Pension amount discrepancy', 'Family pension application pending', 'Pension account transfer delayed', 'Arrears not credited'],
  epfo_labour: ['PF claim settlement delayed', 'EPFO transfer pending', 'UAN details mismatch', 'Employer contribution missing', 'Withdrawal claim rejected', 'Labour benefit application stalled'],
  banking: ['Banking service complaint unresolved', 'Benefit payment not credited', 'Account service request delayed', 'NBFC complaint pending', 'Digital transaction dispute unresolved', 'Branch service denial'],
  railways: ['Station facility not maintained', 'Ticket refund delayed', 'Coach cleanliness concern', 'Passenger amenity unavailable', 'Railway service complaint pending', 'Accessibility support unavailable'],
  telecom: ['Mobile network unavailable', 'Broadband outage unresolved', 'Billing dispute pending', 'Number portability delayed', 'Telecom service complaint ignored', 'Internet speed consistently poor'],
  education: ['Scholarship payment delayed', 'School facility repair pending', 'Admission service issue', 'Student record correction delayed', 'Education benefit application pending', 'Certificate not issued'],
  police_home: ['Police complaint acknowledgement pending', 'Citizen service verification delayed', 'Public safety concern unresolved', 'Passport verification delayed', 'Emergency response complaint', 'Licensing application pending'],
  land_revenue: ['Land record mutation delayed', 'Property record correction pending', 'Revenue certificate not issued', 'Survey request delayed', 'Encroachment complaint unresolved', 'Registry service issue'],
  food_distribution: ['Ration entitlement not received', 'Fair price shop service complaint', 'Ration card correction delayed', 'Food allocation discrepancy', 'Biometric authentication failure', 'Distribution schedule not followed'],
  social_welfare: ['Disability benefit delayed', 'Welfare application pending', 'Benefit eligibility error', 'Social assistance payment missing', 'Certificate verification stalled', 'Scheme enrolment rejected'],
  vehicle_services: ['Driving licence renewal delayed', 'Vehicle registration correction pending', 'Permit application stalled', 'Transport office service issue', 'Fitness certificate delayed', 'Online challan dispute unresolved'],
  environment: ['Air pollution complaint pending', 'Industrial discharge reported', 'Tree cutting complaint unresolved', 'Noise pollution complaint', 'Lake contamination reported', 'Construction dust controls missing'],
  postal: ['Registered post delayed', 'Parcel delivery complaint unresolved', 'Post office service issue', 'Money order payment delayed', 'Tracking record not updated', 'Postal savings service delayed'],
  digital_services: ['Government portal not working', 'Application status frozen online', 'OTP service unavailable', 'Digital certificate download failed', 'Portal payment not reflected', 'Online form submission error'],
  taxation: ['Tax refund delayed', 'Payment not reflected', 'Assessment service request pending', 'Public revenue record mismatch', 'Property tax correction delayed', 'Receipt not generated'],
  agriculture: ['Farmer benefit payment delayed', 'Crop insurance claim pending', 'Procurement payment missing', 'Agriculture subsidy application stalled', 'Soil card not issued', 'Mandi service complaint'],
  consumer: ['Consumer complaint unresolved', 'Public distribution quality concern', 'Weights and measures complaint', 'Product service dispute pending', 'Price display violation reported', 'Consumer helpline escalation delayed'],
  aadhaar_identity: ['Aadhaar update request delayed', 'Identity demographic correction pending', 'Authentication service failure', 'Enrolment centre service complaint', 'Identity document delivery delayed', 'Update status not progressing'],
  other: ['Certificate request delayed', 'Pension application pending', 'Public toilet unavailable', 'Local office service delay', 'Benefit enrolment issue', 'Public information request unanswered'],
};

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };
}

const random = mulberry32(20260827);
const integer = (minimum, maximum) => Math.floor(random() * (maximum - minimum + 1)) + minimum;

function chooseWeighted(rows) {
  const total = rows.reduce((sum, row) => sum + row.weight, 0);
  let cursor = random() * total;
  for (const row of rows) {
    cursor -= row.weight;
    if (cursor <= 0) return row;
  }
  return rows.at(-1);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function slug(value) {
  return value.toLowerCase().replace(/\(demo\)/g, '').replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '');
}

const ministryAuthorities = ministries.map((ministry, index) => ({
  name: ministry.name,
  authority_type: 'ministry',
  jurisdiction_level: 'national',
  contact_email: `demo.ministry.${index + 1}@example.invalid`,
  contact_phone: null,
  public_url: 'https://www.india.gov.in/',
  categories: ministry.categories,
  group: 'ministry',
  locationIndex: null,
  weight: 3 + (index % 7),
}));

const municipalityAuthorities = locations.map((location, index) => ({
  name: location.municipality,
  authority_type: 'municipality',
  jurisdiction_level: 'municipal',
  contact_email: `demo.municipality.${index + 1}@example.invalid`,
  contact_phone: null,
  public_url: 'https://www.india.gov.in/',
  categories: categoryDefinitions.map((category) => category.id),
  group: 'municipality',
  locationIndex: index,
  weight: 2 + ((index * 3) % 9),
}));

const mpAuthorities = mpDefinitions.map(([constituency, , locationIndex], index) => ({
  name: `MP Constituency Office — ${constituency} (Demo)`,
  authority_type: 'department',
  jurisdiction_level: 'district',
  contact_email: `demo.mp.office.${index + 1}@example.invalid`,
  contact_phone: null,
  public_url: 'https://sansad.in/',
  categories: categoryDefinitions.map((category) => category.id),
  group: 'mp',
  locationIndex,
  weight: 1 + ((index * 5) % 8),
}));

const mlaAuthorities = mlaDefinitions.map(([constituency, , locationIndex], index) => ({
  name: `MLA Service Office — ${constituency} (Demo)`,
  authority_type: 'state',
  jurisdiction_level: 'district',
  contact_email: `demo.mla.office.${index + 1}@example.invalid`,
  contact_phone: null,
  public_url: 'https://www.india.gov.in/',
  categories: categoryDefinitions.map((category) => category.id),
  group: 'mla',
  locationIndex,
  weight: 1 + ((index * 7) % 9),
}));

const authorityDefinitions = [...ministryAuthorities, ...municipalityAuthorities, ...mpAuthorities, ...mlaAuthorities];

async function ensureReferenceData() {
  await sql`
    INSERT INTO service_categories (id, name, default_sla_days)
    SELECT x.id, x.name, x.sla
    FROM jsonb_to_recordset(${JSON.stringify(categoryDefinitions)}::jsonb) AS x(
      id text, name text, sla smallint, weight smallint
    )
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, default_sla_days = EXCLUDED.default_sla_days`;

  const authorityPayload = authorityDefinitions.map(({ categories, group, locationIndex, weight, ...row }) => row);
  await sql`
    INSERT INTO authorities (name, authority_type, jurisdiction_level, contact_email, contact_phone, public_url)
    SELECT x.name, x.authority_type, x.jurisdiction_level, x.contact_email, x.contact_phone, x.public_url
    FROM jsonb_to_recordset(${JSON.stringify(authorityPayload)}::jsonb) AS x(
      name text, authority_type text, jurisdiction_level text, contact_email text, contact_phone text, public_url text
    )
    WHERE NOT EXISTS (SELECT 1 FROM authorities existing WHERE existing.name = x.name)`;

  const authorityRows = await sql`
    SELECT DISTINCT ON (name) id, name
    FROM authorities
    WHERE name IN (
      SELECT value FROM jsonb_array_elements_text(${JSON.stringify(authorityDefinitions.map((row) => row.name))}::jsonb)
    )
    ORDER BY name, created_at, id`;
  const authorityIds = new Map(authorityRows.map((row) => [String(row.name), String(row.id)]));

  for (const authority of authorityDefinitions) {
    authority.id = authorityIds.get(authority.name);
    if (!authority.id) throw new Error(`Could not create authority: ${authority.name}`);
  }

  const representativeDefinitions = [
    ...ministries.map((ministry) => ({
      full_name: ministry.minister,
      role: 'minister',
      constituency_or_jurisdiction: ministry.name,
      authority_id: authorityIds.get(ministry.name),
    })),
    ...mpDefinitions.map(([constituency, fullName], index) => ({
      full_name: fullName,
      role: 'mp',
      constituency_or_jurisdiction: constituency,
      authority_id: authorityIds.get(mpAuthorities[index].name),
    })),
    ...mlaDefinitions.map(([constituency, fullName], index) => ({
      full_name: fullName,
      role: 'mla',
      constituency_or_jurisdiction: constituency,
      authority_id: authorityIds.get(mlaAuthorities[index].name),
    })),
    ...locations.map((location, index) => ({
      full_name: `Municipal Commissioner — ${location.city} (Demo)`,
      role: 'responsible_officer',
      constituency_or_jurisdiction: location.city,
      authority_id: authorityIds.get(municipalityAuthorities[index].name),
    })),
  ].map((row) => ({
    ...row,
    official_email: `${slug(row.full_name)}@example.invalid`,
    official_phone: null,
    office_address: `${row.constituency_or_jurisdiction} public service office (demo record)`,
    public_url: row.role === 'mp' ? 'https://sansad.in/' : 'https://www.india.gov.in/',
  }));

  await sql`
    INSERT INTO representatives (
      full_name, role, constituency_or_jurisdiction, official_email, official_phone,
      office_address, public_url, authority_id, active
    )
    SELECT x.full_name, x.role, x.constituency_or_jurisdiction, x.official_email, x.official_phone,
           x.office_address, x.public_url, x.authority_id, true
    FROM jsonb_to_recordset(${JSON.stringify(representativeDefinitions)}::jsonb) AS x(
      full_name text, role text, constituency_or_jurisdiction text, official_email text,
      official_phone text, office_address text, public_url text, authority_id uuid
    )
    WHERE NOT EXISTS (
      SELECT 1 FROM representatives existing
      WHERE existing.full_name = x.full_name AND existing.role = x.role
    )`;

  await sql`
    UPDATE representatives r
    SET authority_id = x.authority_id,
        constituency_or_jurisdiction = x.constituency_or_jurisdiction,
        official_email = x.official_email,
        office_address = x.office_address,
        public_url = x.public_url,
        active = true
    FROM jsonb_to_recordset(${JSON.stringify(representativeDefinitions)}::jsonb) AS x(
      full_name text, role text, constituency_or_jurisdiction text, official_email text,
      official_phone text, office_address text, public_url text, authority_id uuid
    )
    WHERE r.full_name = x.full_name AND r.role = x.role`;

  const municipalRules = municipalityAuthorities.flatMap((authority) => categoryDefinitions.map((category) => ({
    pin_prefix: locations[authority.locationIndex].pin.slice(0, 3),
    category_id: category.id,
    authority_id: authority.id,
    priority: 20,
  })));
  const nationalRules = ministryAuthorities.flatMap((authority, ministryIndex) => authority.categories.flatMap((categoryId) =>
    ['1','2','3','4','5','6','7','8','9'].map((pinPrefix) => ({
      pin_prefix: pinPrefix,
      category_id: categoryId,
      authority_id: authority.id,
      priority: 70 + ministryIndex,
    }))
  ));
  const rules = [...municipalRules, ...nationalRules];
  await sql`
    INSERT INTO jurisdiction_rules (pin_prefix, category_id, authority_id, priority)
    SELECT x.pin_prefix, x.category_id, x.authority_id, x.priority
    FROM jsonb_to_recordset(${JSON.stringify(rules)}::jsonb) AS x(
      pin_prefix text, category_id text, authority_id uuid, priority smallint
    )
    ON CONFLICT (pin_prefix, category_id, priority) DO NOTHING`;
}

function createComplaint(index) {
  const category = chooseWeighted(categoryDefinitions);
  const groupRoll = random();
  const group = groupRoll < 0.27 ? 'ministry' : groupRoll < 0.52 ? 'municipality' : groupRoll < 0.76 ? 'mp' : 'mla';
  const eligibleAuthorities = authorityDefinitions.filter((authority) => authority.group === group && authority.categories.includes(category.id));
  const authority = chooseWeighted(eligibleAuthorities);
  const location = authority.locationIndex === null ? locations[integer(0, locations.length - 1)] : locations[authority.locationIndex];

  const statusRoll = random();
  const status = statusRoll < 0.12 ? 'submitted'
    : statusRoll < 0.20 ? 'acknowledged'
      : statusRoll < 0.35 ? 'in_progress'
        : statusRoll < 0.50 ? 'resolved_by_authority'
          : statusRoll < 0.72 ? 'confirmed_closed'
            : statusRoll < 0.82 ? 'disputed'
              : statusRoll < 0.90 ? 'escalated'
                : 'closed';

  const now = Date.now();
  const ageDays = Math.floor(Math.pow(random(), 1.35) * 730);
  const submittedMs = now - ageDays * DAY - integer(2, 23) * HOUR;
  const slaDueMs = submittedMs + category.sla * DAY;
  const hasReportedFix = ['resolved_by_authority', 'confirmed_closed', 'disputed', 'closed'].includes(status);
  const resolutionDurationDays = integer(1, category.sla * 2 + 12);
  const resolvedMs = hasReportedFix ? Math.min(now - HOUR, submittedMs + resolutionDurationDays * DAY) : null;
  const closedMs = ['confirmed_closed', 'closed'].includes(status)
    ? Math.min(now, resolvedMs + integer(4, 72) * HOUR)
    : null;
  const publicId = `JAN-DEMO-${String(index + 1).padStart(6, '0')}`;
  const title = titles[category.id][integer(0, titles[category.id].length - 1)];
  const latitude = Number((location.latitude + (random() - 0.5) * 0.09).toFixed(6));
  const longitude = Number((location.longitude + (random() - 0.5) * 0.09).toFixed(6));

  return {
    public_id: publicId,
    reporter_access_hash: hashToken(`demo-token-${publicId}`),
    reporter_email: `demo.citizen.${String((index % 480) + 1).padStart(3, '0')}@example.invalid`,
    title: `${title} — ${location.city}`,
    description: `Demo grievance ${index + 1}: ${title.toLowerCase()} reported in ${location.city}. The record is synthetic and exists only to demonstrate routing, accountability, timelines and public statistics.`,
    category_id: category.id,
    pin_code: location.pin,
    latitude,
    longitude,
    location_precision_m: integer(15, 95),
    public_geohash: `demo-${location.pin.slice(0, 3)}-${String(integer(1, 18)).padStart(2, '0')}`,
    contact_phone: null,
    assigned_authority_id: authority.id,
    status,
    sla_due_at: new Date(slaDueMs).toISOString(),
    submitted_at: new Date(submittedMs).toISOString(),
    resolved_at: resolvedMs ? new Date(resolvedMs).toISOString() : null,
    closed_at: closedMs ? new Date(closedMs).toISOString() : null,
  };
}

async function upsertComplaintChunk(rows) {
  await sql`
    INSERT INTO complaints (
      public_id, reporter_access_hash, reporter_email, title, description, category_id, pin_code,
      latitude, longitude, location_precision_m, public_geohash, contact_phone, assigned_authority_id,
      status, sla_due_at, submitted_at, resolved_at, closed_at
    )
    SELECT
      x.public_id, x.reporter_access_hash, x.reporter_email, x.title, x.description, x.category_id,
      x.pin_code::char(6), x.latitude, x.longitude, x.location_precision_m, x.public_geohash,
      x.contact_phone, x.assigned_authority_id, x.status::complaint_status, x.sla_due_at,
      x.submitted_at, x.resolved_at, x.closed_at
    FROM jsonb_to_recordset(${JSON.stringify(rows)}::jsonb) AS x(
      public_id text, reporter_access_hash text, reporter_email text, title text, description text,
      category_id text, pin_code text, latitude numeric, longitude numeric, location_precision_m smallint,
      public_geohash text, contact_phone text, assigned_authority_id uuid, status text,
      sla_due_at timestamptz, submitted_at timestamptz, resolved_at timestamptz, closed_at timestamptz
    )
    ON CONFLICT (public_id) DO UPDATE SET
      reporter_access_hash = EXCLUDED.reporter_access_hash,
      reporter_email = EXCLUDED.reporter_email,
      title = EXCLUDED.title,
      description = EXCLUDED.description,
      category_id = EXCLUDED.category_id,
      pin_code = EXCLUDED.pin_code,
      latitude = EXCLUDED.latitude,
      longitude = EXCLUDED.longitude,
      location_precision_m = EXCLUDED.location_precision_m,
      public_geohash = EXCLUDED.public_geohash,
      assigned_authority_id = EXCLUDED.assigned_authority_id,
      status = EXCLUDED.status,
      sla_due_at = EXCLUDED.sla_due_at,
      submitted_at = EXCLUDED.submitted_at,
      resolved_at = EXCLUDED.resolved_at,
      closed_at = EXCLUDED.closed_at`;
}

async function rebuildDemoWorkflow() {
  await sql`DELETE FROM complaint_events WHERE complaint_id IN (SELECT id FROM complaints WHERE public_id LIKE 'JAN-DEMO-%')`;
  await sql`DELETE FROM disputes WHERE complaint_id IN (SELECT id FROM complaints WHERE public_id LIKE 'JAN-DEMO-%')`;

  await sql`
    INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata, created_at)
    SELECT id, 'submitted', 'reporter', 'Complaint submitted by citizen.', '{"demo":true}'::jsonb, submitted_at
    FROM complaints WHERE public_id LIKE 'JAN-DEMO-%'`;
  await sql`
    INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata, created_at)
    SELECT id, 'routed', 'system', 'Automatically routed using issue type and PIN code.', '{"demo":true}'::jsonb, submitted_at + interval '5 minutes'
    FROM complaints WHERE public_id LIKE 'JAN-DEMO-%'`;
  await sql`
    INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata, created_at)
    SELECT id, 'acknowledged', 'responsible_officer', 'The responsible office acknowledged the grievance.', '{"demo":true}'::jsonb, submitted_at + interval '1 day'
    FROM complaints
    WHERE public_id LIKE 'JAN-DEMO-%' AND status IN ('acknowledged', 'in_progress')`;
  await sql`
    INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata, created_at)
    SELECT id, 'progress_update', 'responsible_officer', 'Work is in progress and the responsible team has recorded an update.', '{"demo":true}'::jsonb, submitted_at + interval '2 days'
    FROM complaints
    WHERE public_id LIKE 'JAN-DEMO-%' AND status = 'in_progress'`;
  await sql`
    INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata, created_at)
    SELECT id, 'authority_marked_resolved', 'responsible_officer', 'The responsible office reported that corrective work was completed.', '{"demo":true}'::jsonb, resolved_at
    FROM complaints
    WHERE public_id LIKE 'JAN-DEMO-%' AND resolved_at IS NOT NULL`;
  await sql`
    INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata, created_at)
    SELECT id, 'reporter_confirmed_closed', 'reporter', 'The reporter confirmed that the issue was resolved.', '{"demo":true}'::jsonb, closed_at
    FROM complaints
    WHERE public_id LIKE 'JAN-DEMO-%' AND closed_at IS NOT NULL`;
  await sql`
    INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata, created_at)
    SELECT id, 'escalated', 'system', 'The grievance was escalated after exceeding its service timeline.', '{"demo":true}'::jsonb, LEAST(now(), sla_due_at + interval '2 days')
    FROM complaints
    WHERE public_id LIKE 'JAN-DEMO-%' AND status = 'escalated'`;

  await sql`
    INSERT INTO disputes (complaint_id, raised_by, reason, status, opened_at)
    SELECT id, 'reporter', 'The reported fix was incomplete and the underlying public-service issue remains visible.',
           CASE WHEN RIGHT(public_id, 1) IN ('0', '5') THEN 'under_review' ELSE 'open' END,
           LEAST(now(), resolved_at + interval '1 day')
    FROM complaints
    WHERE public_id LIKE 'JAN-DEMO-%' AND status = 'disputed'
    ON CONFLICT (complaint_id) DO UPDATE SET
      reason = EXCLUDED.reason, status = EXCLUDED.status, opened_at = EXCLUDED.opened_at, resolved_at = NULL`;
  await sql`
    INSERT INTO complaint_events (complaint_id, event_type, actor_role, public_note, metadata, created_at)
    SELECT c.id, 'reporter_disputed', 'reporter', 'The reporter disputed the reported fix; the review is part of the public log.', '{"demo":true}'::jsonb, d.opened_at
    FROM complaints c
    JOIN disputes d ON d.complaint_id = c.id
    WHERE c.public_id LIKE 'JAN-DEMO-%'`;
}

async function seedComplaints() {
  const rows = Array.from({ length: complaintCount }, (_, index) => createComplaint(index));
  const chunkSize = 500;
  for (let start = 0; start < rows.length; start += chunkSize) {
    await upsertComplaintChunk(rows.slice(start, start + chunkSize));
    console.log(`Seeded ${Math.min(start + chunkSize, rows.length)} / ${rows.length} complaints`);
  }
  await rebuildDemoWorkflow();
}

await ensureReferenceData();
await seedComplaints();

const summary = await sql`
  SELECT
    count(*)::int AS complaints,
    count(*) FILTER (
      WHERE status NOT IN ('resolved_by_authority', 'confirmed_closed', 'closed') AND sla_due_at < now()
    )::int AS overdue,
    count(*) FILTER (WHERE status IN ('resolved_by_authority', 'confirmed_closed', 'closed'))::int AS resolved,
    count(*) FILTER (WHERE status = 'disputed')::int AS disputed,
    count(DISTINCT assigned_authority_id)::int AS authorities
  FROM complaints
  WHERE public_id LIKE 'JAN-DEMO-%'`;
const representativeSummary = await sql`
  SELECT role, count(*)::int AS records
  FROM representatives
  WHERE full_name LIKE '%(Demo)%' AND role IN ('minister', 'mp', 'mla')
  GROUP BY role ORDER BY role`;

console.log('Large demo dataset ready:', summary[0]);
console.log('Demo representatives:', representativeSummary);
