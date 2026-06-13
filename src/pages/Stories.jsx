import { useState, useEffect } from "react";
import { authService, storyService, familyMemberService, contentSubmissionService, notificationService } from "@/services";
import { BookOpen, Plus, X, Clock, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const categories = ["childhood", "migration", "tradition", "recipe", "lesson", "wedding", "other"];

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [editingStory, setEditingStory] = useState(null);
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({ title: "", content: "", category: "other", member_id: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([
      authService.me().catch(() => null),
      storyService.list("-created_at", 100).catch(() => []),
      familyMemberService.list("-created_at", 200).catch(() => []),
    ]).then(([u, s, m]) => { setUser(u); setStories(s); setMembers(m); }).finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setEditingStory(null);
    setForm({ title: "", content: "", category: "other", member_id: "" });
    setSubmitted(false);
    setOpen(true);
  };

  const openEdit = (story, e) => {
    e.stopPropagation();
    setEditingStory(story);
    setForm({ title: story.title, content: story.content, category: story.category || "other", member_id: story.member_id || "" });
    setSubmitted(false);
    setOpen(true);
  };

  const save = async () => {
    if (!user) {
      authService.redirectToLogin();
      return;
    }
    setSubmitting(true);
    await contentSubmissionService.create({
      type: editingStory ? "story_edit" : "story_create",
      status: "pending",
      story_id: editingStory?.id || null,
      submitted_data: form,
      original_data: editingStory ? {
        title: editingStory.title,
        content: editingStory.content,
        category: editingStory.category,
        member_id: editingStory.member_id,
      } : null,
      submitted_by_name: user.full_name,
      submitted_by_id: user.id,
    });
    await notificationService.create({
      message: `New story submission pending review: "${form.title}"`,
      type: "story_added"
    });
    setSubmitting(false);
    setSubmitted(true);
  };

  const filtered = filter === "all" ? stories : stories.filter(s => s.category === filter);
  const getName = (id) => members.find(m => m.id === id)?.full_name;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">{"Stories & Memories"}</h1>
          <p className="text-sm text-muted-foreground mt-1">Preserving family wisdom for future generations</p>
        </div>
        {user ? (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" onClick={openNew}><Plus className="w-4 h-4" /> Add Story</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-heading">{editingStory ? "Edit Story" : "Write a Story"}</DialogTitle>
              </DialogHeader>
              {submitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg">Submitted for Review</h3>
                  <p className="text-sm text-muted-foreground">Your submission has been sent to the admin for approval. It will appear in the stories once approved.</p>
                  <Button variant="outline" onClick={() => setOpen(false)} className="mt-2">Close</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>)}</SelectContent>
                  </Select>
                  <select className="border border-input rounded-lg px-3 py-2 text-sm bg-background w-full" value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}>
                    <option value="">Related to (optional)</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                  </select>
                  <Textarea placeholder="Write your story..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={8} />
                  <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
                    <Clock className="w-4 h-4 shrink-0" />
                    Your story will be reviewed by an admin before it goes live.
                  </div>
                  <Button onClick={save} disabled={!form.title || !form.content || submitting} className="w-full">
                    {submitting ? "Submitting..." : "Submit for Review"}
                  </Button>
                </div>
              )}
            </DialogContent>
          </Dialog>
        ) : (
          <Button className="gap-2" onClick={() => authService.redirectToLogin()}>
            <Plus className="w-4 h-4" /> Sign in to Add Story
          </Button>
        )}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All</Button>
        {categories.map(c => <Button key={c} size="sm" variant={filter === c ? "default" : "outline"} onClick={() => setFilter(c)}>{c.charAt(0).toUpperCase() + c.slice(1)}</Button>)}
      </div>

      {selected ? (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"><X className="w-4 h-4" /> Back to stories</button>
            {user && (
              <Button size="sm" variant="outline" className="gap-1.5" onClick={e => { openEdit(selected, e); setSelected(null); }}>
                <Pencil className="w-3.5 h-3.5" /> Suggest Edit
              </Button>
            )}
          </div>
          <span className="text-[10px] uppercase tracking-wider text-primary font-medium">{selected.category}</span>
          <h2 className="font-heading text-2xl font-bold mt-1 mb-2">{selected.title}</h2>
          {selected.member_id && <p className="text-sm text-muted-foreground mb-4">Related to: {getName(selected.member_id)}</p>}
          <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{selected.content}</p>
          <p className="text-xs text-muted-foreground mt-6">{new Date(selected.created_date).toLocaleDateString()}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <div className="col-span-full text-center py-16 text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No stories yet. Be the first to share a memory.</p>
            </div>
          ) : filtered.map(s => (
            <div key={s.id} onClick={() => setSelected(s)} className="bg-card border border-border rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all">
              <span className="text-[10px] uppercase tracking-wider text-primary font-medium">{s.category}</span>
              <h3 className="font-heading font-semibold mt-1 mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-4">{s.content}</p>
              {s.member_id && <p className="text-xs text-primary/70 mt-3">About: {getName(s.member_id)}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}