INSERT INTO service_categories (id,name,default_sla_days) VALUES
 ('water','Water & sanitation',7),('roads','Roads & public transport',10),('power','Power & street lighting',3),('health','Health services',7),('housing','Housing & urban services',14),('waste','Waste collection & cleanliness',3),('pensions','Pensions',21),('epfo_labour','EPFO & labour',21),('banking','Banking & financial services',21),('railways','Railways',14),('telecom','Telecom & mobile services',14),('education','Education & scholarships',21),('police_home','Police, safety & home affairs',14),('land_revenue','Land, property & revenue',21),('food_distribution','Ration & food distribution',7),('social_welfare','Social welfare & benefits',21),('vehicle_services','Driving licence & vehicle services',14),('environment','Environment & pollution',14),('postal','Postal services',14),('digital_services','Government portals & digital services',10),('taxation','Taxation & public revenue',21),('agriculture','Agriculture & farmer services',14),('consumer','Consumer affairs',21),('aadhaar_identity','Aadhaar & identity services',21),('other','Other public service',14)
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,default_sla_days=EXCLUDED.default_sla_days;

INSERT INTO authorities (name,authority_type,jurisdiction_level,contact_email,contact_phone,public_url) VALUES
 ('New Delhi Municipal Council','municipality','municipal','contact@ndmc.gov.in','011-2336-4010','https://ndmc.gov.in/'),
 ('Greater Hyderabad Municipal Corporation','municipality','municipal',NULL,'040-2322-5353','https://www.ghmc.gov.in/'),
 ('Ministry of Jal Shakti','ministry','national',NULL,NULL,'https://jalshakti-dowr.gov.in/'),
 ('Ministry of Road Transport and Highways','ministry','national',NULL,NULL,'https://morth.nic.in/')
ON CONFLICT DO NOTHING;

INSERT INTO jurisdiction_rules (pin_prefix,category_id,authority_id,priority)
SELECT '11','water',id,10 FROM authorities WHERE name='New Delhi Municipal Council'
ON CONFLICT DO NOTHING;
INSERT INTO jurisdiction_rules (pin_prefix,category_id,authority_id,priority)
SELECT '11','roads',id,10 FROM authorities WHERE name='New Delhi Municipal Council'
ON CONFLICT DO NOTHING;
INSERT INTO jurisdiction_rules (pin_prefix,category_id,authority_id,priority)
SELECT '11','power',id,10 FROM authorities WHERE name='New Delhi Municipal Council'
ON CONFLICT DO NOTHING;
