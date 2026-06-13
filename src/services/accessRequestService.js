import { supabase } from '@/lib/supabaseClient';
import { createEntityService } from '@/services/entityService';

const base = createEntityService('access_requests');

const ALLOWED_ROLES = new Set(['viewer', 'family_editor']);

function pickPayload(data) {
  const result = {};
  const fields = [
    'full_name',
    'nepali_name',
    'email',
    'phone_number',
    'current_address',
    'father_name',
    'grandfather_name',
    'relationship_branch_info',
    'message_to_admin',
    'status',
    'approved_role',
    'admin_note',
    'reviewed_by',
    'reviewed_at',
  ];
  fields.forEach((key) => {
    const value = data[key];
    if (value === undefined || value === null || value === '') return;
    result[key] = value;
  });
  return result;
}

async function upsertUserProfile(request, role) {
  const email = request.email?.trim()?.toLowerCase();
  if (!email) throw new Error('Access request is missing email.');

  const profile = {
    email,
    full_name: request.full_name,
    nepali_name: request.nepali_name || null,
    role,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from('user_profiles')
      .update(profile)
      .eq('id', existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .insert(profile)
    .select('id')
    .single();

  if (error) throw error;
  return data?.id;
}

export const accessRequestService = {
  list: base.list,
  get: base.get,
  filter: base.filter,

  async listPending(limit = 200) {
    return base.filter({ status: 'pending' }, '-created_at', limit);
  },

  async submitRequest(formData) {
    const payload = pickPayload({
      full_name: formData.full_name?.trim(),
      nepali_name: formData.nepali_name?.trim(),
      email: formData.email?.trim()?.toLowerCase(),
      phone_number: formData.phone_number?.trim(),
      current_address: formData.current_address?.trim(),
      father_name: formData.father_name?.trim(),
      grandfather_name: formData.grandfather_name?.trim(),
      relationship_branch_info: formData.relationship_branch_info?.trim(),
      message_to_admin: formData.message_to_admin?.trim(),
      status: 'pending',
    });

    if (!payload.full_name || !payload.email) {
      throw new Error('Full name and email are required.');
    }

    const { data, error } = await supabase
      .from('access_requests')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('[access_requests] submit failed:', error);
      throw error;
    }

    return data;
  },

  async approveRequest(request, role, adminUser) {
    if (!ALLOWED_ROLES.has(role)) {
      throw new Error('Approved role must be viewer or family_editor.');
    }

    await upsertUserProfile(request, role);

    const { data, error } = await supabase
      .from('access_requests')
      .update({
        status: 'approved',
        approved_role: role,
        reviewed_by: adminUser?.email || adminUser?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', request.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async rejectRequest(request, adminUser, adminNote = null) {
    const { data, error } = await supabase
      .from('access_requests')
      .update({
        status: 'rejected',
        admin_note: adminNote || null,
        reviewed_by: adminUser?.email || adminUser?.id || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', request.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
