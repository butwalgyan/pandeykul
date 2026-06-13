import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowLeft, Info, AlertCircle, Users, Heart } from "lucide-react";

const sections = [
  {
    id: "blood",
    icon: "🩸",
    title: "Direct Blood Relations",
    np: "पुस्तागत नाता",
    rows: [
      { en: "Father", np: "बुबा (Buba)", condition: "Male parent" },
      { en: "Mother", np: "आमा (Aama)", condition: "Female parent" },
      { en: "Son", np: "छोरा (Chhora)", condition: "Male child" },
      { en: "Daughter", np: "छोरी (Chhori)", condition: "Female child" },
      { en: "Grandfather", np: "हजुरबुबा (Hajurba)", condition: "Parent's father" },
      { en: "Grandmother", np: "हजुरआमा (Hajurama)", condition: "Parent's mother" },
      { en: "Grandson", np: "नाति (Naati)", condition: "Male grandchild" },
      { en: "Granddaughter", np: "नातिनी (Naatini)", condition: "Female grandchild" },
      { en: "Great-grandfather", np: "हजुरबुबाको बुबा", condition: "3 generations up, male" },
      { en: "Great-grandmother", np: "हजुरबुबाकी आमा", condition: "3 generations up, female" },
      { en: "Great-grandson", np: "नाति (great-)", condition: "3 generations down, male" },
      { en: "Great-granddaughter", np: "नातिनी (great-)", condition: "3 generations down, female" },
    ],
  },
  {
    id: "siblings",
    icon: "👫",
    title: "Siblings",
    np: "भाइबहिनी",
    note: "Elder vs younger is determined by Date of Birth. If DOB is missing, a neutral combined form is used (e.g. दाजु/भाइ).",
    rows: [
      { en: "Elder brother", np: "दाजु (Daju)", condition: "Same parents, male, born earlier than you" },
      { en: "Younger brother", np: "भाइ (Bhai)", condition: "Same parents, male, born later than you" },
      { en: "Elder sister", np: "दिदी (Didi)", condition: "Same parents, female, born earlier than you" },
      { en: "Younger sister", np: "बहिनी (Bahini)", condition: "Same parents, female, born later than you" },
      { en: "Half-brother", np: "सौतेनो दाजु/भाइ", condition: "Shares only one parent, male" },
      { en: "Half-sister", np: "सौतेनी दिदी/बहिनी", condition: "Shares only one parent, female" },
      { en: "Step half-brother", np: "सौतेनो भाइ", condition: "Connected through parent's other spouse" },
      { en: "Step half-sister", np: "सौतेनी बहिनी", condition: "Connected through parent's other spouse" },
    ],
  },
  {
    id: "marriage",
    icon: "💍",
    title: "Spouse & Direct In-laws",
    np: "विवाह नाता",
    rows: [
      { en: "Husband", np: "श्रीमान (Shriman)", condition: "Male spouse" },
      { en: "Wife", np: "श्रीमती (Shrimati)", condition: "Female spouse" },
      { en: "Son-in-law", np: "ज्वाईं (Jwai)", condition: "Daughter's husband" },
      { en: "Daughter-in-law", np: "बुहारी (Buhari)", condition: "Son's wife" },
      { en: "Father-in-law", np: "ससुरा (Sasura)", condition: "Spouse's father" },
      { en: "Mother-in-law", np: "सासु (Saasu)", condition: "Spouse's mother" },
      { en: "Grandfather-in-law", np: "हजुरससुरा", condition: "Spouse's grandfather" },
      { en: "Grandmother-in-law", np: "हजुरसासु", condition: "Spouse's grandmother" },
      { en: "Granddaughter-in-law", np: "नातिनी बुहारी", condition: "Grandson's wife (female)" },
      { en: "Grandson-in-law", np: "नाति ज्वाईं", condition: "Granddaughter's husband (male)" },
      { en: "Step-father", np: "सौतेलो बुबा", condition: "Mother's husband who is not your bio-father" },
      { en: "Step-mother", np: "सौतेली आमा", condition: "Father's wife who is not your bio-mother" },
      { en: "Step-son", np: "सौतेलो छोरा", condition: "Spouse's son, not your biological child" },
      { en: "Step-daughter", np: "सौतेली छोरी", condition: "Spouse's daughter, not your biological child" },
    ],
  },
  {
    id: "siblings_inlaw",
    icon: "🤝",
    title: "Siblings-in-law",
    np: "भाउजू / देवर / ननद / साला",
    note: "These are the most nuanced terms. The exact word depends on: (1) your gender, (2) the sibling's gender, (3) whether that sibling is elder or younger than your spouse — all determined by Date of Birth.",
    rules: [
      {
        title: "From a Wife's perspective (you are female, your husband has siblings)",
        items: [
          { term: "जेठान (Jethan)", rule: "Husband's ELDER brother (husband is younger than his brother)" },
          { term: "देवर (Dewar)", rule: "Husband's YOUNGER brother (husband is older than his brother)" },
          { term: "ननद (Nanad)", rule: "Husband's sister (any age)" },
        ],
      },
      {
        title: "From a Husband's perspective (you are male, your wife has siblings)",
        items: [
          { term: "साला (Sala)", rule: "Wife's brother (any age)" },
          { term: "साली (Saali)", rule: "Wife's sister (any age)" },
        ],
      },
      {
        title: "From a sibling's perspective (your brother or sister is married)",
        items: [
          { term: "भाउजू (Bhauju)", rule: "Wife of your ELDER brother (he was born before you)" },
          { term: "बुहारी (Buhari)", rule: "Wife of your YOUNGER brother (he was born after you)" },
          { term: "जेठाजु (Jethaaju)", rule: "Husband of your ELDER sister (she was born before you)" },
          { term: "भिनाजु (Bhinaaju)", rule: "Husband of your YOUNGER sister (she was born after you)" },
        ],
      },
      {
        title: "Co-wives (two women married to brothers)",
        items: [
          { term: "जेठानी (Jethani)", rule: "Your husband's elder brother's wife — she ranks 'above' you (her husband is older)" },
          { term: "देउरानी (Deurani)", rule: "Your husband's younger brother's wife — she ranks 'below' you (her husband is younger)" },
        ],
      },
      {
        title: "Co-wives (two women married to the same man)",
        items: [
          { term: "जेठी सौता (Jethi Sauta)", rule: "The elder co-wife (born earlier)" },
          { term: "कान्छी सौता (Kanchhi Sauta)", rule: "The younger co-wife (born later)" },
        ],
      },
    ],
  },
  {
    id: "uncles",
    icon: "👨‍👩‍👧",
    title: "Uncles, Aunts & Cousins",
    np: "काका / फुपू / मामा / काजिन",
    note: "The system detects whether the uncle/aunt is on the paternal (father's) or maternal (mother's) side by checking the family graph.",
    rows: [
      { en: "Uncle (paternal)", np: "काका (Kaka)", condition: "Father's brother" },
      { en: "Uncle (maternal)", np: "मामा (Mama)", condition: "Mother's brother" },
      { en: "Aunt (paternal)", np: "फुपू (Fupu)", condition: "Father's sister" },
      { en: "Aunt (maternal)", np: "काकी/माइजू (Maiju)", condition: "Mother's sister" },
      { en: "Nephew", np: "भतिजा (Bhatija)", condition: "Sibling's son" },
      { en: "Niece", np: "भतिजी (Bhatiji)", condition: "Sibling's daughter" },
      { en: "Great-uncle", np: "हजुरबुबाका भाइ", condition: "Grandparent's brother" },
      { en: "Great-aunt", np: "हजुरबुबाकी बहिनी", condition: "Grandparent's sister" },
      { en: "First cousin", np: "काजिन (पहिलो)", condition: "Shared grandparent — 2 up + 2 down" },
      { en: "Second cousin", np: "काजिन (दोस्रो)", condition: "Shared great-grandparent — 3 up + 3 down" },
      { en: "First cousin once removed", np: "काजिन (पहिलो, १ पुस्ता)", condition: "2 up + 3 down or 3 up + 2 down" },
    ],
  },
  {
    id: "howitworks",
    icon: "⚙️",
    title: "How the System Works",
    np: "प्रणाली कसरी काम गर्छ",
    explainer: [
      {
        heading: "Graph traversal",
        body: "Every family member is a node in a graph. Parent-child links are 'blood edges' (weight 1). Spouse links are 'marriage edges' (weight 2). The system finds the shortest weighted path — preferring blood over marriage.",
      },
      {
        heading: "Path notation",
        body: "Each step in the path is labelled: ↑ (going up to a parent), ↓ (going down to a child), ↔ (going across to a spouse). A path like ↑↑↓ means: go up to grandparent, then down to their other child = uncle/aunt.",
      },
      {
        heading: "Age comparison",
        body: "For terms like जेठान/देवर, भाउजू/बुहारी, जेठानी/देउरानी — the system compares the Date of Birth (year) of the two relevant people. If either DOB is missing, a neutral combined form is shown.",
      },
      {
        heading: "Paternal vs Maternal side",
        body: "For uncle/aunt terms (काका vs मामा, फुपू vs माइजू), the system checks which parent (father or mother) the shared ancestor is connected through.",
      },
      {
        heading: "Confidence rating",
        body: "High confidence = pure blood path (no marriage edges). Medium = 1 marriage edge. Low = 2+ marriage edges. More marriage hops mean more uncertainty.",
      },
    ],
  },
];

