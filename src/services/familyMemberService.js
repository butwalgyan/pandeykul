import { supabase } from '@/lib/supabaseClient';
import { createEntityService } from '@/services/entityService';

const base = createEntityService('family_members');

/** Columns that exist on the live Supabase family_members table */
const ALLOWED_COLUMNS = new Set([
  'full_name',
  'nepali_name',
  'gender',
  'date_of_birth',
  'date_of_death',
  'birthplace',
  'current_location',
  'biography',
  'generation',
  'branch',
  'father_id',
  'mother_id',
  'birth_order',
  'approximate_birth_year',
  'verification_status',
]);

/** Parent IDs from father_id / mother_id (and legacy parent_ids) */
export function getMemberParentIds(member) {
  if (!member) return [];
  return [...new Set([
    member.father_id,
    member.mother_id,
    ...(member.parent_ids || []),
  ].filter(Boolean))];
}

/** Normalize members for tree rendering */
export function prepareMembersForTree(members) {
  return members.map(m => ({
    ...m,
    parent_ids: getMemberParentIds(m),
  }));
}

/** Normalize parent UUID from change_requests.new_data */
export function normalizeParentId(value) {
  if (value === undefined || value === null || value === '') return undefined;
  return value;
}

/** Map change_requests.new_data into a family_members insert/update payload.
 *  father_id and mother_id are optional — either, both, or neither may be set. */
export function memberFromChangeRequestNewData(newData) {
  if (!newData) return {};

  const fatherId = normalizeParentId(newData.father_id);
  const motherId = normalizeParentId(newData.mother_id);

  return pickFamilyMemberPayload({
    full_name: newData.full_name,
    nepali_name: newData.nepali_name,
    gender: newData.gender,
    date_of_birth: newData.date_of_birth,
    date_of_death: newData.date_of_death,
    birthplace: newData.birthplace,
    current_location: newData.current_location,
    biography: newData.biography,
    generation: newData.generation,
    branch: newData.branch,
    birth_order: newData.birth_order,
    approximate_birth_year: newData.approximate_birth_year,
    ...(fatherId ? { father_id: fatherId } : {}),
    ...(motherId ? { mother_id: motherId } : {}),
    verification_status: 'approved',
  });
}

export function pickFamilyMemberPayload(data) {
  const result = {};
  Object.entries(data).forEach(([key, value]) => {
    if (!ALLOWED_COLUMNS.has(key)) return;
    if (value === undefined || value === null || value === '') return;
    result[key] = value;
  });
  return result;
}

/** Lower birth_order / earlier year = elder. Used by relationship engine. */
export function getSeniorityScore(member) {
  if (!member) return null;
  if (member.birth_order != null && member.birth_order !== '') {
    const order = Number(member.birth_order);
    if (!Number.isNaN(order)) return { value: order, kind: 'order' };
  }
  if (member.approximate_birth_year != null && member.approximate_birth_year !== '') {
    const year = Number(member.approximate_birth_year);
    if (!Number.isNaN(year)) return { value: year, kind: 'year' };
  }
  if (member.date_of_birth) {
    const year = new Date(member.date_of_birth).getFullYear();
    if (!Number.isNaN(year)) return { value: year, kind: 'year' };
  }
  return null;
}

function assertRow(operation, row) {
  if (!row?.id) {
    const err = new Error(
      `${operation} returned no row — insert may have been blocked by RLS. Check Supabase policies for family_members.`,
    );
    console.error('[family_members]', err.message);
    throw err;
  }
  return row;
}

export const familyMemberService = {
  list: base.list,
  get: base.get,
  filter: base.filter,

  async listApproved(limit = 200) {
    return base.filter({ verification_status: 'approved' }, '-generation', limit);
  },
  update: async (id, updates) => {
    const payload = pickFamilyMemberPayload(updates);
    console.log('[family_members] update payload:', { id, ...payload });
    try {
      const row = await base.update(id, payload);
      console.log('[family_members] update success:', row);
      return assertRow('update', row);
    } catch (error) {
      console.error('[family_members] update failed:', error);
      throw error;
    }
  },
  delete: base.delete,

  async create(record) {
    const payload = pickFamilyMemberPayload(record);
    console.log('[family_members] insert payload:', payload);

    const { data, error } = await supabase
      .from('family_members')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[family_members] insert failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      throw error;
    }

    console.log('[family_members] insert success:', data);
    return assertRow('create', data);
  },
};
