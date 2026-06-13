-- PandeyKul: birth order columns for precise Nepali kinship terms
-- Run in Supabase SQL Editor.

ALTER TABLE family_members ADD COLUMN IF NOT EXISTS birth_order int;
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS approximate_birth_year int;

COMMENT ON COLUMN family_members.birth_order IS 'Sibling order among shared parents (1 = eldest).';
COMMENT ON COLUMN family_members.approximate_birth_year IS 'Approximate birth year when exact DOB is unknown.';
