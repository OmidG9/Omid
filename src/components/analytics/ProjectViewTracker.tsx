'use client';

/**
 * Fires a PROJECT_VIEW analytics event once a project detail page mounts.
 * Keeps the server component untouched (SSR-safe).
 */

import { useEffect, useRef } from 'react';
import { analytics } from '@/lib/analytics/client';

export default function ProjectViewTracker({ slug }: { slug: string }) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    const startedAt = performance.now();
    analytics.projectView(slug, { pageTimeMs: Math.round(startedAt) });
  }, [slug]);

  return null;
}