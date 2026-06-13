/**
 * PandeyKul Relationship Engine
 *
 * Source of truth (Supabase stores):
 *   family_members — father_id, mother_id, gender, birth_order, approximate_birth_year
 *   relationships  — spouse (person_id, related_person_id)
 *
 * Every known link becomes a graph edge; missing father, mother, or spouse is ignored.
 * Partial data is valid — only father, only mother, or only spouse still enables path finding.
 *
 * Jobs:
 *   1. buildFamilyGraph(members, relationships) — build graph
 *   2. findRelationshipPath(person1Id, person2Id, graph) — BFS shortest path
 *   3. describeRelationship(path, person1, person2, members) — English + Nepali labels
 */

// ─── Labels ───────────────────────────────────────────────────────────────────

const LABELS = {
  father: { en: 'Father', np: 'बुबा / पिता' },
  mother: { en: 'Mother', np: 'आमा / माता' },
  parent: { en: 'Parent', np: 'अभिभावक' },
  son: { en: 'Son', np: 'छोरा' },
  daughter: { en: 'Daughter', np: 'छोरी' },
  child: { en: 'Child', np: 'सन्तान' },
  husband: { en: 'Husband', np: 'श्रीमान' },
  wife: { en: 'Wife', np: 'श्रीमती' },
  spouse: { en: 'Spouse', np: 'जीवनसाथी' },
  brother: { en: 'Brother', np: 'दाजु/भाइ' },
  sister: { en: 'Sister', np: 'दिदी/बहिनी' },
  sibling: { en: 'Sibling', np: 'दाजु/भाइ/दिदी/बहिनी' },
  grandfather: { en: 'Grandfather', np: 'हजुरबुबा' },
  grandmother: { en: 'Grandmother', np: 'हजुरआमा' },
  grandparent: { en: 'Grandparent', np: 'हजुरबुबा / हजुरआमा' },
  grandson: { en: 'Grandson', np: 'नाति' },
  granddaughter: { en: 'Granddaughter', np: 'नातिनी' },
  grandchild: { en: 'Grandchild', np: 'नाति / नातिनी' },
  paternalUncle: { en: 'Paternal Uncle', np: 'काका / ठूलोबुबा / सानोबुबा' },
  paternalAunt: { en: 'Paternal Aunt', np: 'फुपू' },
  maternalUncle: { en: 'Maternal Uncle', np: 'मामा' },
  maternalAunt: { en: 'Maternal Aunt', np: 'माइजू / ठूलीआमा / सानीआमा' },
  nephew: { en: 'Nephew', np: 'भतीजा / भन्जा' },
  niece: { en: 'Niece', np: 'भतीजी / भन्जी' },
  sisterInLaw: { en: 'Sister-in-law', np: 'साली / भाउजू / बुहारी / देउरानी' },
  brotherInLaw: { en: 'Brother-in-law', np: 'साला / जेठान / भिनाजु' },
  related: { en: 'Relative', np: 'नातेदार' },
};

