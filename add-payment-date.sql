-- Ajouter les colonnes payment_end_date et payment_note pour gérer les périodes de gratuité et les dates d'échéance

-- 1. Pour les projets (Vitrine)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_end_date TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_note TEXT;

-- 2. Pour les logiciels
ALTER TABLE software_projects ADD COLUMN IF NOT EXISTS payment_end_date TEXT;
ALTER TABLE software_projects ADD COLUMN IF NOT EXISTS payment_note TEXT;

-- 3. Pour le suivi de facturation
ALTER TABLE billing_projects ADD COLUMN IF NOT EXISTS payment_end_date TEXT;
ALTER TABLE billing_projects ADD COLUMN IF NOT EXISTS payment_note TEXT;
