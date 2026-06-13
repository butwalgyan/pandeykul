import { supabase } from '@/lib/supabaseClient';

const SORT_COLUMN_ALIASES = {
  created_date: 'created_at',
  updated_date: 'updated_at',
  submitted_at: 'created_at',
  last_access_time: 'created_at',
  date: 'created_at',
};

function normalizeSortColumn(column) {
  return SORT_COLUMN_ALIASES[column] || column;
}

function parseSort(sort) {
  if (!sort) return { column: 'created_at', ascending: false };

  const descending = sort.startsWith('-');
  const raw = descending ? sort.slice(1) : sort;

  return {
    column: normalizeSortColumn(raw),
    ascending: !descending,
  };
}

function logSupabaseError(operation, tableName, error) {
  console.error(`[Supabase] ${operation} failed on "${tableName}":`, {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
  });
}

function cleanRecord(record) {
  const result = { ...record };
  delete result.created_date;
  delete result.updated_date;
  return result;
}

export function createEntityService(tableName) {
  const handleError = (operation, error) => {
    logSupabaseError(operation, tableName, error);
    throw error;
  };

  return {
    async list(sort = '-created_at', limit = 100) {
      const { column, ascending } = parseSort(sort);

      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order(column, { ascending })
        .limit(limit);

      if (error) handleError('list', error);
      return data || [];
    },

    async get(id) {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('id', id)
        .single();

      if (error) handleError('get', error);
      return data;
    },

    async filter(filters = {}, sort = '-created_at', limit = 100) {
      const { column, ascending } = parseSort(sort);

      let query = supabase.from(tableName).select('*');

      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      const { data, error } = await query
        .order(column, { ascending })
        .limit(limit);

      if (error) handleError('filter', error);
      return data || [];
    },

    async create(record) {
      const { data, error } = await supabase
        .from(tableName)
        .insert(cleanRecord(record))
        .select()
        .single();

      if (error) handleError('create', error);
      return data;
    },

    async update(id, updates) {
      const { data, error } = await supabase
        .from(tableName)
        .update(cleanRecord(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) handleError('update', error);
      return data;
    },

    async delete(id) {
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) handleError('delete', error);
      return true;
    },
  };
}