const EDGE_EXPLANATION = {
  up_father: 'father',
  up_mother: 'mother',
  down_child: 'child',
  spouse: 'spouse of',
  sibling_male: 'brother of',
  sibling_female: 'sister of',
  sibling: 'sibling of',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMember(id, members) {
  return members.find(m => m.id === id) || null;
}

function memberName(member) {
  return member?.full_name || 'Unknown';
}

function isMale(member) {
  return member?.gender === 'male';
}

function isFemale(member) {
  return member?.gender === 'female';
}

function childLabel(member) {
  if (isMale(member)) return LABELS.son;
  if (isFemale(member)) return LABELS.daughter;
  return LABELS.child;
}

function parentLabel(member, edge) {
  if (edge === 'up_father') return LABELS.father;
  if (edge === 'up_mother') return LABELS.mother;
  if (isMale(member)) return LABELS.father;
  if (isFemale(member)) return LABELS.mother;
  return LABELS.parent;
}

function spouseLabel(target) {
  if (isMale(target)) return LABELS.husband;
  if (isFemale(target)) return LABELS.wife;
  return LABELS.spouse;
}

// ─── Age / birth order (lower order or earlier year = elder) ─────────────────

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

/** @returns {'a_older'|'b_older'|'same'|'unknown'} */
export function compareBirthOrder(personA, personB) {
  const sa = getSeniorityScore(personA);
  const sb = getSeniorityScore(personB);
  if (!sa || !sb) return 'unknown';
  if (sa.kind !== sb.kind) return 'unknown';
  if (sa.value < sb.value) return 'a_older';
  if (sa.value > sb.value) return 'b_older';
  return 'same';
}

function brotherLabel(subject, relative) {
  const cmp = compareBirthOrder(subject, relative);
  if (cmp === 'a_older') return { en: 'Elder Brother', np: 'दाजु' };
  if (cmp === 'b_older') return { en: 'Younger Brother', np: 'भाइ' };
  return LABELS.brother;
}

function sisterLabel(subject, relative) {
  const cmp = compareBirthOrder(subject, relative);
  if (cmp === 'a_older') return { en: 'Elder Sister', np: 'दिदी' };
  if (cmp === 'b_older') return { en: 'Younger Sister', np: 'बहिनी' };
  return LABELS.sister;
}

function paternalUncleLabel(uncle, father) {
  const cmp = compareBirthOrder(uncle, father);
  if (cmp === 'a_older') return { en: 'Elder Paternal Uncle', np: 'ठूलोबुबा' };
  if (cmp === 'b_older') return { en: 'Younger Paternal Uncle', np: 'काका / सानोबुबा' };
  return LABELS.paternalUncle;
}

function maternalAuntLabel(aunt, mother) {
  const cmp = compareBirthOrder(aunt, mother);
  if (cmp === 'a_older') return { en: 'Elder Maternal Aunt', np: 'ठूलीआमा' };
  if (cmp === 'b_older') return { en: 'Younger Maternal Aunt', np: 'सानीआमा / माइजू' };
  return LABELS.maternalAunt;
}

/** Wife's brother — जेठान (elder) vs साला (younger) */
function wifeBrotherLabel(wifeBrother, wife) {
  const cmp = compareBirthOrder(wifeBrother, wife);
  if (cmp === 'a_older') return { en: 'Elder Brother-in-law', np: 'जेठान' };
  if (cmp === 'b_older') return { en: 'Younger Brother-in-law', np: 'साला' };
  return { en: 'Brother-in-law', np: 'साला / जेठान' };
}

/** Brother's wife — जेठानी (elder brother's wife) vs देउरानी (younger brother's wife) */
function brotherWifeLabel(self, brother) {
  const cmp = compareBirthOrder(brother, self);
  if (cmp === 'a_older') return { en: 'Elder Sister-in-law', np: 'जेठानी' };
  if (cmp === 'b_older') return { en: 'Younger Sister-in-law', np: 'देउरानी' };
  return { en: 'Sister-in-law', np: 'भाउजू / बुहारी / देउरानी' };
}

function siblingLabel(target) {
  if (isMale(target)) return LABELS.brother;
  if (isFemale(target)) return LABELS.sister;
  return LABELS.sibling;
}

function nephewNieceLabel(member) {
  if (isMale(member)) return LABELS.nephew;
  if (isFemale(member)) return LABELS.niece;
  return { en: 'Nephew / Niece', np: 'भतीजा / भन्जा / भतीजी / भन्जी' };
}

function grandchildLabel(member) {
  if (isMale(member)) return LABELS.grandson;
  if (isFemale(member)) return LABELS.granddaughter;
  return LABELS.grandchild;
}

function grandparentLabel(member, edges) {
  const fatherHops = edges.filter(e => e === 'up_father').length;
  const motherHops = edges.filter(e => e === 'up_mother').length;
  if (fatherHops > 0 && motherHops === 0) return LABELS.grandfather;
  if (motherHops > 0 && fatherHops === 0) return LABELS.grandmother;
  if (isMale(member)) return LABELS.grandfather;
  if (isFemale(member)) return LABELS.grandmother;
  return LABELS.grandparent;
}

function sentence(personA, relation, personB) {
  return `${memberName(personA)} is the ${relation.en} of ${memberName(personB)}`;
}

function shareParent(m1, m2) {
  if (!m1 || !m2 || String(m1.id) === String(m2.id)) return false;
  const sameFather = m1.father_id && m2.father_id && String(m1.father_id) === String(m2.father_id);
  const sameMother = m1.mother_id && m2.mother_id && String(m1.mother_id) === String(m2.mother_id);
  return sameFather || sameMother;
}

function siblingRelationForward(p1, p2) {
  if (isMale(p2)) return brotherLabel(p1, p2);
  if (isFemale(p2)) return sisterLabel(p1, p2);
  return LABELS.sibling;
}

function siblingRelationReverse(p1, p2) {
  return siblingRelationForward(p2, p1);
}

function uncleAuntReverseLabel(uncleOrAunt, parent, side) {
  if (isMale(uncleOrAunt)) {
    return side === 'paternal' ? paternalUncleLabel(uncleOrAunt, parent) : LABELS.maternalUncle;
  }
  if (isFemale(uncleOrAunt)) {
    return side === 'paternal' ? LABELS.paternalAunt : maternalAuntLabel(uncleOrAunt, parent);
  }
  return side === 'paternal' ? LABELS.paternalUncle : LABELS.maternalAunt;
}

function siblingEdgeType(target) {
  if (isMale(target)) return 'sibling_male';
  if (isFemale(target)) return 'sibling_female';
  return 'sibling';
}

function addEdge(graph, fromId, toId, rel) {
  if (!fromId || !toId || String(fromId) === String(toId)) return;
  const from = String(fromId);
  if (!graph[from]) graph[from] = [];
  if (!graph[from].some(e => String(e.id) === String(toId) && e.rel === rel)) {
    graph[from].push({ id: toId, rel });
  }
}

// ─── 1. buildFamilyGraph ──────────────────────────────────────────────────────

/**
 * Build a directed family graph from members and spouse relationship rows.
 *
 * @param {Array} members - family_members with id, father_id, mother_id, gender
 * @param {Array} relationships - rows from relationships table
 * @returns {{ graph: Object, memberMap: Object, members: Array }}
 */
export function buildFamilyGraph(members, relationships = []) {
  const graph = {};
  const memberMap = Object.fromEntries((members || []).map(m => [m.id, m]));

  for (const m of members || []) {
    // Each parent link is independent — father-only or mother-only is valid
    if (m.father_id) {
      addEdge(graph, m.id, m.father_id, 'up_father');
      addEdge(graph, m.father_id, m.id, 'down_child');
    }
    if (m.mother_id) {
      addEdge(graph, m.id, m.mother_id, 'up_mother');
      addEdge(graph, m.mother_id, m.id, 'down_child');
    }
  }

  for (const row of relationships || []) {
    if (row.relationship_type !== 'spouse') continue;
    const personId = row.person_id ?? row.person_1_id;
    const relatedPersonId = row.related_person_id ?? row.person_2_id;
    if (!personId || !relatedPersonId) continue;
    addEdge(graph, personId, relatedPersonId, 'spouse');
    addEdge(graph, relatedPersonId, personId, 'spouse');
  }

  // Rule 1: same father_id or mother_id → siblings
  const memberList = members || [];
  for (let i = 0; i < memberList.length; i++) {
    for (let j = i + 1; j < memberList.length; j++) {
      const m1 = memberList[i];
      const m2 = memberList[j];
      if (!shareParent(m1, m2)) continue;
      addEdge(graph, m1.id, m2.id, siblingEdgeType(m2));
      addEdge(graph, m2.id, m1.id, siblingEdgeType(m1));
    }
  }

  const summary = summarizeFamilyGraph(graph, members);
  console.log('[relationshipEngine] graph built:', {
    parentEdges: {
      up_father: summary.edgesByType.up_father ?? 0,
      up_mother: summary.edgesByType.up_mother ?? 0,
      down_child: summary.edgesByType.down_child ?? 0,
    },
    spouseEdgesBidirectional: summary.spouseLinks,
    siblingEdgesDerived: summary.siblingLinks,
    membersWithFather: summary.membersWithFather,
    membersWithMother: summary.membersWithMother,
    ...summary,
  });

  return { graph, memberMap, members: members || [] };
}

/** Debug summary: edge counts by type + parent/spouse/sibling link checks */
export function summarizeFamilyGraph(graph, members = []) {
  const edgesByType = {};
  let parentLinks = 0;
  let spouseLinks = 0;
  let siblingLinks = 0;

  for (const edges of Object.values(graph || {})) {
    for (const e of edges) {
      edgesByType[e.rel] = (edgesByType[e.rel] || 0) + 1;
      if (e.rel === 'up_father' || e.rel === 'up_mother' || e.rel === 'down_child') parentLinks++;
      if (e.rel === 'spouse') spouseLinks++;
      if (e.rel.startsWith('sibling')) siblingLinks++;
    }
  }

  const membersWithFather = (members || []).filter(m => m.father_id).length;
  const membersWithMother = (members || []).filter(m => m.mother_id).length;

  return {
    nodeCount: Object.keys(graph || {}).length,
    edgesByType,
    parentLinks,
    spouseLinks,
    siblingLinks,
    membersWithFather,
    membersWithMother,
    memberCount: members.length,
  };
}

function toLegacyRel(edge) {
  if (edge?.startsWith('up_')) return 'up';
  if (edge === 'down_child') return 'down';
  if (edge?.startsWith('sibling')) return 'sibling';
  return edge;
}

export { toLegacyRel };

// ─── 2. findRelationshipPath ──────────────────────────────────────────────────

/**
 * BFS shortest path between two members.
 *
 * @returns {{ path: string[], edges: string[] } | null}
 */
export function findRelationshipPath(person1Id, person2Id, graph) {
  if (!person1Id || !person2Id) return null;
  const start = String(person1Id);
  const target = String(person2Id);
  if (start === target) return { path: [person1Id], edges: [] };

  const visited = new Set([start]);
  const queue = [{ node: start, path: [person1Id], edges: [] }];

  while (queue.length > 0) {
    const { node, path, edges } = queue.shift();

    for (const edge of graph[node] || []) {
      const nextId = String(edge.id);
      if (visited.has(nextId)) continue;

      const nextPath = [...path, edge.id];
      const nextEdges = [...edges, edge.rel];

      if (nextId === target) {
        return { path: nextPath, edges: nextEdges };
      }

      visited.add(nextId);
      queue.push({ node: nextId, path: nextPath, edges: nextEdges });
    }
  }

  return null;
}

// ─── 3. describeRelationship ──────────────────────────────────────────────────

export function buildPathExplanation(path, edges, members) {
  if (!path?.length) return '';
  if (path.length === 1) return memberName(getMember(path[0], members));

  const names = path.map(id => memberName(getMember(id, members)));
  let explanation = names[0];
  for (let i = 0; i < edges.length; i++) {
    const label = EDGE_EXPLANATION[edges[i]] || edges[i];
    explanation += ` → ${label} → ${names[i + 1]}`;
  }
  return explanation;
}

function resolveByPattern(edges, person1, person2, members, path) {
  const key = edges.join(',');
  const p1 = person1;
  const p2 = person2;

  const patterns = {
    up_father: () => ({
      forward: childLabel(p1),
      reverse: parentLabel(p2, 'up_father'),
    }),
    up_mother: () => ({
      forward: childLabel(p1),
      reverse: parentLabel(p2, 'up_mother'),
    }),
    down_child: () => ({
      forward: parentLabel(p1),
      reverse: childLabel(p2),
    }),
    spouse: () => ({
      forward: spouseLabel(p2),
      reverse: spouseLabel(p1),
    }),
    sibling_male: () => ({
      forward: brotherLabel(p1, p2),
      reverse: brotherLabel(p2, p1),
    }),
    sibling_female: () => ({
      forward: sisterLabel(p1, p2),
      reverse: sisterLabel(p2, p1),
    }),
    sibling: () => ({
      forward: siblingRelationForward(p1, p2),
      reverse: siblingRelationReverse(p1, p2),
    }),
    'up_father,down_child': () => ({
      forward: siblingRelationForward(p1, p2),
      reverse: siblingRelationReverse(p1, p2),
    }),
    'up_mother,down_child': () => ({
      forward: siblingRelationForward(p1, p2),
      reverse: siblingRelationReverse(p1, p2),
    }),
    'down_child,up_father': () => ({
      forward: siblingRelationForward(p1, p2),
      reverse: siblingRelationReverse(p1, p2),
    }),
    'down_child,up_mother': () => ({
      forward: siblingRelationForward(p1, p2),
      reverse: siblingRelationReverse(p1, p2),
    }),
    'up_father,up_father': () => ({
      forward: grandchildLabel(p1),
      reverse: LABELS.grandfather,
    }),
    'up_mother,up_mother': () => ({
      forward: grandchildLabel(p1),
      reverse: LABELS.grandmother,
    }),
    'up_father,sibling_male': () => {
      const father = getMember(path?.[1], members);
      return {
        forward: nephewNieceLabel(p1),
        reverse: uncleAuntReverseLabel(p2, father, 'paternal'),
      };
    },
    'up_father,sibling_female': () => {
      const father = getMember(path?.[1], members);
      return {
        forward: nephewNieceLabel(p1),
        reverse: uncleAuntReverseLabel(p2, father, 'paternal'),
      };
    },
    'up_mother,sibling_male': () => {
      const mother = getMember(path?.[1], members);
      return {
        forward: nephewNieceLabel(p1),
        reverse: uncleAuntReverseLabel(p2, mother, 'maternal'),
      };
    },
    'up_mother,sibling_female': () => {
      const mother = getMember(path?.[1], members);
      return {
        forward: nephewNieceLabel(p1),
        reverse: uncleAuntReverseLabel(p2, mother, 'maternal'),
      };
    },
    // Rule 5: male + wife's sister → person2 is साली
    'spouse,sibling_female': () => {
      if (isMale(p1)) {
        return {
          forward: { en: 'Brother-in-law', np: 'भिनाजु' },
          reverse: { en: 'Sister-in-law', np: 'साली' },
        };
      }
      if (isFemale(p1)) {
        return {
          forward: { en: 'Sister-in-law', np: 'साली / भाउजू' },
          reverse: { en: 'Sister-in-law', np: 'साली / भाउजू' },
        };
      }
      return { forward: LABELS.sisterInLaw, reverse: LABELS.brotherInLaw };
    },
    // Rule 4: female + sister's husband → person2 is भिनाजु
    'sibling_female,spouse': () => {
      if (isFemale(p1)) {
        return {
          forward: { en: 'Sister-in-law', np: 'साली' },
          reverse: { en: 'Brother-in-law', np: 'भिनाजु' },
        };
      }
      return {
        forward: { en: 'Brother-in-law', np: 'भिनाजु / जेठान / साला' },
        reverse: LABELS.sisterInLaw,
      };
    },
    'spouse,sibling_male': () => {
      const spouse = getMember(path?.[1], members);
      if (isMale(p1)) {
        return {
          forward: wifeBrotherLabel(p2, spouse),
          reverse: { en: 'Sister-in-law', np: 'साली' },
        };
      }
      return { forward: LABELS.brotherInLaw, reverse: LABELS.sisterInLaw };
    },
    'sibling_male,spouse': () => {
      const brother = getMember(path?.[1], members);
      return {
        forward: brotherWifeLabel(p1, brother),
        reverse: isMale(p1) ? wifeBrotherLabel(p2, p1) : LABELS.sisterInLaw,
      };
    },
    // Uncle/aunt → nephew/niece (parent's sibling, then down to child)
    'sibling_male,down_child': () => {
      const parent = getMember(path?.[1], members);
      const side = isMale(parent) ? 'paternal' : 'maternal';
      return {
        forward: uncleAuntReverseLabel(p1, parent, side),
        reverse: nephewNieceLabel(p2),
      };
    },
    'sibling_female,down_child': () => {
      const parent = getMember(path?.[1], members);
      const side = isMale(parent) ? 'paternal' : 'maternal';
      return {
        forward: uncleAuntReverseLabel(p1, parent, side),
        reverse: nephewNieceLabel(p2),
      };
    },
  };

  if (patterns[key]) return patterns[key]();

  if (edges.length === 2 && edges[0] === 'up_father' && edges[1] === 'up_mother') {
    return { forward: grandchildLabel(p1), reverse: LABELS.grandmother };
  }
  if (edges.length === 2 && edges[0] === 'up_mother' && edges[1] === 'up_father') {
    return { forward: grandchildLabel(p1), reverse: LABELS.grandfather };
  }

  const upOnly = edges.every(e => e === 'up_father' || e === 'up_mother');
  if (upOnly && edges.length > 1) {
    return {
      forward: grandchildLabel(p1),
      reverse: grandparentLabel(p2, edges),
    };
  }

  const downOnly = edges.every(e => e === 'down_child');
  if (downOnly && edges.length > 1) {
    return {
      forward: grandparentLabel(p1, edges.map(() => 'up_father')),
      reverse: grandchildLabel(p2),
    };
  }

  return null;
}

function resolveFallback(edges, person1, person2) {
  const parts = edges.map(edge => {
    if (edge === 'up_father') return 'father';
    if (edge === 'up_mother') return 'mother';
    if (edge === 'down_child') return 'child';
    if (edge === 'spouse') return 'spouse';
    if (edge === 'sibling_male') return 'brother';
    if (edge === 'sibling_female') return 'sister';
    return 'relative';
  });

  const en = parts.join("'s ");
  const np = parts.map(p => EDGE_EXPLANATION[p === 'child' ? 'down_child' : p] || p).join(' → ');

  return {
    forward: { en: `Relative (${en})`, np },
    reverse: LABELS.related,
  };
}

/**
 * Convert a path into English/Nepali relationship descriptions.
 *
 * @param {{ path: string[], edges: string[] }} pathResult
 * @param {Object} person1
 * @param {Object} person2
 * @param {Array} members
 * @returns {{ found: boolean, english: string, nepali: string, reverseEnglish: string, reverseNepali: string, pathExplanation: string }}
 */
export function describeRelationship(pathResult, person1, person2, members) {
  if (!pathResult || !person1 || !person2) {
    return { found: false, message: 'No relationship path found' };
  }

  const { path, edges } = pathResult;

  if (path.length === 1) {
    return {
      found: true,
      english: `${memberName(person1)} is the same person as ${memberName(person2)}`,
      nepali: 'एउटै व्यक्ति',
      reverseEnglish: `${memberName(person2)} is the same person as ${memberName(person1)}`,
      reverseNepali: 'एउटै व्यक्ति',
      pathExplanation: memberName(person1),
    };
  }

  const resolved = resolveByPattern(edges, person1, person2, members, path)
    || resolveFallback(edges, person1, person2);

  const pathExplanation = buildPathExplanation(path, edges, members);

  return {
    found: true,
    english: sentence(person1, resolved.forward, person2),
    nepali: resolved.forward.np,
    reverseEnglish: sentence(person2, resolved.reverse, person1),
    reverseNepali: resolved.reverse.np,
    pathExplanation,
  };
}

// ─── Convenience: full lookup ─────────────────────────────────────────────────

/**
 * Build graph, find path, and describe — single entry point for callers.
 */
export function getRelationship(person1Id, person2Id, members, relationships = []) {
  const { graph } = buildFamilyGraph(members, relationships);
  const pathResult = findRelationshipPath(person1Id, person2Id, graph);

  if (!pathResult) {
    return { found: false, message: 'No relationship path found' };
  }

  const person1 = getMember(person1Id, members);
  const person2 = getMember(person2Id, members);

  return describeRelationship(pathResult, person1, person2, members);
}

// ─── Legacy exports (UI not migrated yet) ─────────────────────────────────────

export function getParentIds(member) {
  if (!member) return [];
  return [...new Set([
    member.father_id,
    member.mother_id,
    ...(member.parent_ids || []),
  ].filter(Boolean))];
}

/** @deprecated Prefer buildFamilyGraph */
export function buildGraph(members) {
  const { graph } = buildFamilyGraph(members, []);
  const legacy = {};
  for (const [nodeId, edges] of Object.entries(graph)) {
    legacy[nodeId] = edges.map(e => ({
      id: e.id,
      rel: e.rel.startsWith('up_') ? 'up' : e.rel === 'down_child' ? 'down' : e.rel.startsWith('sibling') ? 'sibling' : e.rel,
      weight: e.rel === 'spouse' ? 2 : 1,
    }));
  }
  return legacy;
}

/** @deprecated Prefer findRelationshipPath */
export function findPath(graph, id1, id2) {
  const pathResult = findRelationshipPath(id1, id2, graph);
  if (!pathResult) return null;
  return {
    path: pathResult.path,
    rels: pathResult.edges.map(e =>
      e.startsWith('up_') ? 'up' : e === 'down_child' ? 'down' : e.startsWith('sibling') ? 'sibling' : e
    ),
    weight: pathResult.edges.length,
  };
}

/** @deprecated Prefer describeRelationship / getRelationship */
export function calculateRelationship(rels, g1, g2, path, members) {
  const p1Id = path?.[0];
  const p2Id = path?.[path.length - 1];
  const person1 = getMember(p1Id, members) || { id: p1Id, gender: g1 };
  const person2 = getMember(p2Id, members) || { id: p2Id, gender: g2 };

  const edges = (rels || []).map(r => {
    if (r === 'up') return 'up_father';
    if (r === 'down') return 'down_child';
    if (r === 'sibling') return 'sibling';
    return r;
  });

  const result = describeRelationship({ path, edges }, person1, person2, members);
  if (!result.found) return { en: 'related', np: 'सम्बन्धित' };

  const title = result.english.split(' is the ')[1]?.split(' of ')[0] || 'related';
  return { en: title.toLowerCase(), np: result.nepali };
}

export function findLCA(members, idA, idB) {
  if (idA === idB) return { ancestor: idA, upA: 0, upB: 0 };

  function sortedParents(m) {
    return getParentIds(m).slice().sort((a, b) => {
      const aM = getMember(a, members);
      const bM = getMember(b, members);
      if (aM?.gender === 'male' && bM?.gender !== 'male') return -1;
      if (bM?.gender === 'male' && aM?.gender !== 'male') return 1;
      return 0;
    });
  }

  const ancestorsA = new Map();
  const qA = [{ id: idA, depth: 0 }];
  const visitedA = new Set();

  while (qA.length > 0) {
    const { id, depth } = qA.shift();
    if (visitedA.has(id)) continue;
    visitedA.add(id);
    ancestorsA.set(id, depth);
    for (const pid of sortedParents(getMember(id, members))) {
      if (!visitedA.has(pid)) qA.push({ id: pid, depth: depth + 1 });
    }
  }

  let best = null;
  const qB = [{ id: idB, depth: 0 }];
  const visitedB = new Set();

  while (qB.length > 0) {
    const { id, depth } = qB.shift();
    if (visitedB.has(id)) continue;
    visitedB.add(id);
    if (ancestorsA.has(id)) {
      const upA = ancestorsA.get(id);
      const totalDist = upA + depth;
      if (!best || totalDist < best.totalDist) {
        best = { ancestor: id, upA, upB: depth, totalDist };
      }
    }
    for (const pid of sortedParents(getMember(id, members))) {
      if (!visitedB.has(pid)) qB.push({ id: pid, depth: depth + 1 });
    }
  }

  return best || null;
}
