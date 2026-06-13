/** Child label from gender */
export function childLabel(gender) {
  if (gender === 'male') return { en: 'Son', np: 'छोरा' };
  if (gender === 'female') return { en: 'Daughter', np: 'छोरी' };
  return { en: 'Child', np: 'सन्तान' };
}

const FATHER = { en: 'Father', np: 'बुबा / पिता' };
const MOTHER = { en: 'Mother', np: 'आमा / माता' };
const PARENT = { en: 'Parent', np: 'अभिभावक' };

/** Normalize UUIDs for reliable comparison */
function sameId(a, b) {
  if (a == null || b == null) return false;
  return String(a) === String(b);
}

/**
 * Direct parent-child check using father_id / mother_id.
 * Only father, only mother, or both — each known link is used independently.
 */
export function findDirectRelationship(person1, person2) {
  if (!person1 || !person2 || sameId(person1.id, person2.id)) return null;

  // person1 is parent of person2
  if (sameId(person2.father_id, person1.id)) {
    const reverse = childLabel(person2.gender);
    return {
      direct: true,
      forward: FATHER,
      reverse,
      path: [person1.id, person2.id],
      rels: ['down'],
      confidence: 'high',
    };
  }

  if (sameId(person2.mother_id, person1.id)) {
    const reverse = childLabel(person2.gender);
    return {
      direct: true,
      forward: MOTHER,
      reverse,
      path: [person1.id, person2.id],
      rels: ['down'],
      confidence: 'high',
    };
  }

  // person1 is child of person2
  if (sameId(person1.father_id, person2.id)) {
    const forward = childLabel(person1.gender);
    return {
      direct: true,
      forward,
      reverse: FATHER,
      path: [person2.id, person1.id],
      rels: ['down'],
      confidence: 'high',
    };
  }

  if (sameId(person1.mother_id, person2.id)) {
    const forward = childLabel(person1.gender);
    return {
      direct: true,
      forward,
      reverse: MOTHER,
      path: [person2.id, person1.id],
      rels: ['down'],
      confidence: 'high',
    };
  }

  return null;
}

function spouseLabel(member) {
  if (member?.gender === 'male') return { en: 'Husband', np: 'श्रीमान' };
  if (member?.gender === 'female') return { en: 'Wife', np: 'श्रीमती' };
  return { en: 'Spouse', np: 'जीवनसाथी' };
}

/** Direct spouse check from relationships table (bidirectional). */
export function findDirectSpouse(person1, person2, relationships = []) {
  if (!person1 || !person2 || sameId(person1.id, person2.id)) return null;

  for (const row of relationships) {
    if (row.relationship_type !== 'spouse') continue;
    const personId = row.person_id ?? row.person_1_id;
    const relatedPersonId = row.related_person_id ?? row.person_2_id;
    const linked =
      (sameId(personId, person1.id) && sameId(relatedPersonId, person2.id))
      || (sameId(personId, person2.id) && sameId(relatedPersonId, person1.id));
    if (!linked) continue;

    return {
      direct: true,
      forward: spouseLabel(person2),
      reverse: spouseLabel(person1),
      path: [person1.id, person2.id],
      rels: ['spouse'],
      confidence: 'high',
    };
  }
  return null;
}

export function formatPersonName(member) {
  if (!member) return 'Unknown';
  return member.full_name || 'Unknown';
}

export function formatPersonDisplay(member) {
  const en = formatPersonName(member);
  if (member?.nepali_name) {
    return { en, np: member.nepali_name };
  }
  return { en, np: null };
}
