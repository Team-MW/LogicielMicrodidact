ALTER TABLE projects ADD COLUMN payment_status TEXT DEFAULT 'Impayé';
ALTER TABLE projects ADD COLUMN payment_amount TEXT;

ALTER TABLE software_projects ADD COLUMN payment_status TEXT DEFAULT 'Impayé';
ALTER TABLE software_projects ADD COLUMN payment_amount TEXT;

ALTER TABLE billing_projects ADD COLUMN payment_status TEXT DEFAULT 'Impayé';
ALTER TABLE billing_projects ADD COLUMN payment_amount TEXT;
