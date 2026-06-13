-- Run in Supabase SQL Editor so inserts from the logged-in app succeed.

-- Required for admin approval flow (sets approved members on insert)
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS verification_status text;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS father_id uuid REFERENCES family_members(id);
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS mother_id uuid REFERENCES family_members(id);

-- Optional: store full change-request payload (add to ALLOWED_COLUMNS in changeRequestService.js after running)
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS proposed_data jsonb;
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS submission_type text;
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS submitted_by_email text;
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS submitted_by_name text;
ALTER TABLE change_requests ADD COLUMN IF NOT EXISTS reason_or_note text;

-- family_members policies
DROP POLICY IF EXISTS "family_members_select_authenticated" ON family_members;
CREATE POLICY "family_members_select_authenticated"
  ON family_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "family_members_insert_authenticated" ON family_members;
CREATE POLICY "family_members_insert_authenticated"
  ON family_members FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "family_members_update_authenticated" ON family_members;
CREATE POLICY "family_members_update_authenticated"
  ON family_members FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- change_requests policies
DROP POLICY IF EXISTS "change_requests_select_authenticated" ON change_requests;
CREATE POLICY "change_requests_select_authenticated"
  ON change_requests FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "change_requests_insert_authenticated" ON change_requests;
CREATE POLICY "change_requests_insert_authenticated"
  ON change_requests FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "change_requests_update_authenticated" ON change_requests;
CREATE POLICY "change_requests_update_authenticated"
  ON change_requests FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- relationships policies
DROP POLICY IF EXISTS "relationships_select_authenticated" ON relationships;
CREATE POLICY "relationships_select_authenticated"
  ON relationships FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "relationships_insert_authenticated" ON relationships;
CREATE POLICY "relationships_insert_authenticated"
  ON relationships FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "relationships_update_authenticated" ON relationships;
CREATE POLICY "relationships_update_authenticated"
  ON relationships FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
