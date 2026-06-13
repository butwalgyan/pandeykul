import { useState } from "react";
import { contentSubmissionService } from "@/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const VERIFIABLE_FIELDS = [
  { value: "full_name", label: "Full Name" },
  { value: "date_of_birth", label: "Date of Birth" },
  { value: "birthplace", label: "Birthplace" },
  { value: "current_location", label: "Current Location" },
  { value: "occupation", label: "Occupation" },
  { value: "education", label: "Education" },
  { value: "blood_group", label: "Blood Group" },
  { value: "biography", label: "Biography" },
];

export default function VerifyInfoDialog({ open, onClose, member, currentUser }) {
  const [fieldName, setFieldName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!fieldName) return;
    setSubmitting(true);
    await contentSubmissionService.create({
      submitted_by_email: currentUser.email,
      submitted_by_name: currentUser.full_name,
      related_family_member_id: member.id,
      submission_type: "verify",
      field_name: fieldName,
      old_value: String(member?.[fieldName] ?? ""),
      proposed_value: String(member?.[fieldName] ?? ""),
      reason_or_note: note.trim(),
      status: "pending",
      submitted_at: new Date().toISOString(),
    });
    setSubmitting(false);
    toast.success("Your verification request has been sent to admin for approval.");
    setFieldName(""); setNote("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Verify This Information</DialogTitle>
          <p className="text-sm text-muted-foreground">Confirm that a specific field is accurate for <strong>{member?.full_name}</strong>. An admin will mark it as verified.</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Field to verify</label>
            <Select value={fieldName} onValueChange={setFieldName}>
              <SelectTrigger><SelectValue placeholder="Select a field..." /></SelectTrigger>
              <SelectContent>
                {VERIFIABLE_FIELDS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {fieldName && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Current value</label>
              <p className="text-sm bg-muted/50 rounded-lg px-3 py-2 text-muted-foreground">
                {member?.[fieldName] || <span className="italic">empty</span>}
              </p>
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Note <span className="text-muted-foreground font-normal">(optional)</span></label>
            <Textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="e.g. I am this person, confirming this is correct." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!fieldName || submitting}>
            {submitting ? "Submitting..." : "Submit Verification"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}