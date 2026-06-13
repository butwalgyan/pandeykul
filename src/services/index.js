import { createEntityService } from '@/services/entityService';

export { authService } from '@/services/authService';
export { storageService } from '@/services/storageService';
export { integrationService } from '@/services/integrationService';
export { changeRequestService, pickChangeRequestPayload } from '@/services/changeRequestService';
export { relationshipService, getRelationshipEndpoints } from '@/services/relationshipService';
export {
  familyMemberService,
  pickFamilyMemberPayload,
  memberFromChangeRequestNewData,
  normalizeParentId,
  getMemberParentIds,
  prepareMembersForTree,
  getSeniorityScore,
} from '@/services/familyMemberService';
export const storyService = createEntityService('stories');
export const mediaService = createEntityService('media');
export const documentService = createEntityService('documents');
export const invitationService = createEntityService('invitations');
export const accessLogService = createEntityService('access_logs');
export const notificationService = createEntityService('notifications');
export const contentSubmissionService = createEntityService('content_submissions');
