import { useState, useEffect } from "react";
import { familyMemberService, storyService } from "@/services";
import { Link } from "react-router-dom";
import { Clock, User, Baby, Heart, Briefcase, Star } from "lucide-react";

export default function Timeline() {
  const [members, setMembers] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      familyMemberService.list("-date_of_birth", 200).catch(() => []),
      storyService.list("-created_at", 100).catch(() => []),
    ]).then(([m, s]) => { setMembers(m); setStories(s); }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const events = [];
  members.forEach(m => {
    if (m.date_of_birth) events.push({ date: m.date_of_birth, type: "birth", label: `${m.full_name} was born`, sub: m.birthplace, icon: Baby, memberId: m.id });
    if (m.date_of_death) events.push({ date: m.date_of_death, type: "death", label: `${m.full_name} passed away`, icon: Star, memberId: m.id });
  });
  stories.forEach(s => {
    events.push({ date: s.created_date?.split("T")[0] || "Unknown", type: "story", label: s.title, sub: s.category, icon: Heart });
  });

  events.sort((a, b) => (a.date || "").localeCompare(b.date || ""));

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-2">Family Timeline</h1>
      <p className="text-sm text-muted-foreground mb-8">Chronological history of your family</p>

      {events.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><Clock className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>Add family members with dates to build your timeline.</p></div>
      ) : (
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {events.map((evt, i) => {
              const Icon = evt.icon;
              return (
                <div key={i} className="relative flex gap-4 pl-3">
                  <div className="w-7 h-7 rounded-full bg-card border-2 border-primary/40 flex items-center justify-center shrink-0 z-10">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="bg-card border border-border rounded-xl p-4 flex-1 hover:shadow-sm transition-all">
                    <p className="text-xs text-primary font-medium mb-1">{evt.date}</p>
                    {evt.memberId ? (
                      <Link to={`/member/${evt.memberId}`} className="font-heading font-semibold hover:text-primary transition-colors">{evt.label}</Link>
                    ) : (
                      <p className="font-heading font-semibold">{evt.label}</p>
                    )}
                    {evt.sub && <p className="text-sm text-muted-foreground mt-0.5">{evt.sub}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}