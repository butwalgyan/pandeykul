import { useState, useEffect } from "react";
import { authService, invitationService, integrationService } from "@/services";
import StatCard from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Clock, CheckCircle, UserPlus, Trash2, Facebook } from "lucide-react";
import { toast } from "sonner";

export default function Invitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "user", message: "" });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    Promise.all([
      invitationService.list("-created_at", 100).catch(() => []),
      authService.me()
    ]).then(([invites, user]) => {
      setInvitations(invites);
      setCurrentUser(user);
    }).finally(() => setLoading(false));
  }, []);

  const sendInvite = async () => {
    if (!form.email) return;
    setSending(true);
    try {
      await authService.inviteUser(form.email, form.role);

      const appUrl = window.location.origin;
      const personalNote = form.message ? `Personal note: "${form.message}"\n\n` : "";
      const body = [
        `Hello${form.name ? ` ${form.name}` : ""},`,
        "",
        "You have been invited to join our family archive - The Legacy Book.",
        "",
        personalNote + "This is a private space where our family preserves memories, stories, photos, and documents for generations to come.",
        "",
        `Click the link below to create your account:\n${appUrl}`,
        "",
        "Once registered, you can:",
        "- View and manage your own profile",
        "- Add family stories and memories",
        "- Upload photos and documents",
        "- Explore the family tree",
        "",
        `With love,\n${currentUser?.full_name || "The Family Admin"}`
      ].join("\n");

      await integrationService.sendEmail({
        to: form.email,
        subject: "You're invited to The Legacy Book - Family Archive",
        body,
        from_name: "The Legacy Book"
      });

      const invite = await invitationService.create({
        email: form.email,
        name: form.name,
        role: form.role,
        message: form.message,
        status: "pending",
        invited_by: currentUser?.email || ""
      });

      setInvitations(prev => [invite, ...prev]);
      setForm({ email: "", name: "", role: "user", message: "" });
      toast.success(`Invitation sent to ${form.email}`);
    } catch (err) {
      toast.error("Failed to send invitation. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const deleteInvite = async (id) => {
    await invitationService.delete(id);
    setInvitations(prev => prev.filter(i => i.id !== id));
    toast.success("Invitation removed");
  };

  const pendingCount = invitations.filter(i => i.status === "pending").length;
  const acceptedCount = invitations.filter(i => i.status === "accepted").length;

  const shareOnFacebook = () => {
    const appUrl = window.location.origin;
    const message = `Join our family archive - The Legacy Book! Preserve our family's memories, stories, photos, and documents for generations to come. ${appUrl}`;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(message)}`;
    window.open(facebookUrl, "_blank", "width=600,height=400");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold text-foreground">Invite Family Members</h1>
        <p className="text-muted-foreground mt-1">Send email invitations so family members can register and contribute.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Mail} label="Total Invites" value={invitations.length} color="text-primary" />
        <StatCard icon={Clock} label="Pending" value={pendingCount} color="text-amber-500" />
        <StatCard icon={CheckCircle} label="Accepted" value={acceptedCount} color="text-green-600" />
      </div>

      <div className="bg-card border border-border rounded-xl p-6 mb-8">
        <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-primary" /> Send New Invitation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email Address *</label>
            <Input
              type="email"
              placeholder="family@example.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Name (optional)</label>
            <Input
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Role</label>
            <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Member - can view and contribute</SelectItem>
                <SelectItem value="admin">Admin - full access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mb-4">
          <label className="text-sm font-medium mb-1.5 block">Personal Message (optional)</label>
          <Textarea
            placeholder="Add a warm personal note to include in the invitation email..."
            value={form.message}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            rows={3}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={sendInvite} disabled={!form.email || sending} className="gap-2">
            <Send className="w-4 h-4" /> {sending ? "Sending..." : "Send Invitation"}
          </Button>
          <Button onClick={shareOnFacebook} className="gap-2" style={{ background: "#1877F2", color: "white" }}>
            <Facebook className="w-4 h-4" /> Share on Facebook
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-heading font-semibold text-lg mb-4">Sent Invitations</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : invitations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No invitations sent yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map(invite => (
              <div key={invite.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{invite.name || invite.email}</p>
                    {invite.name && <p className="text-xs text-muted-foreground">{invite.email}</p>}
                    <p className="text-xs text-muted-foreground capitalize">
                      Role: {invite.role} &bull; {new Date(invite.created_date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${invite.status === "accepted" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                    {invite.status === "accepted" ? "Accepted" : "Pending"}
                  </span>
                  <Button size="icon" variant="ghost" className="w-7 h-7 text-muted-foreground hover:text-destructive" onClick={() => deleteInvite(invite.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
