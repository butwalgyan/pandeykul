import { useState } from "react";
import { AlertCircle, Info, GitBranch, ArrowRight, MessageSquarePlus, GitMerge, Users, Milestone, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/lib/AuthContext';
import { findLCA, getParentIds } from "@/lib/relationshipEngine";
import { formatPersonDisplay } from "@/lib/directRelationship";
import SuggestCorrectionDialog from "./SuggestCorrectionDialog";

function getMember(id, members) {
  return members.find(m => String(m.id) === String(id));
}
function getName(id, members) {
  return getMember(id, members)?.full_name || "Unknown";
}

function edgeLabel(rel, toId, members) {
  const to = getMember(toId, members);
  const g = to?.gender;
  if (rel === "up") return g === "male" ? { en: "father", np: "बुबा" } : g === "female" ? { en: "mother", np: "आमा" } : { en: "parent", np: "अभिभावक" };
  if (rel === "down") return g === "male" ? { en: "son", np: "छोरा" } : g === "female" ? { en: "daughter", np: "छोरी" } : { en: "child", np: "सन्तान" };
  if (rel === "spouse") return g === "male" ? { en: "husband", np: "श्रीमान" } : g === "female" ? { en: "wife", np: "श्रीमती" } : { en: "spouse", np: "जीवनसाथी" };
  if (rel === "sibling") return g === "male" ? { en: "brother", np: "दाजु/भाइ" } : g === "female" ? { en: "sister", np: "दिदी/बहिनी" } : { en: "sibling", np: "दाजु/भाइ / दिदी/बहिनी" };
  return { en: rel, np: rel };
}

// BFS walk up from personId to ancestorId, returns ordered list of IDs
function getLineage(personId, ancestorId, members) {
  if (personId === ancestorId) return [personId];
  const visited = new Set();
  const queue = [{ id: personId, path: [personId] }];
  while (queue.length > 0) {
    const { id, path } = queue.shift();
    if (visited.has(id)) continue;
    visited.add(id);
    const m = getMember(id, members);
    for (const pid of getParentIds(m)) {
      const newPath = [...path, pid];
      if (pid === ancestorId) return newPath;
      if (!visited.has(pid)) queue.push({ id: pid, path: newPath });
    }
  }
  return null;
}

function stepLabel(fromId, toId, members) {
  const to = getMember(toId, members);
  if (!to) return "ancestor";
  if (to.gender === "male") return "father";
  if (to.gender === "female") return "mother";
  return "parent";
}

function buildPlainSteps(path, rels, members) {
  if (!path || path.length < 2) return [];
  return rels.map((rel, i) => {
    const fromName = getName(path[i], members);
    const to = getMember(path[i + 1], members);
    const toName = getName(path[i + 1], members);
    const g = to?.gender;
    if (rel === "spouse") {
      return { sentence: g === "male" ? `${fromName} is the wife of ${toName}` : g === "female" ? `${fromName} is the husband of ${toName}` : `${fromName} is the spouse of ${toName}`, rel };
    } else if (rel === "up") {
      return { sentence: g === "male" ? `${toName} is the father of ${fromName}` : g === "female" ? `${toName} is the mother of ${fromName}` : `${toName} is the parent of ${fromName}`, rel };
    } else if (rel === "down") {
      return { sentence: g === "male" ? `${toName} is the son of ${fromName}` : g === "female" ? `${toName} is the daughter of ${fromName}` : `${toName} is the child of ${fromName}`, rel };
    } else if (rel === "sibling") {
      return { sentence: g === "male" ? `${toName} is the brother of ${fromName}` : g === "female" ? `${toName} is the sister of ${fromName}` : `${toName} is the sibling of ${fromName}`, rel };
    }
    return null;
  }).filter(Boolean);
}

// Renders a lineage path as inline chips with arrows
function LineagePath({ line, members, ancestorId }) {
  if (!line || line.length === 0) return <p className="text-sm text-muted-foreground italic">Path not found</p>;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {line.map((id, i) => {
        const isLast = i === line.length - 1;
        const label = !isLast ? stepLabel(id, line[i + 1], members) : null;
        return (
          <span key={id} className="flex items-center gap-1">
            <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${isLast ? "bg-primary/10 text-primary border-primary/30" : "bg-accent text-foreground border-border"}`}>
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
  );
}

export default function RelationshipResult({ result, members, person1Id, person2Id, user }) {
  const { navigateToLogin } = useAuth();
  const [showCorrection, setShowCorrection] = useState(false);
  const p1 = getMember(person1Id, members);
  const p2 = getMember(person2Id, members);
  const p1Display = formatPersonDisplay(p1);
  const p2Display = formatPersonDisplay(p2);
  const p1Name = p1Display.en;
  const p2Name = p2Display.en;

  if (result.notFound) {
    return (
      <div className="flex items-start gap-3 p-4 bg-muted border border-border rounded-xl text-sm text-muted-foreground">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
        <div>
          <p className="font-medium text-foreground mb-1">No relationship path found</p>
          <p>{result.en}</p>
          <p className="mt-1 text-xs">Tip: Suggest a relationship below if you know how they are connected.</p>
        </div>
      </div>
    );
  }

  if (result.error || result.isSame) {
    return (
      <div className="p-4 bg-muted border border-border rounded-xl text-sm text-center text-muted-foreground">
        {result.isSame ? "Same person selected." : result.en}
      </div>
    );
  }

  // Compute common ancestor & lineages
  const lca = findLCA(members, person1Id, person2Id);
  const isDirect = lca && (lca.ancestor === person1Id || lca.ancestor === person2Id);
  const ancestorName = lca && !isDirect ? getName(lca.ancestor, members) : null;
  const line1 = lca && !isDirect ? getLineage(person1Id, lca.ancestor, members) : null;
  const line2 = lca && !isDirect ? getLineage(person2Id, lca.ancestor, members) : null;

  const steps = buildPlainSteps(result.path, result.rels, members);

  const sectionHeader = (icon, label) => (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <p className="text-sm font-semibold text-foreground">{label}</p>
    </div>
  );

  const PersonNameBlock = ({ display }) => (
    <span className="inline-flex flex-col">
      <span>{display.en}</span>
      {display.np && (
        <span className="text-xs text-muted-foreground font-normal">{display.np}</span>
      )}
    </span>
  );

  return (
    <div className="space-y-4">

      {/* Calculated relationship (always shown when found) */}
      {!result.direct && result.en && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
          <div>
            <p className="font-heading font-semibold text-base text-foreground leading-snug">{result.en}</p>
            <p className="text-sm text-primary mt-1.5">
              नेपाली सम्बन्ध: <span className="font-semibold">{result.np}</span>
            </p>
          </div>
          {result.reverse_en && (
            <div className="border-t border-primary/15 pt-4">
              <p className="font-heading font-semibold text-base text-foreground leading-snug">{result.reverse_en}</p>
              <p className="text-sm text-primary mt-1.5">
                नेपाली सम्बन्ध: <span className="font-semibold">{result.reverse_np}</span>
              </p>
            </div>
          )}
          {result.pathExplanation && (
            <div className="border-t border-primary/15 pt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Path explanation</p>
              <p className="text-sm text-foreground leading-snug">{result.pathExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Direct parent-child relationship */}
      {result.direct && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-4">
          <div>
            <p className="font-heading font-semibold text-base text-foreground leading-snug">
              <PersonNameBlock display={p1Display} /> is the {result.forward?.en || result.en} of{" "}
              <PersonNameBlock display={p2Display} />
            </p>
            <p className="text-sm text-primary mt-1.5">
              नेपाली सम्बन्ध: <span className="font-semibold">{result.forward?.np || result.np}</span>
            </p>
          </div>
          <div className="border-t border-primary/15 pt-4">
            <p className="font-heading font-semibold text-base text-foreground leading-snug">
              <PersonNameBlock display={p2Display} /> is the {result.reverse?.en || result.reverse_en} of{" "}
              <PersonNameBlock display={p1Display} />
            </p>
            <p className="text-sm text-primary mt-1.5">
              नेपाली सम्बन्ध: <span className="font-semibold">{result.reverse?.np || result.reverse_np}</span>
            </p>
          </div>
          {result.pathExplanation && (
            <div className="border-t border-primary/15 pt-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Path explanation</p>
              <p className="text-sm text-foreground leading-snug">{result.pathExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* 1. Common Ancestor */}
      <div className="bg-card border border-border rounded-xl p-4">
        {sectionHeader(<GitMerge className="w-4 h-4 text-primary" />, "Common Ancestor")}
        {lca && !isDirect ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Nearest shared ancestor:</span>
            <span className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full border border-primary/20">
              {ancestorName}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {isDirect
              ? "One person is a direct ancestor of the other — no shared lateral ancestor."
              : "No common ancestor found in the current records."}
          </p>
        )}
      </div>

      {/* 2 & 3. Lineage lines (only when lateral common ancestor exists) */}
      {lca && !isDirect && (
        <>
          <div className="bg-card border border-border rounded-xl p-4">
            {sectionHeader(<Users className="w-4 h-4 text-primary" />, `${p1Name}'s Family Line`)}
            <LineagePath line={line1} members={members} ancestorId={lca.ancestor} />
          </div>

          <div className="bg-card border border-border rounded-xl p-4">
            {sectionHeader(<Users className="w-4 h-4 text-primary" />, `${p2Name}'s Family Line`)}
            <LineagePath line={line2} members={members} ancestorId={lca.ancestor} />
          </div>
        </>
      )}

      {/* 4. Generation Distance */}
      {lca && !isDirect && (
        <div className="bg-card border border-border rounded-xl p-4">
          {sectionHeader(<Milestone className="w-4 h-4 text-primary" />, "Generation Distance")}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
              <span className="text-muted-foreground">{p1Name} is</span>
              <span className="font-semibold text-foreground">{lca.upA} generation{lca.upA !== 1 ? "s" : ""}</span>
              <span className="text-muted-foreground">from {ancestorName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary/40 shrink-0" />
              <span className="text-muted-foreground">{p2Name} is</span>
              <span className="font-semibold text-foreground">{lca.upB} generation{lca.upB !== 1 ? "s" : ""}</span>
              <span className="text-muted-foreground">from {ancestorName}</span>
            </div>
          </div>
        </div>
      )}

      {/* 5. Relationship Status */}
      <div className="bg-card border border-border rounded-xl p-4">
        {sectionHeader(<ShieldQuestion className="w-4 h-4 text-primary" />, "Relationship Status")}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Relationship title not verified yet
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Relationship titles are only shown when manually verified by an admin. You can suggest the correct title below.
        </p>
      </div>

      {/* 6. Family Route — connection path steps */}
      {steps.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-4">
          {sectionHeader(<GitBranch className="w-4 h-4 text-primary" />, "Family Route")}
          <ol className="space-y-2 mb-4">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">{i + 1}</span>
                <span className="text-foreground leading-snug">
                  {step.rel === "spouse"
                    ? <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5 mb-0.5" />
                    : <span className="inline-block w-2 h-2 rounded-full bg-primary/40 mr-1.5 mb-0.5" />
                  }
                  {step.sentence}
                </span>
              </li>
            ))}
          </ol>

          {/* Visual arrow path */}
          {result.path && result.path.length > 1 && (
            <div className="pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">Visual path</p>
              <div className="flex flex-wrap items-center gap-1.5">
                {result.path.map((id, i) => {
                  const m = getMember(id, members);
                  const rel = result.rels?.[i];
                  const edge = i < result.path.length - 1 ? edgeLabel(rel, result.path[i + 1], members) : null;
                  return (
                    <span key={`${id}-${i}`} className="flex items-center gap-1.5">
                      <span className="flex items-center gap-1.5 bg-accent border border-border rounded-lg px-2.5 py-1.5">
                        {m?.profile_photo
                          ? <img src={m.profile_photo} className="w-5 h-5 rounded-full object-cover" alt="" />
                          : <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">{m?.full_name?.[0]}</div>
                        }
                        <span className="text-xs font-medium">{getName(id, members)}</span>
                        {m?.gender && (
                          <span className={`text-[8px] rounded px-1 font-semibold ${m.gender === "male" ? "bg-blue-100 text-blue-700" : m.gender === "female" ? "bg-pink-100 text-pink-700" : "bg-muted text-muted-foreground"}`}>
                            {m.gender === "male" ? "M" : m.gender === "female" ? "F" : "?"}
                          </span>
                        )}
                      </span>
                      {edge && (
                        <span className="flex flex-col items-center">
                          <ArrowRight className="w-3 h-3 text-muted-foreground" />
                          <span className="text-[8px] text-muted-foreground leading-tight">{edge.en}</span>
                          <span className="text-[8px] font-semibold text-primary leading-tight">{edge.np}</span>
                        </span>
                      )}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Note */}
      <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
        <p>This connection is based on recorded family links. Relationship titles may vary by generation, age, marriage, and family tradition.</p>
      </div>

      {/* 7. Suggest Correct Relationship */}
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() => {
            if (!user) { navigateToLogin(); return; }
            setShowCorrection(true);
          }}
        >
          <MessageSquarePlus className="w-4 h-4" />
          Suggest correct relationship
        </Button>
      </div>

      {showCorrection && (
        <SuggestCorrectionDialog
          person1Id={person1Id}
          person2Id={person2Id}
          members={members}
          user={user}
          onClose={() => setShowCorrection(false)}
        />
      )}
    </div>
  );
}