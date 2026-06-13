import { supabase } from '@/lib/supabaseClient';
import { createEntityService } from '@/services/entityService';

const base = createEntityService('relationships');

/** Read person_id / related_person_id (supports legacy person_1_id / person_2_id rows). */
export function getRelationshipEndpoints(row) {
  if (!row) return { personId: null, relatedPersonId: null };
  return {
    personId: row.person_id ?? row.person_1_id ?? null,
    relatedPersonId: row.related_person_id ?? row.person_2_id ?? null,
  };
}

export const relationshipService = {
  list: base.list,
  get: base.get,
  filter: base.filter,
  update: base.update,
  delete: base.delete,

  async listSpouseRelationships(limit = 500) {
    return base.filter({ relationship_type: 'spouse' }, '-created_at', limit);
  },

  /**
   * Insert spouse link: person_id → related_person_id.
   * Spouse is treated as bidirectional when reading (no reverse row required).
   */
  async createSpouseLinks(memberId, spouseIds) {
    const ids = [...new Set((spouseIds || []).filter(id => id && id !== memberId))];
    if (!memberId || ids.length === 0) return [];

    const rows = ids.map(spouseId => ({
      person_id: memberId,
      related_person_id: spouseId,
      relationship_type: 'spouse',
    }));

    console.log('[relationships] insert spouse rows:', rows);

    const { data, error } = await supabase
      .from('relationships')
      .insert(rows)
      .select();

    if (error) {
      console.error('[relationships] spouse insert failed:', error);
      throw error;
    }

    return data || [];
  },

  /** Merge spouse_ids from relationships table onto member records (bidirectional read). */
  attachSpouseIds(members, relationships) {
    const spouseMap = {};

    (relationships || []).forEach(r => {
      if (r.relationship_type !== 'spouse') return;
      const { personId, relatedPersonId } = getRelationshipEndpoints(r);
      if (!personId || !relatedPersonId) return;
      if (!spouseMap[personId]) spouseMap[personId] = new Set();
      if (!spouseMap[relatedPersonId]) spouseMap[relatedPersonId] = new Set();
      spouseMap[personId].add(relatedPersonId);
      spouseMap[relatedPersonId].add(personId);
    });

    return members.map(m => {
      const fromRels = spouseMap[m.id] ? [...spouseMap[m.id]] : [];
      const merged = [...new Set([...(m.spouse_ids || []), ...fromRels])];
      return { ...m, spouse_ids: merged };
    });
  },
};
