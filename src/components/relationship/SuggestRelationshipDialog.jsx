import { useState } from "react";
import { contentSubmissionService } from "@/services";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock } from "lucide-react";

const RELATIONSHIP_TYPES = ["parent", "child", "spouse", "sibling"];

export default function SuggestRelationshipDialog({ members, user, onClose }) {
  const [person1, setPerson1] = useState("");
  const [person2, setPerson2] = useState("");
  const [relType, setRelType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const sorted = [...members].sort((a, b) => a.full_name.localeCompare(b.full_name));

  const submit = async () => {
    setSubmitting(true);
    const p1 = members.find(m => m.id === person1);
    const p2 = members.find(m => m.id === person2);
    await contentSubmissionService.create({
      type: "relationship_suggest",
      status: "pending",
      submitted_data: {
        person_1_id: person1,
        person_1_name: p1?.full_name,
        person_2_id: person2,
        person_2_name: p2?.full_name,
        relationship_type: relType,
      },
      submitted_by_name: user.full_name,
      submitted_by_id: user.id,
    });
    setDone(true);
    setSubmitting(false);
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">Suggest a Relationship</DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <h3 className="font-heading font-semibold text-lg">Submitted for Review</h3>
            <p className="text-sm text-muted-foreground">An admin will review your suggestion before it's applied to the family tree.</p>
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Person 1</label>
              <select
                value={person1}
                onChange={e => setPerson1(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select...</option>
                {sorted.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Relationship (from Person 1 to Person 2)</label>
              <Select value={relType} onValueChange={setRelType}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map(t => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Person 2</label>
              <select
                value={person2}
                onChange={e => setPerson2(e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2.5 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select...</option>
                {sorted.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
              <Clock className="w-4 h-4 shrink-0" />
              Your suggestion will be reviewed by an admin before being applied.
            </div>

            <Button
              onClick={submit}
              disabled={!person1 || !person2 || !relType || person1 === person2 || submitting}
              className="w-full"
            >
              {submitting ? "Submitting..." : "Submit for Review"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}