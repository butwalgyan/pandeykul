import { supabase } from '@/lib/supabaseClient';
import { config } from '@/config/env';

export const storageService = {
  async uploadFile(file, folder = 'files') {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${folder}/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from(config.supabase.storageBucket)
      .upload(path, file, { upsert: false });

    if (error) throw error;

    const { data } = supabase.storage
      .from(config.supabase.storageBucket)
      .getPublicUrl(path);

    return { file_url: data.publicUrl };
  },
};
