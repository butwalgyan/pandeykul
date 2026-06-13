-- PandeyKul: family_members source of truth + relationships table for spouses
-- Run in Supabase SQL Editor.

-- family_members: blood structure columns
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS nepali_name text;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS birth_order int;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS approximate_birth_year int;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS father_id uuid REFERENCES family_members(id);
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS mother_id uuid REFERENCES family_members(id);
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS verification_status text;

-- relationships: spouse and future special links
CREATE TABLE IF NOT EXISTS relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  related_person_id uuid NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT relationships_no_self_link CHECK (person_id <> related_person_id)
);

CREATE INDEX IF NOT EXISTS idx_relationships_person_id ON relationships(person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related_person_id ON relationships(related_person_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON relationships(relationship_type);

-- Migrate legacy person_1_id / person_2_id columns if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'person_1_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'person_id'
  ) THEN
    ALTER TABLE relationships RENAME COLUMN person_1_id TO person_id;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'person_2_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'relationships' AND column_name = 'related_person_id'
  ) THEN
    ALTER TABLE relationships RENAME COLUMN person_2_id TO related_person_id;
  END IF;
END $$;

ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "relationships_select_authenticated" ON relationships;
CREATE POLICY "relationships_select_authenticated"
  ON relationships FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "relationships_insert_authenticated" ON relationships;
CREATE POLICY "relationships_insert_authenticated"
  ON relationships FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "relationships_update_authenticated" ON relationships;
CREATE POLICY "relationships_update_authenticated"
  ON relationships FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
