import { useState, useEffect, useCallback } from 'react';
import { authService, accessRequestService } from '@/services';
import { CheckCircle, XCircle, Clock, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

function getErrorMessage(error) {
  return error?.message || String(error);
}

function RequestCard({ request, onApprove, onReject, acting, busy, roleChoice, onRoleChange }) {
  const isActing = acting === request.id;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2 py-0.5 bg-yellow-100 text-yellow-800 border-yellow-200">
            pending
          </span>
          <h3 className="font-heading font-semibold text-lg mt-2">{request.full_name || '—'}</h3>
          <p className="text-sm text-muted-foreground">{request.nepali_name || '—'}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {request.created_at ? new Date(request.created_at).toLocaleString() : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
        <Field label="Email" value={request.email} />
        <Field label="Phone" value={request.phone_number} />
        <Field label="Current Address" value={request.current_address} className="sm:col-span-2" />
        <Field label="Father's Name" value={request.father_name} />
        <Field label="SPOUSE NAME" value={request.spouse_name} />
        <Field label="Grandfather's Name" value={request.grandfather_name} />
        <Field label="Relationship / Branch" value={request.relationship_branch_info} className="sm:col-span-2" />
        <Field label="Message to Admin" value={request.message_to_admin} className="sm:col-span-2" />
      </div>

      <div className="mb-3">
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Role on approval</label>
        <Select value={roleChoice} onValueChange={v => onRoleChange(request.id, v)} disabled={busy}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="viewer">Viewer — read-only access</SelectItem>
            <SelectItem value="family_editor">Family Editor — can suggest edits</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          className="gap-1.5 flex-1 bg-green-600 hover:bg-green-700"
          onClick={() => onApprove(request)}
          disabled={busy}
        >
          {isActing ? (
            <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="gap-1.5 flex-1 border-red-300 text-red-600 hover:bg-red-50"
          onClick={() => onReject(request)}
          disabled={busy}
        >
          {isActing ? (
            <span className="animate-spin w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full" />
          ) : (
            <XCircle className="w-3.5 h-3.5" />
          )}
          Reject
        </Button>
      </div>
    </div>
  );
}

function Field({ label, value, className = '' }) {
  return (
    <div className={`rounded-lg border border-border bg-muted/30 p-3 ${className}`}>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</p>
      <p className="font-medium whitespace-pre-wrap">{value || '—'}</p>
    </div>
  );
}

export default function AdminAccessRequests() {
  const [requests, setRequests] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [roleByRequest, setRoleByRequest] = useState({});
  const [feedback, setFeedback] = useState(null);

  const loadData = useCallback(async () => {
    const [u, pending] = await Promise.all([
      authService.me(),
      accessRequestService.listPending().catch(() => []),
    ]);
    setUser(u);
    setRequests(pending.filter(r => r.status === 'pending'));
    setRoleByRequest(prev => {
      const next = { ...prev };
      pending.forEach(r => {
        if (!next[r.id]) next[r.id] = 'viewer';
      });
      return next;
    });
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleRoleChange = (id, role) => {
    setRoleByRequest(prev => ({ ...prev, [id]: role }));
  };

  const approveRequest = async (request) => {
    if (acting) return;

    const role = roleByRequest[request.id] || 'viewer';
    console.log('[AdminAccessRequests] Approve clicked', { id: request.id, role });

    setActing(request.id);
    setFeedback(null);

    try {
      await accessRequestService.approveAccessRequest(request, role);
      setRequests(prev => prev.filter(r => r.id !== request.id));
      const message = 'Access request approved successfully.';
      setFeedback({ type: 'success', message });
      toast.success(message);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('[AdminAccessRequests] approve failed:', error);
      setFeedback({ type: 'error', message });
      toast.error(message);
    } finally {
      setActing(null);
    }
  };

  const rejectRequest = async (request) => {
    if (acting) return;

    console.log('[AdminAccessRequests] Reject clicked', { id: request.id });

    setActing(request.id);
    setFeedback(null);

    try {
      await accessRequestService.rejectAccessRequest(request.id);
      setRequests(prev => prev.filter(r => r.id !== request.id));
      const message = 'Access request rejected successfully.';
      setFeedback({ type: 'success', message });
      toast.success(message);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error('[AdminAccessRequests] reject failed:', error);
      setFeedback({ type: 'error', message });
      toast.error(message);
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96 text-center p-6">
        <div>
          <XCircle className="w-12 h-12 text-destructive/50 mx-auto mb-3" />
          <h2 className="font-heading text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only admins can access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-primary" />
          Access Requests
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review new user access requests. Approval sets role to viewer or family editor in user_profiles.
        </p>
      </div>

      {feedback && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'error'
              ? 'border-red-300 bg-red-50 text-red-800'
              : 'border-green-300 bg-green-50 text-green-800'
          }`}
          role="alert"
        >
          {feedback.message}
        </div>
      )}

      {requests.length > 0 && (
        <p className="text-xs text-yellow-700 bg-yellow-100 border border-yellow-200 rounded-full px-3 py-1 inline-flex items-center gap-1 mb-4 font-medium">
          <Clock className="w-3 h-3" />
          {requests.length} awaiting review
        </p>
      )}

      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No pending access requests.</p>
          </div>
        ) : (
          requests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              onApprove={approveRequest}
              onReject={rejectRequest}
              acting={acting}
              busy={acting !== null}
              roleChoice={roleByRequest[request.id] || 'viewer'}
              onRoleChange={handleRoleChange}
            />
          ))
        )}
      </div>
    </div>
  );
}
