-- Activer la suppression pour toutes les tables (Permet de résoudre l'erreur RLS)

-- 1. Table: Projects (Suivi Vitrine)
DROP POLICY IF EXISTS "Allow all delete" ON projects;
CREATE POLICY "Allow all delete" ON projects FOR DELETE USING (true);

-- 2. Table: Software Projects (Suivi Logiciels)
DROP POLICY IF EXISTS "Allow all delete" ON software_projects;
CREATE POLICY "Allow all delete" ON software_projects FOR DELETE USING (true);

-- 3. Table: Billing Projects (Suivi Facturation)
DROP POLICY IF EXISTS "Allow all delete" ON billing_projects;
CREATE POLICY "Allow all delete" ON billing_projects FOR DELETE USING (true);

-- 4. Autres tables
DROP POLICY IF EXISTS "Allow all delete" ON project_notes;
CREATE POLICY "Allow all delete" ON project_notes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow all delete" ON software_project_notes;
CREATE POLICY "Allow all delete" ON software_project_notes FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow all delete" ON billing_project_notes;
CREATE POLICY "Allow all delete" ON billing_project_notes FOR DELETE USING (true);

-- 5. Table Installations (Suivi Poseur)
DROP POLICY IF EXISTS "Allow all delete" ON installations;
CREATE POLICY "Allow all delete" ON installations FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow all delete" ON installation_notes;
CREATE POLICY "Allow all delete" ON installation_notes FOR DELETE USING (true);
