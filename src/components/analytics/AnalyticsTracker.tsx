'use client';

/**
 * Initializes the client analytics SDK on mount. Rendered once in the root
 * layout. The SDK auto-inits itself when the module loads; this component
 * guards re-initialization and flushes any queued beacons.
 */

import { useEffect } from 'react';
import { analytics } from '@/lib/analytics/client';
import { sessionState } from '@/lib/analytics/sessionState';

export default function AnalyticsTracker() {
  useEffect(() => {
    analytics.init();
    sessionState.init();
  }, []);
  return null;
}