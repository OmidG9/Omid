/**
 * Client-side, non-reactive shared memory used to build the lead timeline and
 * project attribution (§36–37).
 *
 * Server components cannot read browser state, so the contact form captures a
 * lightweight snapshot at submit time (arrival, last project viewed, form
 * events) and sends it with the payload. Nothing here is persisted client-side;
 * it only carries timestamps between page navigation and the form submission.
 */

export interface SessionState {
  arrivedAt: number;
  projectSlug?: string;
  projectViewedAt?: number;
  openedAt?: number;
  startedAt?: number;
}

const state: SessionState = { arrivedAt: 0 };

function now(): number {
  return Date.now();
}

export const sessionState = {
  /** Called once on SDK init — the first moment a visitor is on the site. */
  init(): void {
    if (!state.arrivedAt) state.arrivedAt = now();
  },

  /** Called by ProjectViewTracker when a project detail page mounts. */
  viewProject(slug: string): void {
    state.projectSlug = slug;
    state.projectViewedAt = now();
  },

  /** Called when the contact form becomes visible. */
  openForm(): void {
    if (!state.openedAt) state.openedAt = now();
  },

  /** Called on first focus of the form. */
  startForm(): void {
    if (!state.startedAt) state.startedAt = now();
  },

  /** Snapshot consumed at submit time; resets nothing (visitor may repeat). */
  snapshot(): SessionState {
    return {
      arrivedAt: state.arrivedAt,
      projectSlug: state.projectSlug,
      projectViewedAt: state.projectViewedAt,
      openedAt: state.openedAt,
      startedAt: state.startedAt,
    };
  },
};