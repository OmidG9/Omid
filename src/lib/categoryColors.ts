/** Category display names (Persian → English key). */
export const CATEGORY_LABELS: Record<string, string> = {
  همه: 'همه',
  'Full-Stack': 'Full-Stack',
  Frontend: 'Frontend',
  'UI/UX': 'UI/UX',
  WordPress: 'WordPress',
};

interface CategoryStyle {
  /** Tailwind classes for the active chip */
  active: string;
  /** Tailwind classes for the inactive chip */
  inactive: string;
  /** Tailwind classes for a small tag badge */
  tag: string;
}

export const CATEGORY_COLORS: Record<string, CategoryStyle> = {
  همه: {
    active: 'bg-blue-600 border-blue-600 text-white shadow-glow',
    inactive:
      'border-blue-700/40 text-blue-400 hover:border-blue-500/60 hover:text-blue-300',
    tag: 'bg-blue-500/12 border-blue-500/25 text-blue-300',
  },
  'Full-Stack': {
    active: 'bg-blue-600 border-blue-600 text-white shadow-glow',
    inactive:
      'border-blue-700/40 text-blue-400 hover:border-blue-500/60 hover:text-blue-300',
    tag: 'bg-blue-500/12 border-blue-500/25 text-blue-300',
  },
  Frontend: {
    active: 'bg-cyan-600 border-cyan-600 text-white',
    inactive:
      'border-cyan-700/40 text-cyan-400 hover:border-cyan-500/60 hover:text-cyan-300',
    tag: 'bg-cyan-500/12 border-cyan-500/25 text-cyan-300',
  },
  'UI/UX': {
    active: 'bg-violet-600 border-violet-600 text-white',
    inactive:
      'border-violet-700/40 text-violet-400 hover:border-violet-500/60 hover:text-violet-300',
    tag: 'bg-violet-500/12 border-violet-500/25 text-violet-300',
  },
  WordPress: {
    active: 'bg-indigo-600 border-indigo-600 text-white',
    inactive:
      'border-indigo-700/40 text-indigo-400 hover:border-indigo-500/60 hover:text-indigo-300',
    tag: 'bg-indigo-500/12 border-indigo-500/25 text-indigo-300',
  },
};

/** Returns category color style, with "Full-Stack" as fallback. */
export function getCategoryStyle(category: string): CategoryStyle {
  return CATEGORY_COLORS[category] ?? CATEGORY_COLORS['Full-Stack'];
}
