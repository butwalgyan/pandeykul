import { useState, useEffect } from "react";
import { documentService, familyMemberService, notificationService, integrationService } from "@/services";
import { FileText, Plus, Download, Search, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const docTypes = ["birth_certificate", "land_paper", "letter", "military_record", "passport", "educational", "other"];

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [form, setForm] = useState({ title: "", type: "other", file_url: "", description: "", member_id: "", year: "", tags: "" });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      documentService.list("-created_at", 200).catch(() => []),
      familyMemberService.list("-created_at", 200).catch(() => []),
    ]).then(([d, m]) => { setDocs(d); setMembers(m); }).finally(() => setLoading(false));
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await integrationService.uploadFile({ file });
    setForm(f => ({ ...f, file_url }));
    setUploading(false);
  };

  const save = async () => {
    const data = { ...form, tags: form.tags.split(",").map(t => t.trim()).filter(Boolean), year: form.year ? Number(form.year) : undefined };
    const created = await documentService.create(data);
    setDocs([created, ...docs]);
    setForm({ title: "", type: "other", file_url: "", description: "", member_id: "", year: "", tags: "" });
    setOpen(false);
    await notificationService.create({ message: `Document uploaded: "${data.title}"`, type: "document_added" });
  };

  const filtered = docs.filter(d => {
    if (typeFilter !== "all" && d.type !== typeFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.title?.toLowerCase().includes(s) || d.description?.toLowerCase().includes(s) || (d.tags || []).some(t => t.toLowerCase().includes(s));
    }
    return true;
  });

  const getName = (id) => members.find(m => m.id === id)?.full_name;
  const formatType = (t) => t?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Document Vault</h1>
          <p className="text-sm text-muted-foreground mt-1">Secure storage for important family documents</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Upload</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Upload Document</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{docTypes.map(t => <SelectItem key={t} value={t}>{formatType(t)}</SelectItem>)}</SelectContent>
              </Select>
              <div>
                <label className="border-2 border-dashed border-border rounded-xl p-4 block text-center cursor-pointer hover:border-primary/50">
                  {uploading ? "Uploading..." : form.file_url ? "✓ File uploaded" : "Click to upload file"}
                  <input type="file" className="hidden" onChange={handleFile} />
                </label>
              </div>
              <Input placeholder="Year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
              <Input placeholder="Tags (comma separated)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
              <select className="border border-input rounded-lg px-3 py-2 text-sm bg-background w-full" value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}>
                <option value="">Related member (optional)</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
              <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <Button onClick={save} disabled={!form.title || !form.file_url} className="w-full">Save Document</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {docTypes.map(t => <SelectItem key={t} value={t}>{formatType(t)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground"><FileText className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No documents found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(d => (
            <div key={d.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <FileText className="w-8 h-8 text-primary/60" />
                {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer"><Button size="sm" variant="ghost"><Download className="w-4 h-4" /></Button></a>}
              </div>
              <h3 className="font-heading font-semibold">{d.title}</h3>
              <p className="text-xs text-primary/70 mt-0.5">{formatType(d.type)}{d.year ? ` · ${d.year}` : ""}</p>
              {d.description && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{d.description}</p>}
              {d.member_id && <p className="text-xs text-muted-foreground mt-2">Related: {getName(d.member_id)}</p>}
              {(d.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {d.tags.map(t => <span key={t} className="inline-flex items-center gap-0.5 bg-accent text-[10px] px-1.5 py-0.5 rounded"><Tag className="w-2.5 h-2.5" />{t}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}