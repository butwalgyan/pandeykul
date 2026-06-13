import { GitMerge, ArrowRight } from "lucide-react";
import { findLCA } from "@/lib/relationshipEngine";

function getMember(id, members) {
  return members.find(m => m.id === id);
}
function getName(id, members) {
  return getMember(id, members)?.full_name || "Unknown";
}

// Walk from personId up to ancestorId, returning the list of IDs in order
function getLineage(personId, ancestorId, members) {
  if (personId === ancestorId) return [personId];

  const visited = new Set();
  const queue = [{ id: personId, path: [personId] }];

  while (queue.length > 0) {
    const { id, path } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const m = getMember(id, members);
    for (const pid of (m?.parent_ids || [])) {
      const newPath = [...path, pid];
      if (pid === ancestorId) return newPath;
      if (!visited.has(pid)) queue.push({ id: pid, path: newPath });
    }
  }
  return null;
}

// Get the step label going UP (child → parent)
function stepLabel(fromId, toId, members) {
  const to = getMember(toId, members);
  if (!to) return "ancestor";
  const g = to.gender;
  if (g === "male") return "father";
  if (g === "female") return "mother";
  return "parent";
}

export default function CommonAncestorSection({ members, person1Id, person2Id }) {
  const p1Name = getName(person1Id, members);
  const p2Name = getName(person2Id, members);

  const lca = findLCA(members, person1Id, person2Id);

  if (!lca || lca.ancestor === person1Id || lca.ancestor === person2Id) {
    // Direct ancestor/descendant — no need for common ancestor section, or no result
    if (!lca) {
      return (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <GitMerge className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Common Ancestor</p>
          </div>
          <p className="text-sm text-muted-foreground">No common ancestor found in the current records.</p>
        </div>
      );
    }
    return null; // Direct ancestor — skip section
  }

  const ancestorName = getName(lca.ancestor, members);
  const line1 = getLineage(person1Id, lca.ancestor, members);
  const line2 = getLineage(person2Id, lca.ancestor, members);

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-4">
      <div className="flex items-center gap-2">
        <GitMerge className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Common Ancestor</p>
      </div>

      {/* Ancestor badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Nearest common ancestor:</span>
        <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-1 rounded-full">
          {ancestorName}
        </span>
      </div>

      {/* Lines */}
      <div className="space-y-3">
        {/* Person 1 line */}
        {line1 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{p1Name}'s line:</p>
            <div className="flex flex-wrap items-center gap-1">
              {line1.map((id, i) => {
                const isLast = i === line1.length - 1;
                const label = !isLast ? stepLabel(id, line1[i + 1], members) : null;
                const m = getMember(id, members);
                return (
                  <span key={id} className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${isLast ? "bg-primary/15 text-primary" : "bg-accent text-foreground"}`}>
                      {getName(id, members)}
                    </span>
                    {label && (
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-[10px]">{label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Person 2 line */}
        {line2 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1.5">{p2Name}'s line:</p>
            <div className="flex flex-wrap items-center gap-1">
              {line2.map((id, i) => {
                const isLast = i === line2.length - 1;
                const label = !isLast ? stepLabel(id, line2[i + 1], members) : null;
                return (
                  <span key={id} className="flex items-center gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-md font-medium ${isLast ? "bg-primary/15 text-primary" : "bg-accent text-foreground"}`}>
                      {getName(id, members)}
                    </span>
                    {label && (
                      <span className="flex items-center gap-0.5 text-muted-foreground">
                        <ArrowRight className="w-3 h-3" />
                        <span className="text-[10px]">{label}</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}