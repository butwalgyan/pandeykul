import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { authService, familyMemberService, contentSubmissionService } from "@/services";
import { User, Edit, Trash2, MapPin, Briefcase, GraduationCap, Award, ArrowUp, ArrowDown, Heart, Facebook, ChevronLeft, ShieldCheck, PenLine, Clock, CheckCircle, XCircle, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import MemberCard from "../components/MemberCard";
import SuggestEditDialog from "../components/submissions/SuggestEditDialog";
import VerifyInfoDialog from "../components/submissions/VerifyInfoDialog";

export default function MemberProfile() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [allMembers, setAllMembers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestEdit, setShowSuggestEdit] = useState(false);
  const [showVerify, setShowVerify] = useState(false);

  useEffect(() => {
    Promise.all([
      familyMemberService.get(memberId).catch(() => null),
      familyMemberService.list("-created_at", 200).catch(() => []),
      authService.me().catch(() => null),
    ]).then(([m, all, u]) => {
      setMember(m);
      setAllMembers(all);
      setCurrentUser(u);
      if (u) {
        contentSubmissionService.filter({ related_family_member_id: memberId }).then(subs => {
          setMySubmissions(u.role === "admin" ? subs : subs.filter(s => s.submitted_by_email === u.email));
        }).catch(() => {});
      }
    }).finally(() => setLoading(false));
  }, [memberId]);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!member) return <div className="p-6 text-center text-muted-foreground">Member not found</div>;

  const parents = (member.parent_ids || []).map(id => allMembers.find(m => m.id === id)).filter(Boolean);
  const spouses = (member.spouse_ids || []).map(id => allMembers.find(m => m.id === id)).filter(Boolean);
  const children = allMembers.filter(m => (m.parent_ids || []).includes(member.id));
  const siblings = allMembers.filter(m => m.id !== member.id && (m.parent_ids || []).some(pid => (member.parent_ids || []).includes(pid)));

  const handleDelete = async () => {
    await familyMemberService.delete(member.id);
    navigate("/tree");
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/tree" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-6"><ChevronLeft className="w-4 h-4" /> Back to Tree</Link>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-primary/20 to-accent/40" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-24 h-24 rounded-xl bg-accent border-4 border-card flex items-center justify-center overflow-hidden shadow-lg">
              {member.profile_photo ? <img src={member.profile_photo} className="w-full h-full object-cover" /> : <User className="w-10 h-10 text-muted-foreground" />}
            </div>
            <div className="flex-1 pb-1">
              <h1 className="font-heading text-2xl font-bold">{member.full_name}</h1>
              {member.nickname && <p className="text-muted-foreground">"{member.nickname}"</p>}
              <div className="flex flex-wrap gap-1.5 mt-1">
                {member.verified_status === "admin_verified" && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-green-100 text-green-700 border border-green-200 rounded-full px-2 py-0.5">
                    <BadgeCheck className="w-3 h-3" /> Admin Verified
                  </span>
                )}
                {member.verified_status === "self_verified" && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-blue-100 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5">
                    <ShieldCheck className="w-3 h-3" /> Self Verified
                  </span>
                )}
                {member.record_status === "pending_review" && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5">
                    <Clock className="w-3 h-3" /> Pending Review
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pb-1">
              {currentUser && (
                <>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowSuggestEdit(true)}>
                    <PenLine className="w-3 h-3" /> Suggest Edit
                  </Button>
                  <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowVerify(true)}>
                    <ShieldCheck className="w-3 h-3" /> Verify Info
                  </Button>
                </>
              )}
              {currentUser?.role === "admin" && (
                <>
                  <Link to={`/member/${member.id}/edit`}><Button size="sm" variant="outline" className="gap-1"><Edit className="w-3 h-3" /> Edit</Button></Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button size="sm" variant="outline" className="text-destructive"><Trash2 className="w-3 h-3" /></Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Delete member?</AlertDialogTitle><AlertDialogDescription>This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {member.date_of_birth && <InfoBadge icon={<span className="text-xs">🎂</span>} label="Born" value={member.date_of_birth} />}
            {member.date_of_death && <InfoBadge icon={<span className="text-xs">✝</span>} label="Died" value={member.date_of_death} />}
            {member.birthplace && <InfoBadge icon={<MapPin className="w-3 h-3" />} label="Birthplace" value={member.birthplace} />}
            {member.occupation && <InfoBadge icon={<Briefcase className="w-3 h-3" />} label="Occupation" value={member.occupation} />}
            {member.education && <InfoBadge icon={<GraduationCap className="w-3 h-3" />} label="Education" value={member.education} />}
            {member.generation != null && <InfoBadge icon={<ArrowUp className="w-3 h-3" />} label="Generation" value={member.generation} />}
            {member.branch && <InfoBadge icon={<span className="text-xs">🌿</span>} label="Branch" value={member.branch} />}
          </div>

          {member.biography && (
            <div className="mb-6">
              <h3 className="font-heading font-semibold mb-2">Biography</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{member.biography}</p>
            </div>
          )}

          {member.achievements && (
            <div className="mb-6">
              <h3 className="font-heading font-semibold mb-2 flex items-center gap-2"><Award className="w-4 h-4 text-primary" /> Achievements</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{member.achievements}</p>
            </div>
          )}

          {member.facebook_url && (
            <a href={member.facebook_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6">
              <Facebook className="w-4 h-4" /> Facebook Profile
            </a>
          )}

          {(member.photos || []).length > 0 && (
            <div className="mb-6">
              <h3 className="font-heading font-semibold mb-2">Photos</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {member.photos.map((url, i) => <img key={i} src={url} className="rounded-lg aspect-square object-cover" />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <RelSection title="Parents" icon={<ArrowUp className="w-4 h-4" />} members={parents} />
        <RelSection title="Spouses" icon={<Heart className="w-4 h-4" />} members={spouses} />
        <RelSection title="Children" icon={<ArrowDown className="w-4 h-4" />} members={children} />
        <RelSection title="Siblings" icon={<User className="w-4 h-4" />} members={siblings} />
      </div>

      {/* My submissions for this member */}
      {mySubmissions.length > 0 && (
        <div className="mt-6 bg-card border border-border rounded-xl p-4">
          <h3 className="font-heading font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Submissions for this profile</h3>
          <div className="space-y-2">
            {mySubmissions.map(sub => (
              <div key={sub.id} className="flex items-center justify-between gap-3 text-sm p-2 rounded-lg hover:bg-accent/30">
                <div className="flex items-center gap-2">
                  {sub.status === "approved" && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}
                  {sub.status === "rejected" && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
                  {sub.status === "pending" && <Clock className="w-4 h-4 text-yellow-500 shrink-0" />}
                  <span className="font-medium">{sub.field_name}</span>
                  <span className="text-muted-foreground capitalize">({sub.submission_type})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider border rounded-full px-2 py-0.5 ${
                    sub.status === "approved" ? "bg-green-100 text-green-800 border-green-200" :
                    sub.status === "rejected" ? "bg-red-100 text-red-800 border-red-200" :
                    "bg-yellow-100 text-yellow-800 border-yellow-200"
                  }`}>
                    {sub.status === "pending" ? "Pending Admin Approval" :
                     sub.status === "approved" && sub.submission_type === "verify" ? "Verified by Family Member" :
                     sub.status === "approved" ? "Approved" : "Rejected"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dialogs */}
      {showSuggestEdit && currentUser && (
        <SuggestEditDialog open={showSuggestEdit} onClose={() => setShowSuggestEdit(false)} member={member} currentUser={currentUser} />
      )}
      {showVerify && currentUser && (
        <VerifyInfoDialog open={showVerify} onClose={() => setShowVerify(false)} member={member} currentUser={currentUser} />
      )}
    </div>
  );
}

function InfoBadge({ icon, label, value }) {
  return (
    <div className="bg-accent/50 rounded-lg px-3 py-2">
      <div className="flex items-center gap-1.5 text-muted-foreground mb-0.5">{icon}<span className="text-[10px] uppercase tracking-wider">{label}</span></div>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}

function RelSection({ title, icon, members }) {
  if (members.length === 0) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-heading font-semibold mb-3 flex items-center gap-2 text-primary">{icon} {title}</h3>
      <div className="space-y-1">
        {members.map(m => <MemberCard key={m.id} member={m} compact />)}
      </div>
    </div>
  );
}