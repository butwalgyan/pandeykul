import { supabase } from '@/lib/supabaseClient';
import { createEntityService } from '@/services/entityService';

const base = createEntityService('access_requests');

const ALLOWED_ROLES = new Set(['viewer', 'family_editor']);

function pickPayload(data) {
  const fields = [
    'full_name',
    'nepali_name',
    'email',
    'phone_number',
    'current_address',
    'father_name',
    'grandfather_name',
    'spouse_name',
    'relationship_branch_info',
    'message_to_admin',
  ];

  const result = {};

  fields.forEach((key) => {
    const value = data[key];
    if (value === undefined || value === null || value === '') return;
    result[key] = value;
  });

  return result;
}

function normalizeFormData(data) {
  return {
    full_name: data.full_name?.trim(),
    nepali_name: data.nepali_name?.trim(),
    email: data.email?.trim()?.toLowerCase(),
    phone_number: data.phone_number?.trim(),
    current_address: data.current_address?.trim(),
    father_name: data.father_name?.trim(),
    grandfather_name: data.grandfather_name?.trim(),
    spouse_name: data.spouse_name?.trim(),
    relationship_branch_info: data.relationship_branch_info?.trim(),
    message_to_admin: data.message_to_admin?.trim(),
  };
}

async function getAuthUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

async function getReviewedByFields() {
  const authUserId = await getAuthUserId();
  return authUserId ? { reviewed_by: authUserId } : {};
}

function toServiceError(error, fallback) {
  console.error('[access_requests]', fallback, error);
  return new Error(error?.message || fallback);
}

export async function submitAccessRequest(data) {
  const payload = {
    ...pickPayload(normalizeFormData(data)),
    status: 'pending',
  };

  if (!payload.full_name || !payload.email) {
    throw new Error('Full name and email are required.');
  }

  const { error } = await supabase
    .from('access_requests')
    .insert([payload]);

  if (error) {
    console.error('[access_requests] submit failed:', error);
    throw error;
  }

  return { success: true };
}

async function upsertUserProfile(request, role) {
  const email = request.email?.trim()?.toLowerCase();
  if (!email) throw new Error('Access request is missing email.');

  const { error } = await supabase
    .from('user_profiles')
    .upsert(
      {
        email: request.email,
        full_name: request.full_name,
        role,
        access_status: 'approved',
        approved_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (error) throw toServiceError(error, 'Failed to upsert user profile.');
}

export async function approveAccessRequest(request, role) {
  if (!ALLOWED_ROLES.has(role)) {
    throw new Error('Approved role must be viewer or family_editor.');
  }

  const id = request?.id;
  if (!id) {
    throw new Error('Access request id is required.');
  }

  if (!request?.email || !request?.full_name) {
    throw new Error('Access request is missing email or full name.');
  }

  if (request.status && request.status !== 'pending') {
    throw new Error('Pending access request not found.');
  }

  console.log('[access_requests] approveAccessRequest', { id: request.id, role, email: request.email });

  const reviewedAt = new Date().toISOString();
  const reviewedByUpdate = await getReviewedByFields();

  const { data: updatedRequest, error: requestError } = await supabase
    .from('access_requests')
    .update({
      status: 'approved',
      approved_role: role,
      reviewed_at: reviewedAt,
      ...reviewedByUpdate,
    })
    .eq('id', request.id)
    .eq('status', 'pending')
    .select('id, status, approved_role')
    .single();

  if (
    requestError
    || !updatedRequest
    || updatedRequest.status !== 'approved'
    || updatedRequest.approved_role !== role
  ) {
    throw toServiceError(requestError, 'Failed to approve access request.');
  }

  console.log('[access_requests] approveAccessRequest updated', updatedRequest);

  try {
    await upsertUserProfile(request, role);
  } catch (profileError) {
    throw new Error(
      profileError.message || 'Access request was approved but user profile could not be saved.'
    );
  }

  return { success: true };
}

export async function rejectAccessRequest(id) {
  if (!id) {
    throw new Error('Access request id is required.');
  }

  console.log('[access_requests] rejectAccessRequest', { id });

  const reviewedByUpdate = await getReviewedByFields();

  const { data: updatedRequest, error } = await supabase
    .from('access_requests')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      ...reviewedByUpdate,
    })
    .eq('id', id)
    .eq('status', 'pending')
    .select('id, status')
    .single();

  if (error || !updatedRequest || updatedRequest.status !== 'rejected') {
    throw toServiceError(error, 'Failed to reject access request.');
  }

  console.log('[access_requests] rejectAccessRequest updated', updatedRequest);

  return { success: true };
}

export const accessRequestService = {
  list: base.list,
  get: base.get,
  filter: base.filter,

  async listPending() {
    const { data, error } = await supabase
      .from('access_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[access_requests] listPending failed:', error);
      throw error;
    }

    return data || [];
  },

  submitRequest: submitAccessRequest,
  approveAccessRequest,
  rejectAccessRequest,
};
