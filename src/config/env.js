const env = import.meta.env;

export const config = {
  app: {
    name: env.VITE_APP_NAME || 'पाण्डे वंशावली',
    title: env.VITE_APP_TITLE || 'Pandey Family Heritage',
    url: env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : ''),
  },
  supabase: {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY,
    storageBucket: env.VITE_SUPABASE_STORAGE_BUCKET || 'uploads',
  },
  api: {
    functionsUrl: env.VITE_FUNCTIONS_URL || '',
  },
  features: {
    enableLlm: env.VITE_ENABLE_LLM !== 'false',
    enableEmail: env.VITE_ENABLE_EMAIL !== 'false',
  },
};

export function validateEnv() {
  const missing = [];

  if (!config.supabase.url) missing.push('VITE_SUPABASE_URL');
  if (!config.supabase.anonKey) missing.push('VITE_SUPABASE_ANON_KEY');

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(', ')}`);
  }

  return missing;
}
