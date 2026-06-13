import { useState } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { integrationService } from "@/services";
import { calculateRelationship } from "@/lib/relationshipEngine";

// Build a bidirectional graph from all family members
function buildGraph(members) {
  const graph = {};
  members.forEach(m => {
    if (!graph[m.id]) graph[m.id] = [];
    (m.parent_ids || []).forEach(pid => {
      if (!graph[pid]) graph[pid] = [];
      graph[m.id].push({ id: pid, rel: "up" });
      if (!graph[pid].find(e => e.id === m.id)) graph[pid].push({ id: m.id, rel: "down" });
    });
    (m.spouse_ids || []).forEach(sid => {
      if (!graph[sid]) graph[sid] = [];
      if (!graph[m.id].find(e => e.id === sid)) graph[m.id].push({ id: sid, rel: "spouse" });
      if (!graph[sid].find(e => e.id === m.id)) graph[sid].push({ id: m.id, rel: "spouse" });
    });
  });
  return graph;
}

// BFS to find shortest path between two people
function findPath(graph, id1, id2) {
  if (id1 === id2) return { path: [id1], rels: [] };
  const visited = new Set([id1]);
  const queue = [[id1, [id1], []]];
  while (queue.length > 0) {
    const [current, path, rels] = queue.shift();
    for (const edge of (graph[current] || [])) {
      if (edge.id === id2) return { path: [...path, edge.id], rels: [...rels, edge.rel] };
      if (!visited.has(edge.id)) {
        visited.add(edge.id);
        queue.push([edge.id, [...path, edge.id], [...rels, edge.rel]]);
      }
    }
  }
  return null;
}

