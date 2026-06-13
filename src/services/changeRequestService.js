import { supabase } from '@/lib/supabaseClient';
import { createEntityService } from '@/services/entityService';

const base = createEntityService('change_requests');

/** Columns on the live change_requests table */
const ALLOWED_COLUMNS = new Set([
  'member_id',
  'requested_by',
  'change_type',
  'old_data',
  'new_data',
  'status',
  'admin_note',
]);

export function pickChangeRequestPayload(record) {
  const result = {};
  Object.entries(record).forEach(([key, value]) => {
    if (!ALLOWED_COLUMNS.has(key)) return;
    if (value === undefined) return;
    result[key] = value;
  });
  return result;
}

function assertRow(row) {
  if (!row?.id) {
    const err = new Error(
      'change_requests insert returned no row — insert may have been blocked by RLS. Check Supabase policies for change_requests.',
    );
    console.error('[change_requests]', err.message);
    throw err;
  }
  return row;
}

export const changeRequestService = {
  list: base.list,
  get: base.get,
  filter: base.filter,
  update: base.update,

  async listPending(limit = 100) {
    return base.filter({ status: 'pending' }, '-created_at', limit);
  },

  async setStatus(id, status, adminNote = null) {
    const updates = { status };
    if (adminNote != null && adminNote !== '') {
      updates.admin_note = adminNote;
    }
    return base.update(id, updates);
  },

  async create(record) {
    const payload = { ...pickChangeRequestPayload(record), status: record.status ?? 'pending' };
    console.log('Submitting change request:', payload);

    const { data, error } = await supabase
      .from('change_requests')
      .insert(payload)
      .select()
      .single();

    console.log('Supabase response:', data);

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return assertRow(data);
  },
};
