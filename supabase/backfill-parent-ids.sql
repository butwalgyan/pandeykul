-- Check Shree Krishna's parent links
SELECT id, full_name, father_id, mother_id, verification_status
FROM family_members
WHERE full_name ILIKE '%Shree Krishna%';

-- Backfill father_id / mother_id from approved change_requests.new_data
-- (for members approved before parent columns were saved)
UPDATE family_members fm
SET
  father_id = COALESCE(fm.father_id, NULLIF(cr.new_data->>'father_id', '')::uuid),
  mother_id = COALESCE(fm.mother_id, NULLIF(cr.new_data->>'mother_id', '')::uuid)
FROM change_requests cr
WHERE cr.status = 'approved'
  AND cr.new_data->>'full_name' = fm.full_name
  AND (fm.father_id IS NULL OR fm.mother_id IS NULL)
  AND (
    NULLIF(cr.new_data->>'father_id', '') IS NOT NULL
    OR NULLIF(cr.new_data->>'mother_id', '') IS NOT NULL
  );

-- Verify after backfill
SELECT id, full_name, father_id, mother_id
FROM family_members
WHERE full_name ILIKE '%Shree Krishna%';