export default function RelationshipFinder({ members }) {
  const [person1, setPerson1] = useState("");
  const [person2, setPerson2] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const find = async () => {
    if (!person1 || !person2) return;
    if (person1 === person2) {
      setResult({ en: "Same person", np: "एउटै व्यक्ति", path: [] });
      return;
    }

    setLoading(true);
    setResult(null);

    const graph = buildGraph(members);
    const pathResult = findPath(graph, person1, person2);

    const p1 = members.find(m => m.id === person1);
    const p2 = members.find(m => m.id === person2);

    if (!pathResult) {
      setResult({ en: "No relationship found", np: "नाता भेटिएन", path: [] });
      setLoading(false);
      return;
    }

    // Build readable path for AI context
    const pathNames = pathResult.path.map(id => {
      const m = members.find(x => x.id === id);
      return m ? `${m.full_name} (${m.gender || "unknown gender"})` : id;
    });

    const stepDesc = pathResult.rels.map(r =>
      r === "up" ? "→ parent of previous" : r === "down" ? "→ child of previous" : "→ spouse of previous"
    );

    const prompt = `You are a kinship expert specializing in South Asian (especially Nepali) family relationships.

TASK: Determine what Person 1 is TO Person 2 (i.e. complete: "Person 1 is Person 2's ___").

PERSON 1 (the subject): ${p1?.full_name}, gender: ${p1?.gender || "unknown"}
PERSON 2 (the reference): ${p2?.full_name}, gender: ${p2?.gender || "unknown"}

STEP-BY-STEP CONNECTION from Person 1 to Person 2:
${pathNames.map((n, i) => `  Step ${i + 1}: ${n}${stepDesc[i] ? "  [${stepDesc[i]}]" : ""}`).join("\n")}

HOW TO READ THE PATH:
- "→ parent of previous" means we moved UP (the next person is the parent of the previous)
- "→ child of previous" means we moved DOWN (the next person is the child of the previous)
- "→ spouse of previous" means we moved SIDEWAYS (the next person is the spouse)

CRITICAL RULES:
1. The answer describes what Person 1 IS from Person 2's perspective
2. Person 1's gender determines the gendered term (male=son/father/brother/husband/grandson/uncle/nephew, female=daughter/mother/sister/wife/granddaughter/aunt/niece)
3. Count the steps carefully: 1 up = child, 1 down = parent, 2 up = grandchild, 2 down = grandparent, up+down = sibling, etc.
4. For Nepali kinship, use the most specific traditional term possible. Consider the gender and generation of BOTH people.

NEPALI KINSHIP REFERENCE:
- Father = बुबा/बाबा, Mother = आमा
- Elder brother = दाजु, Younger brother = भाइ, Elder sister = दिदी, Younger sister = बहिनी
- Husband = श्रीमान/पति, Wife = श्रीमती/पत्नी
- Son = छोरा, Daughter = छोरी
- Paternal grandfather = हजुरबुबा, Paternal grandmother = हजुरआमा
- Maternal grandfather = नाना, Maternal grandmother = नानी
- Grandson = नाति, Granddaughter = नातिनी
- Paternal uncle (father's brother) = काका/ठूलोबुबा, Paternal aunt (father's sister) = फुपू
- Maternal uncle (mother's brother) = मामा, Maternal aunt (mother's sister) = माइजू/सानीआमा
- Nephew = भतिजा (brother's son), Niece = भतिजी (brother's daughter)
- Father-in-law = ससुरा, Mother-in-law = सासु
- Son-in-law = ज्वाईं, Daughter-in-law = बुहारी
- Brother-in-law = देवर/जेठान/साला, Sister-in-law = जेठानी/देवरानी/साली

Return ONLY valid JSON: {"en": "...", "np": "..."}`;

    try {
      let en = "Unknown";
      let np = "अज्ञात";

      try {
        const aiResult = await integrationService.invokeLLM({
          prompt,
          model: "claude_sonnet_4_6",
          response_json_schema: {
            type: "object",
            properties: {
              en: { type: "string" },
              np: { type: "string" },
            },
            required: ["en", "np"],
          },
        });
        en = aiResult.en || en;
        np = aiResult.np || np;
      } catch {
        const revRels = [...pathResult.rels].reverse().map(r =>
          r === "up" ? "down" : r === "down" ? "up" : "spouse",
        );
        const revPath = [...pathResult.path].reverse();
        const rel = calculateRelationship(revRels, p2?.gender, p1?.gender, revPath, members);
        en = rel?.en || en;
        np = rel?.np || np;
      }

      setResult({
        en,
        np,
        path: pathResult.path,
        rels: pathResult.rels,
      });
    } catch {
      setResult({ en: "Could not determine relationship", np: "नाता पत्ता लगाउन सकिएन", path: [] });
    }

    setLoading(false);
  };

  const getName = (id) => members.find(m => m.id === id)?.full_name || "Unknown";

  const sorted = [...members].sort((a, b) => a.full_name.localeCompare(b.full_name));

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
        <Search className="w-4 h-4 text-primary" /> AI Relationship Finder
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <select value={person1} onChange={e => { setPerson1(e.target.value); setResult(null); }}
          className="border border-input rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">Select person 1</option>
          {sorted.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.gender || "?"})</option>)}
        </select>
        <select value={person2} onChange={e => { setPerson2(e.target.value); setResult(null); }}
          className="border border-input rounded-lg px-3 py-2 text-sm bg-background">
          <option value="">Select person 2</option>
          {sorted.map(m => <option key={m.id} value={m.id}>{m.full_name} ({m.gender || "?"})</option>)}
        </select>
      </div>
      <Button onClick={find} className="w-full gap-2" disabled={!person1 || !person2 || loading}>
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> AI is analyzing...</> : <><Search className="w-4 h-4" /> Find Relationship with AI</>}
      </Button>

      {result && (
        <div className="mt-4 p-4 bg-accent/50 rounded-lg space-y-3">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <p className="font-heading font-semibold text-primary text-base">
                {getName(person1)} is {getName(person2)}'s{" "}
                <span className="underline capitalize">{result.en}</span>
              </p>
              <p className="text-sm text-foreground/80 mt-1">
                नेपालीमा:{" "}
                <span className="font-semibold text-primary text-base">{result.np}</span>
              </p>
            </div>
          </div>

          {result.path && result.path.length > 1 && (
            <div className="border-t border-border/50 pt-3">
              <p className="text-xs text-muted-foreground font-medium mb-1.5">Connection path:</p>
              <div className="flex flex-wrap items-center gap-1">
                {result.path.map((id, i) => (
                  <span key={id} className="flex items-center gap-1">
                    <span className="text-xs bg-background border border-border rounded-md px-2 py-0.5">
                      {getName(id)}
                    </span>
                    {i < result.path.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    )}
                  </span>
                ))}
              </div>
              {result.rels && (
                <p className="text-xs text-muted-foreground mt-1">
                  {result.rels.map(r => r === "up" ? "↑ parent" : r === "down" ? "↓ child" : "↔ spouse").join(" · ")}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}