import { Link } from "react-router-dom";
import { User } from "lucide-react";

export default function MemberCard({ member, compact = false }) {
  if (!member) return null;

  if (compact) {
    return (
      <Link to={`/member/${member.id}`} className="flex items-center gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors">
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0">
          {member.profile_photo ? <img src={member.profile_photo} className="w-full h-full object-cover" /> : <User className="w-4 h-4 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{member.full_name}</p>
          {member.date_of_birth && <p className="text-xs text-muted-foreground">{member.date_of_birth}</p>}
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/member/${member.id}`} className="block bg-card border border-border rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all group">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center overflow-hidden shrink-0 ring-2 ring-primary/10">
          {member.profile_photo ? <img src={member.profile_photo} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors truncate">{member.full_name}</h3>
          {member.nickname && <p className="text-xs text-muted-foreground">"{member.nickname}"</p>}
        </div>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        {member.date_of_birth && <p>Born: {member.date_of_birth}</p>}
        {member.occupation && <p>{member.occupation}</p>}
        {member.birthplace && <p>{member.birthplace}</p>}
        {member.generation != null && <p className="text-primary/70 font-medium">Generation {member.generation}</p>}
      </div>
    </Link>
  );
}