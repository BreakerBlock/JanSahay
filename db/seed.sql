INSERT INTO service_categories (id,name,default_sla_days) VALUES
 ('water','Water & sanitation',7),('roads','Roads & transport',10),('power','Power & street lighting',3),('health','Health services',7),('housing','Housing & urban services',14),('other','Other public service',14)
ON CONFLICT (id) DO NOTHING;

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
