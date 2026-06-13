import { useState, useEffect } from "react";
import { authService, familyMemberService, relationshipService } from "@/services";
import { Search, Loader2, RefreshCw, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PersonSelector from "@/components/relationship/PersonSelector";
import RelationshipResult from "@/components/relationship/RelationshipResult";
import SuggestRelationshipDialog from "@/components/relationship/SuggestRelationshipDialog";
import {
  buildFamilyGraph,
  findRelationshipPath,
  describeRelationship,
  summarizeFamilyGraph,
  toLegacyRel,
  buildPathExplanation,
} from "@/lib/relationshipEngine";
import { findDirectRelationship, findDirectSpouse } from "@/lib/directRelationship";

const NOT_FOUND_MESSAGE =
  "No structural connection found. Please add father, mother, or spouse link first.";

export default function RelationshipFinderPage() {
  const [members, setMembers] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [person1, setPerson1] = useState("");
  const [person2, setPerson2] = useState("");
  const [result, setResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  useEffect(() => {
    Promise.all([
      authService.me().catch(() => null),
      familyMemberService.listApproved(300).catch(() => []),
      relationshipService.listSpouseRelationships(500).catch(() => []),
    ]).then(([u, m, rels]) => {
      setUser(u);
      setMembers(m);
      setRelationships(rels);

      console.log("[RelationshipFinder] loaded approved members:", m);
      console.log("[RelationshipFinder] member parent links:", m.map(member => ({
        id: member.id,
        full_name: member.full_name,
        father_id: member.father_id ?? null,
        mother_id: member.mother_id ?? null,
        verification_status: member.verification_status ?? null,
      })));
      console.log("[RelationshipFinder] loaded relationships rows:", rels);

      const { graph } = buildFamilyGraph(m, rels);
      console.log("[RelationshipFinder] built graph:", graph);
      console.log("[RelationshipFinder] graph summary:", summarizeFamilyGraph(graph, m));
    }).finally(() => setLoading(false));
  }, []);

  const find = () => {
    if (!person1 || !person2) return;

    if (person1 === person2) {
      setResult({ isSame: true });
      return;
    }

    setAnalyzing(true);
    setResult(null);

    const p1 = members.find(m => String(m.id) === String(person1));
    const p2 = members.find(m => String(m.id) === String(person2));

    console.log("[RelationshipFinder] selected person1 id:", person1, p1);
    console.log("[RelationshipFinder] selected person2 id:", person2, p2);

    const direct = findDirectRelationship(p1, p2) || findDirectSpouse(p1, p2, relationships);
    console.log("[RelationshipFinder] direct link check (parent or spouse):", direct);

    if (direct) {
      const directPath = {
        path: direct.path || [person1, person2],
        edges: direct.rels?.map(r =>
          r === 'down' ? 'down_child' : r === 'up' ? 'up_father' : r
        ) || (direct.rels?.[0] === 'spouse' ? ['spouse'] : ['down_child']),
      };
      setResult({
        ...direct,
        en: `${p1?.full_name} is the ${direct.forward.en} of ${p2?.full_name}`,
        np: direct.forward.np,
        reverse_en: `${p2?.full_name} is the ${direct.reverse.en} of ${p1?.full_name}`,
        reverse_np: direct.reverse.np,
        pathExplanation: buildPathExplanation(directPath.path, directPath.edges, members),
        path: directPath.path,
        rels: direct.rels || ['down'],
        generationSteps: 1,
        bloodSteps: 1,
      });
      setAnalyzing(false);
      return;
    }

    const { graph } = buildFamilyGraph(members, relationships);
    console.log("[RelationshipFinder] built graph for search:", graph);
    console.log("[RelationshipFinder] graph summary:", summarizeFamilyGraph(graph, members));

    const pathResult = findRelationshipPath(person1, person2, graph);
    console.log("[RelationshipFinder] BFS path result:", pathResult);

    if (!pathResult) {
      setResult({
        notFound: true,
        en: NOT_FOUND_MESSAGE,
        np: "कुनै संरचनात्मक सम्बन्ध भेटिएन। बुबा, आमा वा पति/पत्नी सम्बन्ध थप्नुहोस्।",
      });
      setAnalyzing(false);
      return;
    }

    const described = describeRelationship(pathResult, p1, p2, members);
    console.log("[RelationshipFinder] described relationship:", described);

    const spouseCount = pathResult.edges.filter(e => e === "spouse").length;
    const bloodCount = pathResult.edges.length - spouseCount;
    const confidence = spouseCount === 0 ? "high" : spouseCount === 1 ? "medium" : "low";

    setResult({
      en: described.english,
      np: described.nepali,
      reverse_en: described.reverseEnglish,
      reverse_np: described.reverseNepali,
      pathExplanation: described.pathExplanation,
      path: pathResult.path,
      rels: pathResult.edges.map(toLegacyRel),
      generationSteps: pathResult.edges.length,
      bloodSteps: bloodCount,
      confidence,
    });

    setAnalyzing(false);
  };

  const reset = () => { setPerson1(""); setPerson2(""); setResult(null); };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6 text-primary" />
        </div>
        <h1 className="font-heading text-2xl font-bold">Relationship Finder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Discover how any two family members are related — using only approved family data
        </p>
      </div>

      {!user && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-800">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            You are viewing as a guest.{" "}
            <button onClick={() => authService.redirectToLogin()} className="underline font-medium">
              Sign in
            </button>{" "}
            to suggest relationship changes.
          </span>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PersonSelector
            label="Person 1"
            value={person1}
            onChange={v => { setPerson1(v); setResult(null); }}
            members={members}
          />
          <PersonSelector
            label="Person 2"
            value={person2}
            onChange={v => { setPerson2(v); setResult(null); }}
            members={members}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={find}
            className="flex-1 gap-2"
            disabled={!person1 || !person2 || analyzing}
          >
            {analyzing
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
              : <><Search className="w-4 h-4" /> Find Relationship</>}
          </Button>
          {(person1 || person2 || result) && (
            <Button variant="outline" onClick={reset} size="icon">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {result && (
        <RelationshipResult
          result={result}
          members={members}
          person1Id={person1}
          person2Id={person2}
          user={user}
        />
      )}

      {user && (
        <div className="border border-dashed border-border rounded-xl p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Know of a family connection that's missing?
          </p>
          <Button variant="outline" size="sm" onClick={() => setShowSuggest(true)}>
            Suggest a Relationship
          </Button>
        </div>
      )}

      {members.length < 2 && (
        <div className="text-center py-10 text-muted-foreground">
          <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>Add at least 2 family members to use the relationship finder.</p>
        </div>
      )}



      {showSuggest && (
        <SuggestRelationshipDialog
          members={members}
          user={user}
          onClose={() => setShowSuggest(false)}
        />
      )}
    </div>
  );
}