export default function KinshipReference() {
  const [activeSection, setActiveSection] = useState("blood");

  const current = sections.find(s => s.id === activeSection) || sections[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link to="/relationship-finder" className="p-2 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight">Nepali Kinship Reference</h1>
              <p className="text-xs text-muted-foreground">नेपाली नातासम्बन्ध बोधपत्र</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="lg:w-56 shrink-0">
          <div className="bg-card border border-border rounded-xl p-2 space-y-0.5 lg:sticky lg:top-24">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  activeSection === s.id
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-accent text-foreground"
                }`}
              >
                <span>{s.icon}</span>
                <span className="leading-tight">{s.title}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-5">
          {/* Section header */}
          <div>
            <h2 className="font-heading text-2xl font-bold">{current.title}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{current.np}</p>
          </div>

          {current.note && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{current.note}</p>
            </div>
          )}

          {/* Standard table */}
          {current.rows && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-1/3">English</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground w-1/3">Nepali</th>
                    <th className="text-left px-4 py-3 font-semibold text-muted-foreground">When used</th>
                  </tr>
                </thead>
                <tbody>
                  {current.rows.map((row, i) => (
                    <tr key={i} className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-muted/20"}`}>
                      <td className="px-4 py-3 font-medium">{row.en}</td>
                      <td className="px-4 py-3 font-semibold text-primary">{row.np}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{row.condition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rules-based section (siblings-in-law) */}
          {current.rules && current.rules.map((group, gi) => (
            <div key={gi} className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-muted/40 border-b border-border">
                <p className="text-sm font-semibold">{group.title}</p>
              </div>
              <div className="divide-y divide-border">
                {group.items.map((item, ii) => (
                  <div key={ii} className="flex items-start gap-4 px-4 py-3">
                    <span className="font-heading text-lg font-bold text-primary shrink-0 w-36">{item.term}</span>
                    <span className="text-sm text-muted-foreground">{item.rule}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Explainer section (how it works) */}
          {current.explainer && (
            <div className="space-y-4">
              {current.explainer.map((block, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-primary shrink-0" />
                    <h3 className="font-semibold text-sm">{block.heading}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{block.body}</p>
                </div>
              ))}
            </div>
          )}

          {/* Footer CTA */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/relationship-finder"
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              <Heart className="w-4 h-4" />
              Try the Relationship Finder
            </Link>
            <Link
              to="/tree"
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border bg-card rounded-lg text-sm font-medium hover:bg-accent transition-colors"
            >
              <Users className="w-4 h-4" />
              View Family Tree
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}