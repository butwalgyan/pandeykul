import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { authService, familyMemberService, pickFamilyMemberPayload, notificationService, integrationService, relationshipService, normalizeParentId } from "@/services";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Save, Upload, User, Link2, Leaf, BookOpen, Check, Lock, Send } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "Basic Info", icon: User },
  { id: 2, label: "Family Links", icon: Link2 },
  { id: 3, label: "Heritage", icon: Leaf },
  { id: 4, label: "Personal", icon: BookOpen },
];

const GOTRAS = ["Bharadwaj", "Kashyap", "Vashishtha", "Atri", "Gautam", "Jamadagni", "Vishwamitra", "Agastya", "Other"];

const EMPTY_MEMBERS_MESSAGE =
  "No existing members yet. Add the oldest known ancestor first, then connect parents/spouses later.";

function isApprovedMember(member) {
  return !member.record_status || member.record_status === "approved";
}

function sortByName(a, b) {
  return (a.full_name || "").localeCompare(b.full_name || "");
}

function fatherOptions(members) {
  return members
    .filter(m => m.gender !== "female")
    .sort((a, b) => {
      const rank = (m) => (m.gender === "male" ? 0 : 1);
      return rank(a) - rank(b) || sortByName(a, b);
    });
}

function motherOptions(members) {
  return members
    .filter(m => m.gender !== "male")
    .sort((a, b) => {
      const rank = (m) => (m.gender === "female" ? 0 : 1);
      return rank(a) - rank(b) || sortByName(a, b);
    });
}

