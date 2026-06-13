import { useState, useEffect } from "react";
import { familyMemberService } from "@/services";
import { Search as SearchIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MemberCard from "../components/MemberCard";

export default function Search() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const urlParams = new URLSearchParams(window.location.search);
  const [query, setQuery] = useState(urlParams.get("q") || "");
  const [genFilter, setGenFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  useEffect(() => {
    familyMemberService.list("-created_at", 500)
      .then(m => { setMembers(m); })
      .catch(() => { setMembers([]); })
      .finally(() => setLoading(false));
  }, []);

  const generations = [...new Set(members.map(m => m.generation).filter(g => g != null))].sort((a, b) => a - b);
  const branches = [...new Set(members.map(m => m.branch).filter(Boolean))].sort();

  const filtered = members.filter(m => {
    if (genFilter !== "all" && m.generation !== Number(genFilter)) return false;
    if (branchFilter !== "all" && m.branch !== branchFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return (m.full_name?.toLowerCase().includes(q) || m.nickname?.toLowerCase().includes(q) || m.birthplace?.toLowerCase().includes(q) || m.occupation?.toLowerCase().includes(q) || m.branch?.toLowerCase().includes(q));
    }
    return true;
  });

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="font-heading text-2xl font-bold mb-6">Search Family Members</h1>
      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name, place, occupation..." value={query} onChange={e => setQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={genFilter} onValueChange={setGenFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Generation" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Generations</SelectItem>
            {generations.map(g => <SelectItem key={g} value={String(g)}>Gen {g}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={branchFilter} onValueChange={setBranchFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Branch" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {branches.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} member{filtered.length !== 1 ? "s" : ""} found</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(m => <MemberCard key={m.id} member={m} />)}
      </div>
    </div>
  );
}