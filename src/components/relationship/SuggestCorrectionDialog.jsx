import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { contentSubmissionService } from "@/services";
import { toast } from "sonner";

function getName(id, members) {
  return members.find(m => m.id === id)?.full_name || "Unknown";
}

export default function SuggestCorrectionDialog({ person1Id, person2Id, members, user, onClose }) {
  const p1Name = getName(person1Id, members);
  const p2Name = getName(person2Id, members);

  const [form, setForm] = useState({
    rel_p1_to_p2: "",
    rel_p2_to_p1: "",
    nepali_term: "",
    explanation: "",
    source: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.rel_p1_to_p2 && !form.rel_p2_to_p1) {
      toast.error("Please fill in at least one relationship direction.");
      return;
    }
    setSubmitting(true);

    const proposedValue = JSON.stringify({
      rel_p1_to_p2: form.rel_p1_to_p2,
      rel_p2_to_p1: form.rel_p2_to_p1,
      nepali_term: form.nepali_term,
      source: form.source,
    });

    await contentSubmissionService.create({
      submitted_by_email: user.email,
      submitted_by_name: user.full_name,
      related_family_member_id: person1Id,
      submission_type: "verify",
      field_name: `relationship_correction:${person2Id}`,
      old_value: `${p1Name} ↔ ${p2Name}`,
      proposed_value: proposedValue,
      reason_or_note: form.explanation,
      status: "pending",
      submitted_at: new Date().toISOString(),
    });

    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Suggest Correct Relationship</DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center space-y-2">
            <p className="text-2xl">✅</p>
            <p className="font-semibold text-foreground">Suggestion submitted!</p>
            <p className="text-sm text-muted-foreground">An admin will review your correction before it is shown publicly.</p>
            <Button className="mt-4" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              You are suggesting the relationship between{" "}
              <span className="font-semibold text-foreground">{p1Name}</span> and{" "}
              <span className="font-semibold text-foreground">{p2Name}</span>.
            </p>

            <div>
              <label className="text-sm font-medium mb-1 block">
                From <span className="text-primary">{p1Name}</span>'s view, {p2Name} is their…
              </label>
              <Input
                placeholder="e.g. Kaka (Paternal Uncle)"
                value={form.rel_p1_to_p2}
                onChange={e => update("rel_p1_to_p2", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">
                From <span className="text-primary">{p2Name}</span>'s view, {p1Name} is their…
              </label>
              <Input
                placeholder="e.g. Bhatija (Nephew)"
                value={form.rel_p2_to_p1}
                onChange={e => update("rel_p2_to_p1", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Nepali relationship term</label>
              <Input
                placeholder="e.g. काका / भतिजा"
                value={form.nepali_term}
                onChange={e => update("nepali_term", e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Explanation or note</label>
              <Textarea
                placeholder="Explain why this is the correct relationship…"
                value={form.explanation}
                onChange={e => update("explanation", e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1 block">Source / Family elder who confirmed it</label>
              <Input
                placeholder="e.g. Confirmed by Ram Prasad Pandey (grandfather)"
                value={form.source}
                onChange={e => update("source", e.target.value)}
              />
            </div>

            <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
              Your suggestion will go to admin approval before being shown publicly.
            </p>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Submit suggestion"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}