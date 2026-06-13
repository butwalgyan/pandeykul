import { useState, useEffect } from "react";
import { authService, contentSubmissionService, familyMemberService, notificationService } from "@/services";
import { CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, User, Shield, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const STATUS_STYLES = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

const TYPE_LABELS = {
  add: "New Info",
  edit: "Edit Request",
  verify: "Verification",
};

function SubmissionCard({ sub, memberName, onAction, currentUser }) {
  const [expanded, setExpanded] = useState(false);
  const [adminComment, setAdminComment] = useState("");
  const [acting, setActing] = useState(null);
  const isPending = sub.status === "pending";

  const act = async (action) => {
    setActing(action);
    await onAction(sub, action, adminComment);
    setActing(null);
    setAdminComment("");
  };

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2 py-0.5 ${STATUS_STYLES[sub.status]}`}>
                {sub.status}
              </span>
              <span className="text-[10px] bg-accent text-accent-foreground border border-border rounded-full px-2 py-0.5 uppercase tracking-wider font-medium">
                {TYPE_LABELS[sub.submission_type] || sub.submission_type}
              </span>
            </div>

            <h3 className="font-heading font-semibold text-base">
              {memberName || sub.related_family_member_id}
              {sub.field_name && <span className="text-muted-foreground font-normal text-sm"> — {sub.field_name}</span>}
            </h3>

            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{sub.submitted_by_name || sub.submitted_by_email}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : new Date(sub.created_date).toLocaleString()}</span>
            </div>
          </div>

          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-accent shrink-0">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-4 space-y-3 text-sm border-t border-border pt-4">
            {sub.submission_type === "edit" && (
              <>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-red-600 mb-1">Old Value</p>
                  <p className="text-red-700 whitespace-pre-wrap">{sub.old_value || <span className="italic text-muted-foreground">empty</span>}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-green-600 mb-1">Proposed Value</p>
                  <p className="text-green-700 font-medium whitespace-pre-wrap">{sub.proposed_value}</p>
                </div>
              </>
            )}
            {sub.submission_type === "verify" && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-blue-600 mb-1">Value to Verify</p>
                <p className="text-blue-700 whitespace-pre-wrap">{sub.old_value || <span className="italic text-muted-foreground">empty</span>}</p>
              </div>
            )}
            {sub.submission_type === "add" && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-primary mb-2">Proposed New Member</p>
                {(() => {
                  try {
                    const d = JSON.parse(sub.proposed_value);
                    return (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        {Object.entries(d).filter(([, v]) => v && (typeof v === "string" ? v.trim() : true) && !["parent_ids","spouse_ids","photos"].includes(Object.keys(d)[Object.values(d).indexOf(v)])).map(([k, v]) => (
                          <div key={k}>
                            <span className="text-muted-foreground capitalize">{k.replace(/_/g," ")}: </span>
                            <span className="font-medium">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                          </div>
                        ))}
                        {d.parent_ids?.length > 0 && <div className="col-span-2"><span className="text-muted-foreground">Parent IDs: </span><span className="font-medium">{d.parent_ids.join(", ")}</span></div>}
                      </div>
                    );
                  } catch {
                    return <p className="whitespace-pre-wrap">{sub.proposed_value}</p>;
                  }
                })()}
              </div>
            )}
            {sub.reason_or_note && (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mb-1">Note from submitter</p>
                <p className="text-foreground">{sub.reason_or_note}</p>
              </div>
            )}
          </div>
        )}

        {isPending && (
          <div className="mt-4 space-y-2 pt-4 border-t border-border">
            <Textarea
              placeholder="Admin comment (optional for approve, recommended for reject)..."
              value={adminComment}
              onChange={e => setAdminComment(e.target.value)}
              rows={2}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" className="gap-1.5 flex-1 bg-green-600 hover:bg-green-700" onClick={() => act("approved")} disabled={!!acting}>
                {acting === "approved" ? <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full inline-block" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Approve
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 flex-1 border-red-300 text-red-600 hover:bg-red-50" onClick={() => act("rejected")} disabled={!!acting}>
                {acting === "rejected" ? <span className="animate-spin w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full inline-block" /> : <XCircle className="w-3.5 h-3.5" />}
                Reject
              </Button>
            </div>
          </div>
        )}

        {sub.admin_comment && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm">
            <span className="font-medium text-xs uppercase tracking-wider text-muted-foreground">Admin Comment: </span>
            {sub.admin_comment}
          </div>
        )}

        {sub.reviewed_by && (
          <p className="mt-2 text-xs text-muted-foreground">Reviewed by {sub.reviewed_by} · {sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleString() : ""}</p>
        )}
      </div>
    </div>
  );
}

export default function PendingApprovals() {
  const [submissions, setSubmissions] = useState([]);
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");

  const load = async () => {
    setLoading(true);
    try {
      const [u, subs, mems] = await Promise.all([
        authService.me().catch(() => null),
        contentSubmissionService.list("-created_at", 500).catch(() => []),
        familyMemberService.list("-created_at", 300).catch(() => []),
      ]);
      setUser(u);
      setSubmissions(subs);
      setMembers(mems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (sub, action, adminComment) => {
    const now = new Date().toISOString();

    if (action === "approved") {
      if (sub.submission_type === "add") {
        // Create a brand new FamilyMember from the submitted JSON
        try {
          const proposedData = JSON.parse(sub.proposed_value);
          const created = await familyMemberService.create({
            ...proposedData,
            record_status: "approved",
            created_by_email: sub.submitted_by_email,
            last_updated_by: user?.email || "Admin",
          });
          await notificationService.create({
            message: `${proposedData.full_name || "New member"} was added to the family tree`,
            type: "new_member",
            related_member_id: created.id,
          });
        } catch (e) {
          toast.error("Failed to parse submission data. Please check the submission.");
          return;
        }
      } else if (sub.submission_type === "edit" && sub.related_family_member_id && sub.field_name && sub.field_name !== "multiple_fields") {
        // Single field edit
        await familyMemberService.update(sub.related_family_member_id, {
          [sub.field_name]: sub.proposed_value,
          last_updated_by: user?.email || "Admin",
        });
      } else if (sub.submission_type === "edit" && sub.field_name === "multiple_fields") {
        // Multi-field edit from the AddEditMember form
        try {
          const proposedData = JSON.parse(sub.proposed_value);
          await familyMemberService.update(sub.related_family_member_id, {
            ...proposedData,
            last_updated_by: user?.email || "Admin",
          });
        } catch (e) {
          toast.error("Failed to parse submission data.");
          return;
        }
      }
    }

    const updated = await contentSubmissionService.update(sub.id, {
      status: action,
      admin_comment: adminComment || "",
      reviewed_by: user?.full_name || user?.email || "Admin",
      reviewed_at: now,
    });

    setSubmissions(prev => prev.map(s => s.id === sub.id ? updated : s));

    if (action === "approved") toast.success("Approved! Changes applied to the family tree.");
    else toast.info("Submission rejected.");
  };

  const getMemberName = (id) => members.find(m => m.id === id)?.full_name || id;

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;

  if (user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center h-96 text-center p-6">
        <div>
          <Shield className="w-12 h-12 text-destructive/40 mx-auto mb-3" />
          <h2 className="font-heading text-xl font-bold mb-2">Admin Only</h2>
          <p className="text-muted-foreground">Only admins can access this page.</p>
        </div>
      </div>
    );
  }

  const filtered = filter === "all" ? submissions : submissions.filter(s => s.status === filter);
  const pendingCount = submissions.filter(s => s.status === "pending").length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" /> Pending Approvals</h1>
          <p className="text-sm text-muted-foreground mt-1">Review, approve, or reject family member submissions.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Refresh</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { key: "pending", label: "Pending", color: "text-yellow-700 bg-yellow-50 border-yellow-200" },
          { key: "approved", label: "Approved", color: "text-green-700 bg-green-50 border-green-200" },
          { key: "rejected", label: "Rejected", color: "text-red-700 bg-red-50 border-red-200" },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-xl border p-3 text-center cursor-pointer transition-all ${color} ${filter === key ? "ring-2 ring-primary" : ""}`}
          >
            <p className="text-2xl font-bold">{submissions.filter(s => s.status === key).length}</p>
            <p className="text-xs font-medium mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      <div className="flex gap-2 mb-4">
        <Button size="sm" variant={filter === "all" ? "default" : "outline"} onClick={() => setFilter("all")}>All ({submissions.length})</Button>
        {pendingCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-full px-3 py-1 font-medium">
            <Clock className="w-3 h-3" /> {pendingCount} awaiting review
          </span>
        )}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No submissions in this category.</p>
          </div>
        ) : (
          filtered.map(sub => (
            <SubmissionCard
              key={sub.id}
              sub={sub}
              memberName={getMemberName(sub.related_family_member_id)}
              onAction={handleAction}
              currentUser={user}
            />
          ))
        )}
      </div>
    </div>
  );
}