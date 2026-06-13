import { useState } from "react";
import { contentSubmissionService } from "@/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const EDITABLE_FIELDS = [
  { value: "full_name", label: "Full Name" },
  { value: "nickname", label: "Nickname" },
  { value: "date_of_birth", label: "Date of Birth" },
  { value: "date_of_death", label: "Date of Death" },
  { value: "birthplace", label: "Birthplace" },
  { value: "current_location", label: "Current Location" },
  { value: "occupation", label: "Occupation" },
  { value: "education", label: "Education" },
  { value: "biography", label: "Biography" },
  { value: "achievements", label: "Achievements" },
  { value: "blood_group", label: "Blood Group" },
  { value: "mobile_number", label: "Mobile Number" },
  { value: "email", label: "Email" },
  { value: "facebook_url", label: "Facebook URL" },
];

export default function SuggestEditDialog({ open, onClose, member, currentUser }) {
  const [fieldName, setFieldName] = useState("");
  const [proposedValue, setProposedValue] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const oldValue = fieldName ? (member?.[fieldName] ?? "") : "";

  const handleSubmit = async () => {
    if (!fieldName || !proposedValue.trim()) return;
    setSubmitting(true);
    await contentSubmissionService.create({
      submitted_by_email: currentUser.email,
      submitted_by_name: currentUser.full_name,
      related_family_member_id: member.id,
      submission_type: "edit",
      field_name: fieldName,
      old_value: String(oldValue),
      proposed_value: proposedValue.trim(),
      reason_or_note: reason.trim(),
      status: "pending",
      submitted_at: new Date().toISOString(),
    });
    setSubmitting(false);
    toast.success("Your submission has been sent to admin for approval.");
    setFieldName(""); setProposedValue(""); setReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest an Edit</DialogTitle>
          <p className="text-sm text-muted-foreground">Propose a correction for <strong>{member?.full_name}</strong>. An admin will review before applying.</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Field to edit</label>
            <Select value={fieldName} onValueChange={v => { setFieldName(v); setProposedValue(""); }}>
              <SelectTrigger><SelectValue placeholder="Select a field..." /></SelectTrigger>
              <SelectContent>
                {EDITABLE_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {fieldName && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Current value</label>
              <p className="text-sm bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground">{oldValue || <span className="italic">empty</span>}</p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Proposed value</label>
            <Input value={proposedValue} onChange={e => setProposedValue(e.target.value)} placeholder="Enter the correct value..." />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason / Note <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} rows={2} placeholder="Why is this change needed?" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!fieldName || !proposedValue.trim() || submitting}>
            {submitting ? "Submitting..." : "Submit for Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}