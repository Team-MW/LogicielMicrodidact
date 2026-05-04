-- 
-- Schéma de Base de Données Supabase pour LogicielMicrodidact
--

-- 1. Table: Projects
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Planifié',
    progress INTEGER DEFAULT 0,
    deadline TEXT,
    priority TEXT DEFAULT 'Moyenne',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: Project Notes
CREATE TABLE IF NOT EXISTS project_notes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.b. Table: Software Projects
CREATE TABLE IF NOT EXISTS software_projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    client TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Planifié',
    progress INTEGER DEFAULT 0,
    deadline TEXT,
    priority TEXT DEFAULT 'Moyenne',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2.c. Table: Software Project Notes
CREATE TABLE IF NOT EXISTS software_project_notes (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES software_projects(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Table: Installations (Suivi Poseurs)
CREATE TABLE IF NOT EXISTS installations (
    id SERIAL PRIMARY KEY,
    client TEXT NOT NULL,
    address TEXT NOT NULL,
    sign_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'À planifier',
    poseur TEXT NOT NULL,
    deadline TEXT,
    priority TEXT DEFAULT 'Moyenne',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Table: Installation Notes
CREATE TABLE IF NOT EXISTS installation_notes (
    id SERIAL PRIMARY KEY,
    installation_id INTEGER REFERENCES installations(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Table: Clients (Customers)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Table: Transactions (POS)
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
    amount NUMERIC(10,2) NOT NULL,
    payment_method TEXT NOT NULL,
    status TEXT DEFAULT 'Payé',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activer Row Level Security (RLS) pour la sécurité
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE software_project_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE installation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_tasks ENABLE ROW LEVEL SECURITY;

-- 7. Table: Calendar Tasks (Planning Stagiaires)
CREATE TABLE IF NOT EXISTS calendar_tasks (
    id SERIAL PRIMARY KEY,
    intern_name TEXT NOT NULL,
    task_description TEXT NOT NULL,
    task_date DATE NOT NULL,
    project_link TEXT,
    status TEXT DEFAULT 'A faire',
    priority TEXT DEFAULT 'Normale',
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Policies
CREATE POLICY "Allow all read" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON projects FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON project_notes FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON project_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete" ON project_notes FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON software_projects FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON software_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON software_projects FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON software_projects FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON software_project_notes FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON software_project_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete" ON software_project_notes FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON installations FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON installations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON installations FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON installations FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON installation_notes FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON installation_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete" ON installation_notes FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON customers FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON customers FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON transactions FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON calendar_tasks FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON calendar_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON calendar_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON calendar_tasks FOR DELETE USING (true);

-- Création de politiques de sécurité (Permissives pour le test initial)
-- Note: À affiner en production en fonction de l'authentification utilisateur.
CREATE POLICY "Allow all read" ON projects FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON projects FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON projects FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON project_notes FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON project_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete" ON project_notes FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON software_projects FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON software_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON software_projects FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON software_projects FOR DELETE USING (true);

CREATE POLICY "Allow all read" ON software_project_notes FOR SELECT USING (true);
CREATE POLICY "Allow all write" ON software_project_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all delete" ON software_project_notes FOR DELETE USING (true);

CREATE POLICY "Allow all read notes" ON project_notes FOR SELECT USING (true);
CREATE POLICY "Allow all write notes" ON project_notes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all read inst" ON installations FOR SELECT USING (true);
CREATE POLICY "Allow all write inst" ON installations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update inst" ON installations FOR UPDATE USING (true);

CREATE POLICY "Allow all read inst notes" ON installation_notes FOR SELECT USING (true);
CREATE POLICY "Allow all write inst notes" ON installation_notes FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all read cust" ON customers FOR SELECT USING (true);
CREATE POLICY "Allow all write cust" ON customers FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow all read tx" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow all write tx" ON transactions FOR INSERT WITH CHECK (true);
