import { supabase } from '@/lib/supabaseClient';

function mapUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    role: user.user_metadata?.role || 'user',
  };
}

export const authService = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) throw error;
    if (!user) return null;

    const mapped = mapUser(user);

    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, full_name, email')
        .eq('email', user.email)
        .maybeSingle();

      if (profile) {
        mapped.role = profile.role || mapped.role;
        mapped.full_name = profile.full_name || mapped.full_name;
      }
    } catch {
      // user_profiles may be unavailable; fall back to auth metadata
    }

    return mapped;
  },

  redirectToLogin(returnUrl) {
    const params = returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : '';
    window.location.href = `/login${params}`;
  },

  async inviteUser(email, role = 'user') {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        data: { role },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;
    return data;
  },
};
