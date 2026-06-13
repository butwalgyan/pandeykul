import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { familyMemberService, storyService } from "@/services";
import { TreePine, BookOpen, Image, Search, HeartHandshake, Clock, Map } from "lucide-react";

// ── Decorative SVG components ──────────────────────────────────────────────────

function DhajaBanner() {
  const flags = [
    "#8B1E2D", "#C97A1E", "#C9A24D", "#8B1E2D", "#5A6E2A",
    "#C97A1E", "#8B1E2D", "#C9A24D", "#C97A1E", "#8B1E2D",
    "#5A6E2A", "#C9A24D", "#8B1E2D", "#C97A1E", "#C9A24D",
    "#8B1E2D", "#5A6E2A", "#C97A1E", "#8B1E2D", "#C9A24D",
  ];
  return (
    <div className="w-full overflow-hidden" style={{ height: 44 }}>
      <svg width="100%" height="44" viewBox="0 0 1200 44" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Rope */}
        <line x1="0" y1="6" x2="1200" y2="6" stroke="#6B4226" strokeWidth="1.5" strokeDasharray="4,3" />
        {flags.map((color, i) => {
          const x = i * 62 - 4;
          const w = 54;
          return (
            <g key={i}>
              <polygon
                points={`${x + 6},6 ${x + w - 6},6 ${x + w / 2},40`}
                fill={color}
                opacity="0.82"
              />
              {/* subtle inner line */}
              <polygon
                points={`${x + 12},6 ${x + w - 12},6 ${x + w / 2},32`}
                fill="none"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="0.8"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function MandalaMotiif({ className = "", size = 120, opacity = 0.07 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 120 120"
      className={`absolute pointer-events-none select-none ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="60" cy="60" r="58" fill="none" stroke="#8B1E2D" strokeWidth="1" />
      <circle cx="60" cy="60" r="48" fill="none" stroke="#C9A24D" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="36" fill="none" stroke="#8B1E2D" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="22" fill="none" stroke="#C97A1E" strokeWidth="0.8" />
      <circle cx="60" cy="60" r="8" fill="#8B1E2D" opacity="0.4" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 60 + 22 * Math.cos(rad);
        const y1 = 60 + 22 * Math.sin(rad);
        const x2 = 60 + 56 * Math.cos(rad);
        const y2 = 60 + 56 * Math.sin(rad);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#C9A24D" strokeWidth="0.6" />;
      })}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const cx = 60 + 40 * Math.cos(rad);
        const cy = 60 + 40 * Math.sin(rad);
        return <circle key={i} cx={cx} cy={cy} r="3" fill="#C97A1E" opacity="0.6" />;
      })}
    </svg>
  );
}

function OmSign({ className = "", size = 80, opacity = 0.08 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      className={`absolute pointer-events-none select-none ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <text x="50" y="70" fontSize="70" fontFamily="serif" fontWeight="bold" textAnchor="middle" fill="#8B1E2D">
        ॐ
      </text>
    </svg>
  );
}

function SwastikSign({ className = "", size = 100, opacity = 0.08 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 120 120"
      className={`absolute pointer-events-none select-none ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Center square */}
      <rect x="50" y="50" width="20" height="20" fill="#8B1E2D" />
      {/* Top arm */}
      <rect x="55" y="20" width="10" height="30" fill="#8B1E2D" />
      <rect x="60" y="15" width="5" height="8" fill="#8B1E2D" transform="rotate(45 62 19)" />
      {/* Right arm */}
      <rect x="70" y="55" width="30" height="10" fill="#8B1E2D" />
      <rect x="105" y="60" width="8" height="5" fill="#8B1E2D" transform="rotate(45 109 62)" />
      {/* Bottom arm */}
      <rect x="55" y="70" width="10" height="30" fill="#8B1E2D" />
      <rect x="60" y="105" width="5" height="8" fill="#8B1E2D" transform="rotate(45 62 109)" />
      {/* Left arm */}
      <rect x="20" y="55" width="30" height="10" fill="#8B1E2D" />
      <rect x="7" y="60" width="8" height="5" fill="#8B1E2D" transform="rotate(45 11 62)" />
    </svg>
  );
}

function BeelLeaf({ className = "", size = 100, opacity = 0.09 }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 100 100"
      className={`absolute pointer-events-none select-none ${className}`}
      style={{ opacity }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Leaf outline */}
      <path d="M 50 10 Q 70 30 75 50 Q 70 70 50 80 Q 30 70 25 50 Q 30 30 50 10" fill="none" stroke="#5A6E2A" strokeWidth="1.5" />
      {/* Center vein */}
      <path d="M 50 10 Q 50 45 50 80" stroke="#5A6E2A" strokeWidth="0.8" fill="none" />
      {/* Side veins */}
      <path d="M 50 30 Q 60 35 70 40" stroke="#5A6E2A" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 50 50 Q 65 55 75 58" stroke="#5A6E2A" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 50 70 Q 62 72 70 75" stroke="#5A6E2A" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 50 30 Q 40 35 30 40" stroke="#5A6E2A" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 50 50 Q 35 55 25 58" stroke="#5A6E2A" strokeWidth="0.6" fill="none" opacity="0.7" />
      <path d="M 50 70 Q 38 72 30 75" stroke="#5A6E2A" strokeWidth="0.6" fill="none" opacity="0.7" />
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function Home() {
  const [members, setMembers] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      familyMemberService.list("-created_at", 6).catch(() => []),
      storyService.list("-created_at", 3).catch(() => []),
    ]).then(([m, s]) => {
      setMembers(m);
      setStories(s);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const features = [
    { path: "/tree", label: "Family Tree", np: "वंश वृक्ष", icon: TreePine, desc: "Explore the full ancestral tree across generations." },
    { path: "/stories", label: "Stories", np: "कथा", icon: BookOpen, desc: "Read and share memories, traditions, and life lessons." },
    { path: "/media", label: "Photos & Videos", np: "फोटो", icon: Image, desc: "Browse the family photo and video archive." },
    { path: "/relationship-finder", label: "Relationship Finder", np: "नाता खोजी", icon: HeartHandshake, desc: "Discover how any two members are related." },
    { path: "/search", label: "Search Members", np: "खोज", icon: Search, desc: "Find family members by name, location, or branch." },
    { path: "/timeline", label: "Timeline", np: "समयरेखा", icon: Clock, desc: "View key family events in chronological order." },
    { path: "/map", label: "Migration Map", np: "नक्सा", icon: Map, desc: "See where the Pandey family has lived and migrated." },
  ];

  return (
    <div
      className="min-h-screen relative"
      style={{
        background: `linear-gradient(135deg, rgba(245,237,220,0.98) 0%, rgba(242,230,208,0.96) 100%),
          repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139,30,45,0.02) 2px, rgba(139,30,45,0.02) 4px),
          repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(201,162,77,0.015) 2px, rgba(201,162,77,0.015) 4px)`,
        backgroundColor: "#F5EDD0"
      }}
    >
      {/* Full-page subtle background texture pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(ellipse at 10% 20%, rgba(139,30,45,0.04) 0%, transparent 60%),
            radial-gradient(ellipse at 90% 80%, rgba(201,162,77,0.05) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 50%, rgba(201,122,30,0.03) 0%, transparent 70%)
          `,
          zIndex: 0,
        }}
      />

      {/* Corner mandala motifs */}
      <MandalaMotiif className="top-16 -left-8" size={180} opacity={0.07} />
      <MandalaMotiif className="top-16 -right-8" size={180} opacity={0.07} />
      <MandalaMotiif className="bottom-32 -left-10" size={150} opacity={0.05} />
      <MandalaMotiif className="bottom-32 -right-10" size={150} opacity={0.05} />
      
      {/* Decorative Hindu symbols */}
      <OmSign className="top-32 left-20" size={90} opacity={0.08} />
      <SwastikSign className="top-40 right-16" size={110} opacity={0.07} />
      <BeelLeaf className="bottom-64 left-1/3" size={120} opacity={0.09} />
      <BeelLeaf className="bottom-48 right-1/4" size={100} opacity={0.08} style={{ transform: "rotate(-30deg)" }} />
      <OmSign className="bottom-56 right-32" size={80} opacity={0.06} />
      <SwastikSign className="top-1/2 left-1/4" size={100} opacity={0.05} />

      {/* ── Dhaja Banner ──────────────────────────────────────────────────── */}
      <DhajaBanner />

      {/* ── Hero Section ──────────────────────────────────────────────────── */}
      <div
        className="relative text-center px-4 py-20 overflow-visible min-h-screen flex items-center justify-center"
        style={{
          zIndex: 1,
          background: "#933D52"
        }}
      >
        {/* Burning Nepali Jyoti — left */}
        <div className="absolute left-12 bottom-20 h-96 pointer-events-none select-none" style={{ maxWidth: "25%", minHeight: "400px" }}>
          <svg viewBox="0 0 200 350" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
            {/* Stand/base */}
            <ellipse cx="100" cy="300" rx="50" ry="12" fill="#B8860B" opacity="0.8" />
            <path d="M 60 300 L 70 280 L 130 280 L 140 300" fill="#D4A520" opacity="0.7" stroke="#8B6914" strokeWidth="1" />
            
            {/* Lamp bowl */}
            <path d="M 70 280 Q 60 270 65 250 Q 70 240 100 235 Q 130 240 135 250 Q 140 270 130 280" 
                  fill="#CD853F" stroke="#8B4513" strokeWidth="2" opacity="0.9" />
            <ellipse cx="100" cy="235" rx="32" ry="8" fill="#D4A574" opacity="0.6" />
            
            {/* Oil inside */}
            <ellipse cx="100" cy="260" rx="25" ry="8" fill="#4A3728" opacity="0.7" />
            
            {/* Wick holder */}
            <ellipse cx="100" cy="235" rx="8" ry="12" fill="#3A3A3A" />
            
            {/* Animated outer orange flame */}
            <path
              d="M 88 220 Q 75 160 88 80 Q 95 40 100 20 Q 105 40 112 80 Q 125 160 112 220 Q 108 232 100 235 Q 92 232 88 220"
              fill="#FF6347"
              opacity="0.75"
              style={{
                animation: "jyotiFlame 2.8s ease-in-out infinite",
                transformOrigin: "100px 230px"
              }}
            />
            
            {/* Animated red-orange middle flame */}
            <path
              d="M 92 225 Q 82 170 92 90 Q 97 50 100 25 Q 103 50 108 90 Q 118 170 108 225 Q 105 233 100 235 Q 95 233 92 225"
              fill="#FF8C00"
              opacity="0.7"
              style={{
                animation: "jyotiFlame 2.4s ease-in-out infinite 0.2s",
                transformOrigin: "100px 230px"
              }}
            />
            
            {/* Animated yellow middle flame */}
            <path
              d="M 95 228 Q 88 180 95 100 Q 98 60 100 30 Q 102 60 105 100 Q 112 180 105 228 Q 103 234 100 235 Q 97 234 95 228"
              fill="#FFD700"
              opacity="0.65"
              style={{
                animation: "jyotiFlame 2s ease-in-out infinite 0.4s",
                transformOrigin: "100px 230px"
              }}
            />
            
            {/* Bright yellow inner flame */}
            <path
              d="M 97 232 Q 93 190 97 110 Q 99 70 100 35 Q 101 70 103 110 Q 107 190 103 232 Q 102 234 100 235 Q 98 234 97 232"
              fill="#FFFF99"
              opacity="0.6"
              style={{
                animation: "jyotiFlame 1.8s ease-in-out infinite 0.6s",
                transformOrigin: "100px 230px"
              }}
            />
            
            {/* Outer glow */}
            <circle cx="100" cy="130" r="65" fill="#FF4500" opacity="0.08" 
                    style={{ animation: "jyotiGlow 2.5s ease-in-out infinite" }} />
            <circle cx="100" cy="130" r="45" fill="#FF8C00" opacity="0.06" 
                    style={{ animation: "jyotiGlow 2s ease-in-out infinite 0.3s" }} />
          </svg>
          
          <style>{`
            @keyframes jyotiFlame {
              0%, 100% { transform: scaleY(1) scaleX(1); }
              20% { transform: scaleY(1.08) scaleX(0.92); }
              40% { transform: scaleY(0.98) scaleX(1.06); }
              60% { transform: scaleY(1.12) scaleX(0.88); }
              80% { transform: scaleY(1.02) scaleX(1.04); }
            }
            
            @keyframes jyotiGlow {
              0%, 100% { opacity: 0.08; r: 65px; }
              50% { opacity: 0.15; r: 75px; }
            }
          `}</style>
        </div>
        
        {/* Ornate Golden Bell — right */}
        <img
          src="/images/home-hero.jpg"
          alt=""
          className="absolute right-12 bottom-20 h-96 object-contain object-right pointer-events-none select-none"
          style={{ opacity: 0.9, maxWidth: "28%", minHeight: "400px" }}
        />

        {/* Central vertical maroon stripe with ॐ symbols */}
        <div
          className="absolute left-1/2 transform -translate-x-1/2 top-0 bottom-0 flex flex-col items-center justify-center gap-8"
          style={{ width: "80px", background: "linear-gradient(to bottom, rgba(80,20,35,0.95), rgba(70,15,30,0.9), rgba(80,20,35,0.95))" }}
        >
          <span style={{ fontSize: 24, color: "#C9A24D", opacity: 0.6 }}>ॐ</span>
          <span style={{ fontSize: 24, color: "#C9A24D", opacity: 0.6 }}>॰</span>
          <span style={{ fontSize: 24, color: "#C9A24D", opacity: 0.6 }}>ॐ</span>
        </div>

        {/* Content container */}
        <div className="relative z-10 max-w-2xl mx-auto px-8">
          {/* Decorative top rule */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 max-w-[40px]" style={{ background: "linear-gradient(to right, transparent, #C9A24D)" }} />
            <span style={{ color: "#C9A24D", fontSize: 16 }}>॰</span>
            <div className="h-px flex-1 max-w-[40px]" style={{ background: "linear-gradient(to left, transparent, #C9A24D)" }} />
          </div>

          {/* Title */}
          <h1
            className="font-heading font-bold tracking-tight mb-6"
            style={{
              fontSize: "clamp(2.5rem, 8vw, 4rem)",
              color: "#FFFDF8",
              textShadow: "0 4px 8px rgba(0,0,0,0.35), 0 -2px 4px rgba(255,255,255,0.4), 0 2px 6px rgba(201,162,77,0.6)",
              filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.2))"
            }}
          >
            पाण्डे वंशावली
          </h1>

          {/* Sanskrit shlokas */}
          <div className="mb-6 space-y-3">
            <p
              className="font-heading"
              style={{ fontSize: "0.95rem", color: "#FFFBF0", lineHeight: "1.8", fontStyle: "italic" }}
            >
              अयं निजः परो वेति गणना लघुचेतसाम् ।<br />
              उदारचरितानां तु <span style={{ color: "#D4AF7A", fontWeight: "600" }}>वसुधैव कुटुम्बकम्</span> ॥
            </p>
            <p
              className="font-heading font-semibold"
              style={{ fontSize: "0.85rem", color: "#D4AF7A", letterSpacing: "0.05em" }}
            >
              वसुधैव कुटुम्बकम् · <span style={{ color: "#FFE8C1" }}>The world is one family</span>
            </p>
          </div>

          {/* Decorative divider */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-px flex-1 max-w-[60px]" style={{ background: "#C9A24D" }} />
            <span style={{ color: "#C9A24D", fontSize: 14 }}>॰</span>
            <div className="h-px flex-1 max-w-[60px]" style={{ background: "#C9A24D" }} />
          </div>

          {/* Tagline */}
          <p
            className="text-sm leading-relaxed mb-8 font-semibold"
            style={{ color: "#FFE8C1" }}
          >
            Preserving the Pandey lineage, stories, rituals, and traditions.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/member/new"
              className="font-semibold px-7 py-3 rounded-lg text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #C63D3D 0%, #A83030 50%, #8B1E1E 100%)",
                color: "#FFF8EA",
                border: "1.5px solid #D4AF7A",
                boxShadow: "0 8px 16px rgba(0,0,0,0.4), 0 -2px 4px rgba(255,255,255,0.3) inset, 0 2px 4px rgba(255,255,255,0.15) inset",
                textShadow: "0 2px 4px rgba(0,0,0,0.3), 0 -1px 2px rgba(255,255,255,0.2)"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "linear-gradient(135deg, #D84545 0%, #B83838 50%, #9B2424 100%)";
                e.target.style.boxShadow = "0 12px 24px rgba(0,0,0,0.45), 0 -2px 4px rgba(255,255,255,0.3) inset, 0 2px 4px rgba(255,255,255,0.15) inset";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "linear-gradient(135deg, #C63D3D 0%, #A83030 50%, #8B1E1E 100%)";
                e.target.style.boxShadow = "0 8px 16px rgba(0,0,0,0.4), 0 -2px 4px rgba(255,255,255,0.3) inset, 0 2px 4px rgba(255,255,255,0.15) inset";
              }}
            >
              + Add Members
            </Link>
            <Link
              to="/relationship-finder"
              className="font-semibold px-7 py-3 rounded-lg text-sm transition-all"
              style={{
                background: "linear-gradient(135deg, #FFFBF0 0%, #FFE8C1 50%, #FFD9A3 100%)",
                color: "#933D52",
                border: "1.5px solid #D4AF7A",
                boxShadow: "0 8px 16px rgba(0,0,0,0.25), 0 -2px 4px rgba(255,255,255,0.5) inset, 0 2px 4px rgba(255,255,255,0.3) inset",
                textShadow: "0 2px 4px rgba(0,0,0,0.1), 0 -1px 2px rgba(255,255,255,0.3)"
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "linear-gradient(135deg, #FFFEF5 0%, #FFF0D9 50%, #FFE0BB 100%)";
                e.target.style.boxShadow = "0 12px 24px rgba(0,0,0,0.3), 0 -2px 4px rgba(255,255,255,0.5) inset, 0 2px 4px rgba(255,255,255,0.3) inset";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "linear-gradient(135deg, #FFFBF0 0%, #FFE8C1 50%, #FFD9A3 100%)";
                e.target.style.boxShadow = "0 8px 16px rgba(0,0,0,0.25), 0 -2px 4px rgba(255,255,255,0.5) inset, 0 2px 4px rgba(255,255,255,0.3) inset";
              }}
            >
              Find a Relationship
            </Link>
          </div>
        </div>
      </div>

      {/* ── Page Body ─────────────────────────────────────────────────────── */}
      <div className="relative max-w-5xl mx-auto px-4 pb-12 space-y-10" style={{ zIndex: 1 }}>

        {/* Stats */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Members", np: "सदस्यहरू", value: members.length || "—" },
              { label: "Stories", np: "कथाहरू", value: stories.length || "—" },
              { label: "Generations", np: "पुस्ताहरू", value: "∞" },
              { label: "Legacy", np: "विरासत", value: "1+" },
            ].map(s => (
              <div
                key={s.label}
                className="rounded-xl p-4 text-center shadow-sm"
                style={{ background: "#FFFDF8", border: "1px solid #E5D6C3" }}
              >
                <p className="text-2xl font-bold font-heading" style={{ color: "#8B1E2D" }}>{s.value}</p>
                <p className="text-sm font-medium" style={{ color: "#2E241C" }}>{s.label}</p>
                <p className="text-[10px]" style={{ color: "#9B8B7A" }}>{s.np}</p>
              </div>
            ))}
          </div>
        )}

        {/* Features */}
        <div>
          <SectionHeading title="Explore the Archive" np="अभिलेख हेर्नुहोस्" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => (
              <Link
                key={f.path}
                to={f.path}
                className="rounded-xl p-5 transition-all group hover:shadow-md"
                style={{ background: "#FFFDF8", border: "1px solid #E5D6C3" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-all group-hover:opacity-90"
                    style={{ background: "rgba(139,30,45,0.08)" }}
                  >
                    <f.icon className="w-4 h-4" style={{ color: "#8B1E2D" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#2E241C" }}>{f.label}</p>
                    <p className="text-[10px] font-heading" style={{ color: "#9B8B7A" }}>{f.np}</p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: "#6B5744" }}>{f.desc}</p>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Members */}
        {members.length > 0 && (
          <div>
            <SectionHeading title="Recently Added Members" np="नयाँ सदस्यहरू" linkTo="/search" linkLabel="View all →" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {members.slice(0, 6).map(m => (
                <Link
                  key={m.id}
                  to={`/member/${m.id}`}
                  className="rounded-xl p-3 flex items-center gap-3 transition hover:shadow-sm"
                  style={{ background: "#FFFDF8", border: "1px solid #E5D6C3" }}
                >
                  {m.profile_photo
                    ? <img src={m.profile_photo} className="w-10 h-10 rounded-full object-cover shrink-0" alt="" />
                    : (
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-bold text-sm"
                        style={{ background: "rgba(139,30,45,0.12)", color: "#8B1E2D" }}
                      >
                        {m.full_name?.[0]}
                      </div>
                    )
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#2E241C" }}>{m.full_name}</p>
                    {m.current_location && <p className="text-[10px] truncate" style={{ color: "#9B8B7A" }}>{m.current_location}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recent Stories */}
        {stories.length > 0 && (
          <div>
            <SectionHeading title="Recent Stories" np="हालका कथाहरू" linkTo="/stories" linkLabel="View all →" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stories.map(s => (
                <Link
                  key={s.id}
                  to="/stories"
                  className="rounded-xl p-4 transition hover:shadow-md"
                  style={{ background: "#FFFDF8", border: "1px solid #E5D6C3" }}
                >
                  {s.cover_image && <img src={s.cover_image} className="w-full h-28 object-cover rounded-lg mb-3" alt="" />}
                  <p className="font-semibold text-sm line-clamp-2" style={{ color: "#2E241C" }}>{s.title}</p>
                  {s.category && (
                    <span
                      className="mt-1 inline-block text-[10px] px-2 py-0.5 rounded-full capitalize"
                      style={{ background: "rgba(139,30,45,0.08)", color: "#8B1E2D" }}
                    >
                      {s.category}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Ancestral / homeland shloka */}
        <div
          className="rounded-xl px-6 py-5 text-center"
          style={{ background: "rgba(139,30,45,0.06)", border: "1px solid rgba(139,30,45,0.15)" }}
        >
          <p
            className="font-heading leading-relaxed"
            style={{ fontSize: "clamp(0.85rem, 2vw, 1rem)", color: "#8B1E2D", fontStyle: "italic" }}
          >
            जननी जन्मभूमिश्च स्वर्गादपि गरीयसी ।
          </p>
          <p className="text-xs mt-1" style={{ color: "#9B8B7A" }}>
            "Mother and motherland are greater than heaven." — Valmiki Ramayana
          </p>
        </div>

        {/* Bottom decorative rule */}
        <div className="flex items-center justify-center gap-3 pt-2 pb-2">
          <div className="h-px flex-1 max-w-[60px]" style={{ background: "linear-gradient(to right, transparent, #C9A24D50)" }} />
          <span style={{ color: "#C9A24D", fontSize: 12, opacity: 0.7 }}>॰ पाण्डे वंशावली ॰</span>
          <div className="h-px flex-1 max-w-[60px]" style={{ background: "linear-gradient(to left, transparent, #C9A24D50)" }} />
        </div>
      </div>
    </div>
  );
}

function SectionHeading({ title, np, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <h2 className="font-heading text-lg font-semibold" style={{ color: "#2E241C" }}>{title}</h2>
        {np && <p className="text-[10px]" style={{ color: "#9B8B7A" }}>{np}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="text-sm font-medium hover:underline" style={{ color: "#8B1E2D" }}>
          {linkLabel}
        </Link>
      )}
    </div>
  );
}