export default function AddEditMember() {
  const { memberId } = useParams();
  const isEdit = memberId && memberId !== "new";
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [allMembers, setAllMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    full_name: "", gender: "", date_of_birth: "", profile_photo: "",
    father_id: "", mother_id: "", spouse_ids: [],
    gotra: "", ancestral_village: "", branch: "",
    occupation: "", education: "", biography: "", mobile_number: "",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const user = await authService.me().catch(() => null);

        let members = [];
        try {
          members = await familyMemberService.list("-created_at", 300);
        } catch {
          members = [];
        }

        if (cancelled) return;

        setCurrentUser(user);
        setIsAdmin(user?.role === "admin");
        setAllMembers(members.filter(isApprovedMember));

        if (isEdit) {
          try {
            const m = await familyMemberService.get(memberId);
            if (cancelled) return;

            const parents = m.parent_ids || [];
            const maleParents = members.filter(p => parents.includes(p.id) && p.gender === "male");
            const femaleParents = members.filter(p => parents.includes(p.id) && p.gender === "female");
            setForm({
              full_name: m.full_name || "",
              gender: m.gender || "",
              date_of_birth: m.date_of_birth || "",
              profile_photo: m.profile_photo || "",
              father_id: maleParents[0]?.id || "",
              mother_id: femaleParents[0]?.id || "",
              spouse_ids: m.spouse_ids || [],
              gotra: m.gotra || "",
              ancestral_village: m.ancestral_village || "",
              branch: m.branch || "",
              occupation: m.occupation || "",
              education: m.education || "",
              biography: m.biography || "",
              mobile_number: m.mobile_number || "",
            });
          } catch {
            // Member not found — form stays at defaults; page still renders
          }
        }
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [memberId, isEdit]);

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const { file_url } = await integrationService.uploadFile({ file });
    update("profile_photo", file_url);
    setPhotoUploading(false);
  };

  const calcGeneration = async (fatherId, motherId) => {
    const parentId = fatherId || motherId;
    if (!parentId) return undefined;
    const parent = allMembers.find(m => m.id === parentId);
    if (parent?.generation) return parent.generation + 1;
    return undefined;
  };

  const buildFamilyMemberPayload = async () => {
    const generation = await calcGeneration(form.father_id, form.mother_id);
    const fatherId = normalizeParentId(form.father_id);
    const motherId = normalizeParentId(form.mother_id);
    return pickFamilyMemberPayload({
      full_name: form.full_name.trim(),
      gender: form.gender || undefined,
      date_of_birth: form.date_of_birth || undefined,
      biography: form.biography || undefined,
      branch: form.branch || undefined,
      birthplace: form.ancestral_village || undefined,
      generation,
      verification_status: 'approved',
      ...(fatherId ? { father_id: fatherId } : {}),
      ...(motherId ? { mother_id: motherId } : {}),
    });
  };

  const ensureAuthSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("[AddEditMember] auth session check failed:", error);
      throw error;
    }
    if (!session?.user) {
      const err = new Error("Not signed in — Supabase insert will be blocked by RLS");
      console.error("[AddEditMember]", err.message);
      throw err;
    }
    console.log("[AddEditMember] auth session:", session.user.id, session.user.email);
    return session;
  };

  // Admin: direct insert into family_members
  const adminSave = async () => {
    setSaving(true);
    const table = "family_members";
    console.log(`[AddEditMember] submit path: ${table} (admin direct insert)`);

    try {
      await ensureAuthSession();
      const payload = await buildFamilyMemberPayload();
      console.log(`[AddEditMember] FINAL insert payload → ${table}:`, payload);

      if (isEdit) {
        const { data, error } = await supabase
          .from(table)
          .update(payload)
          .eq("id", memberId)
          .select()
          .single();

        console.log(`[AddEditMember] Supabase update response → ${table}:`, { data, error });

        if (error) {
          console.error(`[AddEditMember] Supabase update failed → ${table}:`, {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }
        if (!data?.id) throw new Error("Update returned no row");

        if (form.spouse_ids?.length > 0) {
          await relationshipService.createSpouseLinks(data.id, form.spouse_ids);
        }

        toast.success("Member updated successfully");
        navigate(`/member/${memberId}`);
      } else {
        const { data, error } = await supabase
          .from(table)
          .insert(payload)
          .select()
          .single();

        console.log(`[AddEditMember] Supabase insert response → ${table}:`, { data, error });

        if (error) {
          console.error(`[AddEditMember] Supabase insert failed → ${table}:`, {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });
          throw error;
        }
        if (!data?.id) throw new Error("Insert returned no row");

        if (form.spouse_ids?.length > 0) {
          try {
            await relationshipService.createSpouseLinks(data.id, form.spouse_ids);
          } catch (relError) {
            console.error("[AddEditMember] member saved but spouse insert failed:", relError);
            throw new Error(
              `${payload.full_name} was saved, but spouse relationship insert failed: ${relError.message || "unknown error"}.`,
            );
          }
        }

        try {
          await notificationService.create({
            message: `${payload.full_name} was added to the family tree`,
            type: "new_member",
            related_member_id: data.id,
          });
        } catch {
          // notifications table may not exist yet
        }
        toast.success(`${payload.full_name} was added to the family tree`);
        navigate(`/member/${data.id}`);
      }
    } catch (error) {
      console.error("[AddEditMember] family_members save failed:", error);
      toast.error(error.message?.includes("RLS") || error.message?.includes("row-level security")
        ? "Save blocked by database permissions. Ask an admin to enable insert policies."
        : "Failed to save member. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Non-admin: insert into change_requests (not family_members)
  const userSubmit = async () => {
    setSaving(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error("Supabase insert error:", authError);
        throw authError;
      }
      if (!user) {
        const err = new Error("Not signed in — cannot submit change request");
        console.error("Supabase insert error:", err);
        throw err;
      }

      const generation = await calcGeneration(form.father_id, form.mother_id);
      const fatherId = normalizeParentId(form.father_id);
      const motherId = normalizeParentId(form.mother_id);

      const newData = {
        full_name: form.full_name.trim(),
        nepali_name: null,
        gender: form.gender || null,
        date_of_birth: form.date_of_birth || null,
        date_of_death: null,
        birthplace: form.ancestral_village || null,
        current_location: null,
        father_id: fatherId ?? null,
        mother_id: motherId ?? null,
        spouse_ids: form.spouse_ids || [],
        generation: generation ?? null,
        branch: form.branch || null,
        profile_photo_url: form.profile_photo || null,
        biography: form.biography || null,
      };

      const PENDING_STATUS = "pending";

      const payload = {
        member_id: isEdit ? memberId : null,
        requested_by: user.id,
        change_type: isEdit ? "update" : "create",
        old_data: null,
        new_data: newData,
        admin_note: null,
        status: PENDING_STATUS,
      };

      console.log("Submitting change request:", payload);

      const { data, error } = await supabase
        .from("change_requests")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Supabase insert error:", error);
        throw error;
      }
      if (!data?.id) throw new Error("Insert returned no row");

      let saved = data;
      if (saved.status !== PENDING_STATUS) {
        const { data: patched, error: patchError } = await supabase
          .from("change_requests")
          .update({ status: PENDING_STATUS })
          .eq("id", saved.id)
          .select()
          .single();

        if (patchError) {
          console.error("Supabase insert error:", patchError);
          throw patchError;
        }
        saved = patched;
      }

      console.log("Supabase response:", saved);

      if (saved.status !== PENDING_STATUS) {
        throw new Error(`Change request saved but status is "${saved.status}" instead of "${PENDING_STATUS}"`);
      }

      toast.success("Submitted for admin approval.");
      setSubmitted(true);
    } catch (error) {
      console.error("[AddEditMember] change_requests submit failed:", error);
      toast.error(error.message?.includes("RLS") || error.message?.includes("row-level security")
        ? "Submit blocked by database permissions. Ask an admin to enable insert policies."
        : "Failed to submit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const approvedOthers = allMembers.filter(m => m.id !== memberId);
  const males = fatherOptions(approvedOthers);
  const females = motherOptions(approvedOthers);
  const canProceed = step === 1 ? !!form.full_name.trim() : true;

  // Success state for non-admin submission
  if (submitted) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <div className="bg-card border border-border rounded-xl p-10 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-heading text-2xl font-semibold">Submitted for admin approval.</h2>
          <p className="text-muted-foreground max-w-sm">
            Your request to {isEdit ? "update" : "add"} <strong>{form.full_name}</strong> was saved to <strong>change_requests</strong>.
            It will appear in the family tree once an admin approves it.
          </p>
          <Button onClick={() => navigate("/tree")} className="mt-2">Back to Family Tree</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link to={isEdit ? `/member/${memberId}` : "/tree"} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6">
        <ChevronLeft className="w-4 h-4" /> Back
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <h1 className="font-heading text-2xl font-bold">{isEdit ? "Edit Member" : "Add Family Member"}</h1>
        {!isAdmin && (
          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            <Lock className="w-3 h-3" /> Requires Admin Approval
          </span>
        )}
      </div>

      {!isAdmin && (
        <p className="text-sm text-muted-foreground mb-6 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          As a family member, your {isEdit ? "edits" : "additions"} will be reviewed by an admin before becoming visible in the tree.
        </p>
      )}

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = step === s.id;
          const done = step > s.id;
          return (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => done && setStep(s.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${active ? "bg-primary text-primary-foreground" : done ? "bg-accent text-foreground cursor-pointer" : "bg-muted text-muted-foreground"}`}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 transition-colors ${done ? "bg-primary/40" : "bg-border"}`} />}
            </div>
          );
        })}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 space-y-5">
        {/* Step 1: Basic Info */}
        {step === 1 && (
          <>
            <h2 className="font-heading font-semibold text-lg">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
                <Input value={form.full_name} onChange={e => update("full_name", e.target.value)} placeholder="Enter full name" autoFocus />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Gender</label>
                <Select value={form.gender} onValueChange={v => update("gender", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date of Birth</label>
                <Input type="date" value={form.date_of_birth} onChange={e => update("date_of_birth", e.target.value)} />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Photo</label>
              <div className="flex items-center gap-4">
                {form.profile_photo
                  ? <img src={form.profile_photo} className="w-20 h-20 rounded-xl object-cover border border-border" />
                  : <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center"><User className="w-8 h-8 text-muted-foreground" /></div>
                }
                <label className="cursor-pointer border-2 border-dashed border-border rounded-xl px-5 py-3 text-sm text-muted-foreground hover:border-primary/50 transition-colors flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {photoUploading ? "Uploading..." : "Upload Photo"}
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={photoUploading} />
                </label>
              </div>
            </div>
          </>
        )}

        {/* Step 2: Family Links */}
        {step === 2 && (
          <>
            <h2 className="font-heading font-semibold text-lg">Family Links</h2>
            <p className="text-sm text-muted-foreground">Connect this person to existing family members. All fields are optional.</p>
            {approvedOthers.length === 0 && (
              <p className="text-sm text-muted-foreground p-3 bg-muted/50 border border-border rounded-lg">
                {EMPTY_MEMBERS_MESSAGE}
              </p>
            )}
            <div className="space-y-4">
              <MemberSelect label="Father (optional)" value={form.father_id} options={males} onChange={v => update("father_id", v)} placeholder="Select father (optional)" />
              <MemberSelect label="Mother (optional)" value={form.mother_id} options={females} onChange={v => update("mother_id", v)} placeholder="Select mother (optional)" />
              <MultiSpouseSelect label="Spouse(s) (optional)" value={form.spouse_ids} options={approvedOthers} onChange={v => update("spouse_ids", v)} emptyMessage={approvedOthers.length === 0 ? EMPTY_MEMBERS_MESSAGE : "No other members yet"} />
            </div>
          </>
        )}

        {/* Step 3: Heritage */}
        {step === 3 && (
          <>
            <h2 className="font-heading font-semibold text-lg">Heritage</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Gotra</label>
                <Select value={form.gotra} onValueChange={v => update("gotra", v)}>
                  <SelectTrigger><SelectValue placeholder="Select gotra" /></SelectTrigger>
                  <SelectContent>
                    {GOTRAS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Ancestral Village</label>
                <Input value={form.ancestral_village} onChange={e => update("ancestral_village", e.target.value)} placeholder="e.g. Reoti, Ballia" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Branch</label>
                <Input value={form.branch} onChange={e => update("branch", e.target.value)} placeholder="e.g. Lucknow branch" />
              </div>
            </div>
          </>
        )}

        {/* Step 4: Personal */}
        {step === 4 && (
          <>
            <h2 className="font-heading font-semibold text-lg">Personal Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Occupation</label>
                <Input value={form.occupation} onChange={e => update("occupation", e.target.value)} placeholder="e.g. Engineer, Teacher" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Education</label>
                <Input value={form.education} onChange={e => update("education", e.target.value)} placeholder="e.g. IIT Delhi, B.A." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Contact Number</label>
                <Input value={form.mobile_number} onChange={e => update("mobile_number", e.target.value)} placeholder="e.g. +91 98765 43210" type="tel" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Biography</label>
                <Textarea value={form.biography} onChange={e => update("biography", e.target.value)} rows={5} placeholder="Share their life story, memories, achievements..." />
              </div>
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
          <ChevronLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        {step < 4 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed}>
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        ) : isAdmin ? (
          <Button onClick={adminSave} disabled={!form.full_name || saving} className="gap-2">
            <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Member"}
          </Button>
        ) : (
          <Button onClick={userSubmit} disabled={!form.full_name || saving} className="gap-2 bg-amber-600 hover:bg-amber-700">
            <Send className="w-4 h-4" /> {saving ? "Submitting..." : "Submit for Approval"}
          </Button>
        )}
      </div>
    </div>
  );
}

const NONE_VALUE = "__none__";

function MemberSelect({ label, value, options, onChange, placeholder }) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <Select
        value={value || NONE_VALUE}
        onValueChange={v => onChange(v === NONE_VALUE ? "" : v)}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>None (optional)</SelectItem>
          {options.map(m => (
            <SelectItem key={m.id} value={m.id}>
              {m.full_name}{m.date_of_birth ? ` (b. ${m.date_of_birth.slice(0, 4)})` : ""}{!m.gender ? " (gender unknown)" : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function MultiSpouseSelect({ label, value = [], options, onChange, emptyMessage }) {
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter(v => v !== id));
    else onChange([...value, id]);
  };
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">{label}</label>
      <div className="border border-input rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
        {options.length === 0 && <p className="text-sm text-muted-foreground">{emptyMessage}</p>}
        {options.map(m => (
          <label key={m.id} className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded-md px-2 py-1">
            <input type="checkbox" checked={value.includes(m.id)} onChange={() => toggle(m.id)} className="rounded" />
            <span className="text-sm">{m.full_name}</span>
            {m.gender && <span className="text-xs text-muted-foreground capitalize">({m.gender})</span>}
          </label>
        ))}
      </div>
    </div>
  );
}