function sortByGenerationThenName(a, b) {
  const gA = a.generation ?? 9999;
  const gB = b.generation ?? 9999;
  if (gA !== gB) return gA - gB;
  return (a.full_name || '').localeCompare(b.full_name || '');
}

/** Parents in the approved member set */
export function getParentsInTree(member, memberIds) {
  const parents = [];
  if (member.father_id && memberIds.has(member.father_id)) parents.push(member.father_id);
  if (member.mother_id && memberIds.has(member.mother_id)) parents.push(member.mother_id);
  return parents;
}

/**
 * Root = no father_id/mother_id in DB, OR neither parent is in the approved set.
 */
export function isTreeRoot(member, memberIds) {
  if (!member.father_id && !member.mother_id) return true;
  return getParentsInTree(member, memberIds).length === 0;
}

/** Build parentId -> children[] from father_id / mother_id */
export function buildChildrenMap(members, memberIds) {
  const childrenMap = {};

  members.forEach(child => {
    getParentsInTree(child, memberIds).forEach(parentId => {
      if (!childrenMap[parentId]) childrenMap[parentId] = [];
      if (!childrenMap[parentId].some(c => c.id === child.id)) {
        childrenMap[parentId].push(child);
      }
    });
  });

  Object.values(childrenMap).forEach(list => list.sort(sortByGenerationThenName));
  return childrenMap;
}

/** Partners to show beside member (spouse_ids + co-parents from children) */
export function getDisplayPartners(member, children, allMembers, memberIds) {
  const partnerIds = new Set();

  (member.spouse_ids || []).forEach(id => {
    if (memberIds.has(id) && id !== member.id) partnerIds.add(id);
  });

  children.forEach(child => {
    if (child.father_id === member.id && child.mother_id && memberIds.has(child.mother_id)) {
      partnerIds.add(child.mother_id);
    }
    if (child.mother_id === member.id && child.father_id && memberIds.has(child.father_id)) {
      partnerIds.add(child.father_id);
    }
  });

  return [...partnerIds]
    .map(id => allMembers.find(m => m.id === id))
    .filter(Boolean)
    .sort(sortByGenerationThenName);
}

/** Group children under couple or single parent */
export function groupChildrenForMember(member, partners, children) {
  const groups = [];
  const assigned = new Set();

  partners.forEach(partner => {
    const shared = children.filter(child => {
      const f = child.father_id;
      const m = child.mother_id;
      return (
        (f === member.id && m === partner.id) ||
        (m === member.id && f === partner.id)
      );
    });
    if (shared.length > 0) {
      shared.forEach(c => assigned.add(c.id));
      groups.push({ partner, children: shared.sort(sortByGenerationThenName) });
    }
  });

  const solo = children.filter(c => !assigned.has(c.id)).sort(sortByGenerationThenName);
  if (solo.length > 0) {
    groups.push({ partner: null, children: solo });
  }

  return groups;
}

function shouldSkipRootAsSpouse(member, members, memberIds, childrenMap) {
  return members.some(other => {
    if (other.id === member.id || !isTreeRoot(other, memberIds)) return false;
    if (members.indexOf(other) >= members.indexOf(member)) return false;
    if ((other.spouse_ids || []).includes(member.id)) return true;
    const otherPartners = getDisplayPartners(other, childrenMap[other.id] || [], members, memberIds);
    return otherPartners.some(p => p.id === member.id);
  });
}

export function collectUnitChildren(member, partners, childrenMap) {
  const seen = new Set();
  const result = [];

  const addChild = (child) => {
    if (!child || seen.has(child.id)) return;
    seen.add(child.id);
    result.push(child);
  };

  (childrenMap[member.id] || []).forEach(addChild);
  partners.forEach(p => (childrenMap[p.id] || []).forEach(addChild));

  return result.sort(sortByGenerationThenName);
}

export function buildTreeData(members) {
  const memberIds = new Set(members.map(m => m.id));
  const childrenMap = buildChildrenMap(members, memberIds);

  const roots = members
    .filter(m => isTreeRoot(m, memberIds))
    .filter(m => !shouldSkipRootAsSpouse(m, members, memberIds, childrenMap))
    .sort(sortByGenerationThenName);

  return { roots, childrenMap, memberIds };
}
