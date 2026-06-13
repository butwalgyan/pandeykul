import { Route, Routes, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useAccessTracking } from '@/hooks/useAccessTracking';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthLoadingScreen from '@/components/common/AuthLoadingScreen';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import PageNotFound from '@/lib/PageNotFound';
import Login from '@/pages/Login';
import Home from '@/pages/Home';
import FamilyTree from '@/pages/FamilyTree';
import MemberProfile from '@/pages/MemberProfile';
import AddEditMember from '@/pages/AddEditMember';
import Stories from '@/pages/Stories';
import Documents from '@/pages/Documents';
import MediaArchive from '@/pages/MediaArchive';
import Timeline from '@/pages/Timeline';
import Search from '@/pages/Search';
import MapView from '@/pages/MapView';
import Invitations from '@/pages/Invitations';
import RelationshipFinderPage from '@/pages/RelationshipFinder';
import AdminApproval from '@/pages/AdminApproval';
import KinshipReference from '@/pages/KinshipReference';
import UserAccessLogs from '@/pages/UserAccessLogs';
import PendingApprovals from '@/pages/PendingApprovals';

const TrackedApp = () => {
  const { user } = useAuth();
  useAccessTracking(user);
  return <Outlet />;
};

export default function AppRoutes() {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return <AuthLoadingScreen />;
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }

    if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<Layout />}>
        <Route element={<TrackedApp />}>
          <Route path="/" element={<Home />} />

          <Route element={<ProtectedRoute unauthenticatedElement={null} />}>
            <Route path="/tree" element={<FamilyTree />} />
            <Route path="/member/new" element={<AddEditMember />} />
            <Route path="/member/:memberId" element={<MemberProfile />} />
            <Route path="/member/:memberId/edit" element={<AddEditMember />} />
            <Route path="/stories" element={<Stories />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/media" element={<MediaArchive />} />
            <Route path="/timeline" element={<Timeline />} />
            <Route path="/search" element={<Search />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/invitations" element={<Invitations />} />
            <Route path="/relationship-finder" element={<RelationshipFinderPage />} />
            <Route path="/admin/approvals" element={<AdminApproval />} />
            <Route path="/admin/pending-approvals" element={<PendingApprovals />} />
            <Route path="/kinship-reference" element={<KinshipReference />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly unauthenticatedElement={null} />}>
            <Route path="/admin/access-logs" element={<UserAccessLogs />} />
          </Route>

          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Route>
    </Routes>
  );
}
