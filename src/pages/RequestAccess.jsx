import { useState } from 'react';
import { Link } from 'react-router-dom';
import { TreePine, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { accessRequestService } from '@/services';

const INITIAL_FORM = {
  full_name: '',
  nepali_name: '',
  email: '',
  phone_number: '',
  current_address: '',
  father_name: '',
  grandfather_name: '',
  relationship_branch_info: '',
  message_to_admin: '',
};

export default function RequestAccess() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await accessRequestService.submitRequest(form);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Request Submitted</h1>
          <p className="text-muted-foreground">
            Your request has been submitted. Admin will review and approve your access.
          </p>
          <Link to="/login" className="text-sm text-primary hover:underline inline-block">
            ← Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TreePine className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading text-2xl font-bold">Request Access</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Submit your details for admin review. Access is not granted automatically.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border rounded-xl p-6 space-y-4"
        >
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="text-sm font-medium mb-1.5 block">Full Name *</label>
            <Input value={form.full_name} onChange={e => update('full_name', e.target.value)} required />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Nepali Name</label>
            <Input value={form.nepali_name} onChange={e => update('nepali_name', e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Email *</label>
            <Input type="email" value={form.email} onChange={e => update('email', e.target.value)} required />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Phone Number</label>
            <Input value={form.phone_number} onChange={e => update('phone_number', e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Current Address</label>
            <Input value={form.current_address} onChange={e => update('current_address', e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Father&apos;s Name</label>
            <Input value={form.father_name} onChange={e => update('father_name', e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Grandfather&apos;s Name</label>
            <Input value={form.grandfather_name} onChange={e => update('grandfather_name', e.target.value)} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Relationship / Branch Information</label>
            <Textarea
              value={form.relationship_branch_info}
              onChange={e => update('relationship_branch_info', e.target.value)}
              rows={3}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Message to Admin</label>
            <Textarea
              value={form.message_to_admin}
              onChange={e => update('message_to_admin', e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Access Request'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          <Link to="/login" className="hover:text-foreground transition-colors">
            ← Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
