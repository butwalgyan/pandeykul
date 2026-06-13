import { useState, useEffect } from "react";
import { mediaService, familyMemberService, notificationService, integrationService } from "@/services";
import { Image, Plus, Play, ChevronLeft, Folder, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

// Group media into albums by event_name, then by year, then "Uncategorized"
function buildAlbums(media) {
  const albumMap = {};
  media.forEach(m => {
    const key = m.event_name?.trim() || (m.year ? `Year ${m.year}` : "Uncategorized");
    if (!albumMap[key]) albumMap[key] = { name: key, items: [], coverUrl: null, isYear: !m.event_name?.trim() };
    albumMap[key].items.push(m);
    if (!albumMap[key].coverUrl && m.type === "photo") albumMap[key].coverUrl = m.file_url;
  });
  return Object.values(albumMap).sort((a, b) => {
    // Sort year albums numerically descending, events first
    if (!a.isYear && b.isYear) return -1;
    if (a.isYear && !b.isYear) return 1;
    return b.name.localeCompare(a.name);
  });
}

export default function MediaArchive() {
  const [media, setMedia] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [form, setForm] = useState({ title: "", file_url: "", type: "photo", year: "", description: "", event_name: "", tagged_member_ids: [] });
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    Promise.all([
      mediaService.list("-created_at", 200).catch(() => []),
      familyMemberService.list("-created_at", 200).catch(() => []),
    ]).then(([m, mem]) => { setMedia(m); setMembers(mem); }).finally(() => setLoading(false));
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await integrationService.uploadFile({ file });
    const type = file.type.startsWith("video") ? "video" : "photo";
    setForm(f => ({ ...f, file_url, type }));
    setUploading(false);
  };

  const save = async () => {
    const data = { ...form, year: form.year ? Number(form.year) : undefined };
    const created = await mediaService.create(data);
    setMedia([created, ...media]);
    setForm({ title: "", file_url: "", type: "photo", year: "", description: "", event_name: "", tagged_member_ids: [] });
    setOpen(false);
    await notificationService.create({ message: `New ${data.type} uploaded: "${data.title}"`, type: "photo_upload" });
  };

  const getName = (id) => members.find(m => m.id === id)?.full_name;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  const albums = buildAlbums(media);
  const displayItems = activeAlbum ? activeAlbum.items : null;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {activeAlbum && (
            <Button variant="ghost" size="sm" onClick={() => setActiveAlbum(null)} className="gap-1 -ml-2">
              <ChevronLeft className="w-4 h-4" /> Albums
            </Button>
          )}
          <div>
            <h1 className="font-heading text-2xl font-bold">
              {activeAlbum ? activeAlbum.name : "Photo & Media Archive"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {activeAlbum
                ? `${activeAlbum.items.length} item${activeAlbum.items.length !== 1 ? "s" : ""}`
                : "Family photos, videos, and precious memories"}
            </p>
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="w-4 h-4" /> Upload</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-heading">Upload Media</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <Input placeholder="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              <label className="border-2 border-dashed border-border rounded-xl p-6 block text-center cursor-pointer hover:border-primary/50">
                {uploading ? "Uploading..." : form.file_url ? "✓ File ready" : "Click to upload photo or video"}
                <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Year (e.g. 1995)" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
                <Input placeholder="Event name (creates album)" value={form.event_name} onChange={e => setForm(f => ({ ...f, event_name: e.target.value }))} />
              </div>
              <Input placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Tip: Items with the same event name are grouped into an album.</p>
              <Button onClick={save} disabled={!form.title || !form.file_url} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview modal */}
      {preview && (
        <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
          <DialogContent className="max-w-3xl">
            {preview.type === "video"
              ? <video src={preview.file_url} controls className="w-full rounded-lg" />
              : <img src={preview.file_url} className="w-full rounded-lg" />}
            <h3 className="font-heading font-semibold">{preview.title}</h3>
            {preview.description && <p className="text-sm text-muted-foreground">{preview.description}</p>}
            {preview.event_name && <p className="text-xs text-primary font-medium">📅 Event: {preview.event_name}</p>}
            {preview.year && <p className="text-xs text-muted-foreground">Year: {preview.year}</p>}
            {(preview.tagged_member_ids || []).length > 0 && (
              <p className="text-xs text-muted-foreground">Tagged: {preview.tagged_member_ids.map(getName).filter(Boolean).join(", ")}</p>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Empty state */}
      {media.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Image className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>No media yet. Upload your first photo or video.</p>
        </div>
      )}

      {/* Album grid */}
      {!activeAlbum && albums.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {albums.map(album => (
            <div
              key={album.name}
              onClick={() => setActiveAlbum(album)}
              className="group cursor-pointer"
            >
              {/* Album cover */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-accent border border-border mb-2">
                {album.coverUrl ? (
                  <img src={album.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Folder className="w-10 h-10 text-primary/30" />
                  </div>
                )}
                {/* Stacked pages effect */}
                <div className="absolute -bottom-1 -right-1 w-full h-full rounded-xl border border-border bg-accent -z-10 scale-95" />
                <div className="absolute -bottom-2 -right-2 w-full h-full rounded-xl border border-border bg-secondary -z-20 scale-90" />
                {/* Count badge */}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-semibold rounded-full px-2 py-0.5">
                  {album.items.length}
                </div>
              </div>
              <div className="px-1">
                <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">{album.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {album.isYear ? <Calendar className="w-3 h-3" /> : <Folder className="w-3 h-3" />}
                  {album.isYear ? "Year album" : "Event album"} · {album.items.length} item{album.items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items inside an album */}
      {activeAlbum && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayItems.map(m => (
            <div key={m.id} onClick={() => setPreview(m)} className="group relative aspect-square bg-accent rounded-xl overflow-hidden cursor-pointer">
              {m.type === "video" ? (
                <div className="w-full h-full flex items-center justify-center bg-foreground/5"><Play className="w-10 h-10 text-primary/50" /></div>
              ) : (
                <img src={m.file_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                <p className="text-white text-sm font-medium truncate">{m.title}</p>
                {m.year && <p className="text-white/70 text-xs">{m.year}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}