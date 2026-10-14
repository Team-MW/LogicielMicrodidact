-- =======================================================
-- Migration: Table des Projets Commerciaux (Commercial)
-- =======================================================

CREATE TABLE IF NOT EXISTS commercial_projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    address TEXT,
    project_type TEXT DEFAULT 'Enseigne / Signalétique',
    status TEXT NOT NULL DEFAULT 'Devis à faire',
    priority TEXT DEFAULT 'Moyenne',
    estimated_amount TEXT,
    commercial_name TEXT DEFAULT 'Commercial',
    deadline TEXT,
    description TEXT,
    photos TEXT[] DEFAULT '{}',
    meeting_date TEXT,
    meeting_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la table existe déjà, ajouter les colonnes :
ALTER TABLE commercial_projects ADD COLUMN IF NOT EXISTS meeting_date TEXT;
ALTER TABLE commercial_projects ADD COLUMN IF NOT EXISTS meeting_note TEXT;

CREATE TABLE IF NOT EXISTS commercial_project_notes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES commercial_projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE commercial_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_project_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read commercial_projects" ON commercial_projects;
CREATE POLICY "Allow all read commercial_projects" ON commercial_projects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all write commercial_projects" ON commercial_projects;
CREATE POLICY "Allow all write commercial_projects" ON commercial_projects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update commercial_projects" ON commercial_projects;
CREATE POLICY "Allow all update commercial_projects" ON commercial_projects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow all delete commercial_projects" ON commercial_projects;
CREATE POLICY "Allow all delete commercial_projects" ON commercial_projects FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow all read commercial_project_notes" ON commercial_project_notes;
CREATE POLICY "Allow all read commercial_project_notes" ON commercial_project_notes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all write commercial_project_notes" ON commercial_project_notes;
CREATE POLICY "Allow all write commercial_project_notes" ON commercial_project_notes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update commercial_project_notes" ON commercial_project_notes;
CREATE POLICY "Allow all update commercial_project_notes" ON commercial_project_notes FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow all delete commercial_project_notes" ON commercial_project_notes;
CREATE POLICY "Allow all delete commercial_project_notes" ON commercial_project_notes FOR DELETE USING (true);
