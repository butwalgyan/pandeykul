import { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";

const sections = [
  {
    title: "Direct Blood (पुस्तागत नाता)",
    rows: [
      { en: "Father", np: "बुबा (Buba)", condition: "Male parent" },
      { en: "Mother", np: "आमा (Aama)", condition: "Female parent" },
      { en: "Son", np: "छोरा (Chhora)", condition: "Male child" },
      { en: "Daughter", np: "छोरी (Chhori)", condition: "Female child" },
      { en: "Grandfather", np: "हजुरबुबा (Hajurba)", condition: "Father's or mother's father" },
      { en: "Grandmother", np: "हजुरआमा (Hajurama)", condition: "Father's or mother's mother" },
      { en: "Grandson", np: "नाति (Naati)", condition: "Male grandchild" },
      { en: "Granddaughter", np: "नातिनी (Naatini)", condition: "Female grandchild" },
      { en: "Great-grandfather", np: "परदादा (Pardada)", condition: "3 generations up, male" },
      { en: "Great-grandmother", np: "परदादी (Pardadi)", condition: "3 generations up, female" },
      { en: "Great-great-grandfather", np: "बज्यै हजुरबुबा", condition: "4 generations up, male" },
      { en: "Great-great-grandmother", np: "बज्यै हजुरआमा", condition: "4 generations up, female" },
    ],
  },
  {
    title: "Siblings (भाइबहिनी)",
    rows: [
      { en: "Elder brother", np: "दाजु (Daju)", condition: "Same parents, male, born earlier" },
      { en: "Younger brother", np: "भाइ (Bhai)", condition: "Same parents, male, born later" },
      { en: "Elder sister", np: "दिदी (Didi)", condition: "Same parents, female, born earlier" },
      { en: "Younger sister", np: "बहिनी (Bahini)", condition: "Same parents, female, born later" },
      { en: "Half-brother", np: "सौतेनो दाजु/भाइ (Sauteno)", condition: "Shared only one parent, male" },
      { en: "Half-sister", np: "सौतेनी दिदी/बहिनी (Sauteni)", condition: "Shared only one parent, female" },
    ],
  },
  {
    title: "Spouse & Marriage (विवाह नाता)",
    rows: [
      { en: "Husband", np: "श्रीमान (Shriman)", condition: "Male spouse" },
      { en: "Wife", np: "श्रीमती (Shrimati)", condition: "Female spouse" },
      { en: "Son-in-law", np: "ज्वाईं (Jwai)", condition: "Daughter's husband" },
      { en: "Daughter-in-law", np: "बुहारी (Buhari)", condition: "Son's wife" },
      { en: "Father-in-law", np: "ससुरा (Sasura)", condition: "Spouse's father" },
      { en: "Mother-in-law", np: "सासु (Saasu)", condition: "Spouse's mother" },
      { en: "Step-father", np: "सौतेलो बुबा (Sautelo Buba)", condition: "Mother's new husband, not bio-father" },
      { en: "Step-mother", np: "सौतेली आमा (Sauteli Aama)", condition: "Father's new wife, not bio-mother" },
      { en: "Step-son", np: "सौतेलो छोरा", condition: "Spouse's son, not biological" },
      { en: "Step-daughter", np: "सौतेली छोरी", condition: "Spouse's daughter, not biological" },
    ],
  },
  {
    title: "Siblings-in-law (भाउजू / देवर / ननद)",
    note: "These terms depend on the sibling's gender AND their age relative to the spouse.",
    rows: [
      { en: "Brother-in-law (elder)", np: "जेठान (Jethan)", condition: "Husband's elder brother" },
      { en: "Brother-in-law (younger)", np: "देवर (Dewar)", condition: "Husband's younger brother" },
      { en: "Sister-in-law (elder brother's wife)", np: "भाउजू (Bhauji)", condition: "Elder brother's wife — system uses DOB to determine 'elder'" },
      { en: "Sister-in-law (younger brother's wife)", np: "देउरानी (Deurani)", condition: "Younger brother's wife — system uses DOB for 'younger'" },
      { en: "Sister-in-law (co-wife of husband)", np: "जेठानी (Jethani)", condition: "Husband's elder brother's wife (ranked above you)" },
      { en: "Sister-in-law (husband's sister)", np: "ननद (Nanad)", condition: "Husband's sister" },
      { en: "Brother-in-law (wife's brother)", np: "साला (Sala)", condition: "Wife's brother" },
    ],
  },
  {
    title: "Uncles, Aunts & Cousins (काका / फुपू / काजिन)",
    rows: [
      { en: "Uncle (paternal)", np: "काका (Kaka)", condition: "Father's brother" },
      { en: "Uncle (maternal)", np: "मामा (Mama)", condition: "Mother's brother" },
      { en: "Aunt (paternal)", np: "फुपू (Fupu)", condition: "Father's sister" },
      { en: "Aunt (maternal)", np: "माइजू (Maiju)", condition: "Mother's sister's husband / maternal aunt" },
      { en: "Nephew", np: "भतिजा (Bhatija)", condition: "Sibling's son" },
      { en: "Niece", np: "भतिजी (Bhatiji)", condition: "Sibling's daughter" },
      { en: "Great-uncle", np: "हजुरबुबाका भाइ", condition: "Grandparent's sibling, male" },
      { en: "Great-aunt", np: "हजुरबुबाकी बहिनी", condition: "Grandparent's sibling, female" },
      { en: "First cousin", np: "काजिन (Kajin, पहिलो)", condition: "min(up,down)=2, no removal — grandparent shared" },
      { en: "Second cousin", np: "काजिन (दोस्रो)", condition: "min(up,down)=3 — great-grandparent shared" },
      { en: "First cousin once removed", np: "काजिन (पहिलो, १ पुस्ता हटेको)", condition: "min=2, |up−down|=1" },
      { en: "First cousin twice removed", np: "काजिन (पहिलो, २ पुस्ता हटेको)", condition: "min=2, |up−down|=2" },
    ],
  },
  {
    title: "How age is determined (उमेर निर्धारण)",
    note: "The system compares Date of Birth (DOB) stored on each family member profile to decide 'elder' vs 'younger'. If DOB is missing, terms default to the neutral form (e.g. दाजु/भाइ instead of just दाजु).",
    rows: [
      { en: "DOB available", np: "Exact elder/younger label used", condition: "e.g. दाजु or भाइ, जेठानी or देउरानी" },
      { en: "DOB missing", np: "Neutral combined label used", condition: "e.g. दाजु/भाइ, भाउजू/देउरानी" },
    ],
  },
];

export default function NepaliKinshipReference() {
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-card hover:bg-accent/40 transition-colors text-left"
      >
        <span className="flex items-center gap-2 font-medium text-sm">
          <BookOpen className="w-4 h-4 text-primary" />
          Nepali Kinship Reference Table
          <span className="text-xs text-muted-foreground font-normal">(बोधपत्र)</span>
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="p-5 space-y-4 bg-card/50">
          <p className="text-xs text-muted-foreground">
            This table shows how the system calculates and labels Nepali kinship terms. Terms like <strong>Buhari</strong>, <strong>Jethani</strong>, and <strong>Deurani</strong> depend on the gender and date-of-birth stored in each member's profile.
          </p>

          {/* Section tabs */}
          <div className="flex flex-wrap gap-1.5">
            {sections.map((s, i) => (
              <button
                key={i}
                onClick={() => setActiveSection(activeSection === i ? null : i)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                  activeSection === i
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:bg-accent text-foreground"
                }`}
              >
                {s.title.split(" (")[0]}
              </button>
            ))}
            <button
              onClick={() => setActiveSection(activeSection === "all" ? null : "all")}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${
                activeSection === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background border-border hover:bg-accent text-foreground"
              }`}
            >
              Show All
            </button>
          </div>

          {/* Tables */}
          {sections.map((section, i) => {
            if (activeSection === null) return null;
            if (activeSection !== "all" && activeSection !== i) return null;
            return (
              <div key={i} className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{section.title}</h3>
                {section.note && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    {section.note}
                  </p>
                )}
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/60 border-b border-border">
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-1/4">English Term</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground w-1/4">Nepali (नेपाली)</th>
                        <th className="text-left px-3 py-2 font-semibold text-muted-foreground">When the system uses it</th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, j) => (
                        <tr key={j} className={j % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                          <td className="px-3 py-2 font-medium">{row.en}</td>
                          <td className="px-3 py-2 text-primary font-semibold">{row.np}</td>
                          <td className="px-3 py-2 text-muted-foreground">{row.condition}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {activeSection === null && (
            <p className="text-xs text-muted-foreground text-center italic">
              Select a category above to view the terms.
            </p>
          )}
        </div>
      )}
    </div>
  );
}