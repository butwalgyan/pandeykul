import { useState, useEffect, useCallback } from "react";
import {
  authService,
  changeRequestService,
  familyMemberService,
  memberFromChangeRequestNewData,
  relationshipService,
} from "@/services";
import { CheckCircle, XCircle, Clock, User, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { usePendingCount } from "@/context/PendingCountContext";

function memberName(members, id) {
  if (!id) return "—";
  return members.find(m => m.id === id)?.full_name || id;
}

function hasValidMemberName(request) {
  const name = request?.new_data?.full_name;
  return typeof name === "string" && name.trim().length > 0;
}

function RequestCard({ request, members, onApprove, onReject, acting, busy }) {
  const data = request.new_data || {};
  const isActing = acting === request.id;
  const canApprove = hasValidMemberName(request);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2 py-0.5 bg-yellow-100 text-yellow-800 border-yellow-200">
            pending
          </span>
          <span className="ml-2 text-[10px] text-muted-foreground uppercase tracking-wider">
            {request.change_type || "create"}
          </span>
          <h3 className="font-heading font-semibold text-lg mt-2">
            {canApprove ? data.full_name.trim() : "Unnamed member"}
          </h3>
          {!canApprove && (
            <p className="text-xs text-red-600 mt-1">
              Invalid request — missing member name. Reject to remove from the pending list.
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {request.created_at
              ? new Date(request.created_at).toLocaleString()
              : "—"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-4">
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Gender</p>
          <p className="font-medium capitalize">{data.gender || "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Generation</p>
          <p className="font-medium">{data.generation ?? "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <User className="w-3 h-3" /> Father
          </p>
          <p className="font-medium">{memberName(members, data.father_id)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
            <Users className="w-3 h-3" /> Mother
          </p>
          <p className="font-medium">{memberName(members, data.mother_id)}</p>
        </div>
        <div className="rounded-lg border border-border bg-muted/30 p-3 sm:col-span-2">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Branch</p>
          <p className="font-medium">{data.branch || "—"}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          className="gap-1.5 flex-1 bg-green-600 hover:bg-green-700"
          onClick={() => onApprove(request)}
          disabled={busy || !canApprove}
          title={canApprove ? undefined : "Cannot approve — missing full_name in new_data"}
        >
          {isActing ? (
            <span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <CheckCircle className="w-3.5 h-3.5" />
          )}
          Approve
        </Button>
        <Button
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

export default function AdminApproval() {
  const [requests, setRequests] = useState([]);
  const [members, setMembers] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const { decrementPendingCount, setPendingCount } = usePendingCount();

  const loadData = useCallback(async () => {
    const [u, pending, mems] = await Promise.all([
      authService.me(),
      changeRequestService.listPending(200).catch(() => []),
      familyMemberService.list("-created_at", 300).catch(() => []),
    ]);
    setUser(u);
    const onlyPending = pending.filter(r => r.status === "pending");
    setRequests(onlyPending);
    setPendingCount(onlyPending.length);
    setMembers(mems);
  }, [setPendingCount]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const removeFromPendingList = (requestId) => {
    setRequests(prev => prev.filter(r => r.id !== requestId));
    decrementPendingCount();
  };

  const approveRequest = async (request) => {
    if (acting) return;
    if (!hasValidMemberName(request)) {
      toast.error("Cannot approve — request is missing full_name in new_data. Reject to remove it.");
      return;
    }
    setActing(request.id);
    try {
      const isUpdate = request.change_type === "update" && request.member_id;
      const memberPayload = memberFromChangeRequestNewData(request.new_data);

      console.log("[AdminApproval] approve payload:", {
        change_type: request.change_type,
        full_name: memberPayload.full_name,
        verification_status: memberPayload.verification_status,
        father_id: memberPayload.father_id ?? null,
        mother_id: memberPayload.mother_id ?? null,
        spouse_ids: request.new_data?.spouse_ids ?? [],
      });

      let memberId;
      let savedMember;

      if (isUpdate) {
        savedMember = await familyMemberService.update(request.member_id, memberPayload);
        memberId = request.member_id;
      } else {
        // Step 1–3: insert new_data into family_members with verification_status = 'approved'
        savedMember = await familyMemberService.create(memberPayload);
        memberId = savedMember.id;
      }

      if (!memberId) {
        throw new Error("Member save succeeded but no member id was returned.");
      }

      console.log("[AdminApproval] saved member:", {
        id: memberId,
        full_name: savedMember?.full_name,
        verification_status: savedMember?.verification_status ?? memberPayload.verification_status,
        father_id: savedMember?.father_id ?? null,
        mother_id: savedMember?.mother_id ?? null,
      });

      // Step 4: spouse links into relationships (before marking request approved)
      const spouseIds = request.new_data?.spouse_ids || [];
      if (spouseIds.length > 0) {
        try {
          await relationshipService.createSpouseLinks(memberId, spouseIds);
        } catch (relError) {
          console.error("[AdminApproval] member saved but spouse insert failed:", relError);
          const name = savedMember?.full_name || memberPayload.full_name;
          throw new Error(
            `${name} was saved to family_members, but spouse relationship insert failed: ${relError.message || "unknown error"}. The request was not marked approved — fix the relationships table, then try again.`,
          );
        }
      }

      // Step 5: mark change_requests approved only after member + spouse links succeed
      await changeRequestService.setStatus(request.id, "approved");

      removeFromPendingList(request.id);
      toast.success("Request approved successfully");
    } catch (error) {
      console.error("[AdminApproval] approve failed:", error);
      toast.error(error.message || "Failed to approve request. Please try again.");
    } finally {
      setActing(null);
    }
  };

  const rejectRequest = async (request) => {
    if (acting) return;
    setActing(request.id);
    try {
      await changeRequestService.setStatus(request.id, "rejected");
      removeFromPendingList(request.id);
      toast.success("Request rejected");
    } catch (error) {
      console.error("[AdminApproval] reject failed:", error);
      toast.error(error.message || "Failed to reject request. Please try again.");
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

  if (user?.role !== "admin") {
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
        <h1 className="font-heading text-2xl font-bold">Family Member Approvals</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review pending member requests from change_requests
        </p>
      </div>

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
            <p>No pending approvals.</p>
          </div>
        ) : (
          requests.map(request => (
            <RequestCard
              key={request.id}
              request={request}
              members={members}
              onApprove={approveRequest}
              onReject={rejectRequest}
              acting={acting}
              busy={acting !== null}
            />
          ))
        )}
      </div>
    </div>
  );
}
