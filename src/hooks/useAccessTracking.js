import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { accessLogService } from '@/services';
import { pageNames } from '@/routes/config';

export function useAccessTracking(user) {
  const location = useLocation();
  const lastTrackedPath = useRef(null);

  useEffect(() => {
    if (!user || lastTrackedPath.current === location.pathname) return;
    lastTrackedPath.current = location.pathname;

    const now = new Date().toISOString();
    const pageName = pageNames[location.pathname] || location.pathname;

    accessLogService.create({
      user_email: user.email,
      user_name: user.user_metadata?.full_name || user.email,
      action: 'page_visit',
      page_name: pageName,
      page_url: location.pathname,
      login_time: now,
      last_access_time: now,
      device_info: navigator.userAgent,
    }).catch(() => {});
  }, [user, location.pathname]);
}