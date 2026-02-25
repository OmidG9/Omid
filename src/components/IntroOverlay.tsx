'use client';

import { useEffect, useReducer, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

const STORAGE_KEY = 'intro_seen';
const DISPLAY_DURATION = 2400; // ms

// Typed cubic-bezier tuple for Framer Motion v12
const EASE_OUT_EXPO = [0.22, 1, 0.36, 1] as [number, number, number, number];

type State = { visible: boolean; mounted: boolean };
type Action = { type: 'SHOW' } | { type: 'HIDE' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'SHOW':
      return { visible: true, mounted: true };
    case 'HIDE':
      return { ...state, visible: false };
    default:
      return state;
  }
}

export default function IntroOverlay() {
  const [{ visible, mounted }, dispatch] = useReducer(reducer, {
    visible: false,
    mounted: false,
  });
  const prefersReducedMotion = useReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Runs client-side only — safe to access localStorage here
    const alreadySeen = localStorage.getItem(STORAGE_KEY);
    if (alreadySeen) return;

    // 'cancelled' guards against the StrictMode double-invoke racing:
    // cleanup sets it to true so the timer callback from the first mount
    // never calls dismiss() after the component re-mounts.
    let cancelled = false;

    dispatch({ type: 'SHOW' });
    timerRef.current = setTimeout(() => {
      if (!cancelled) dismiss();
    }, DISPLAY_DURATION);

    return () => {
      cancelled = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function dismiss() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    localStorage.setItem(STORAGE_KEY, '1');
    dispatch({ type: 'HIDE' });
  }

  if (!mounted) return null;

  const reducedDuration = prefersReducedMotion ? 0.12 : undefined;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="intro-overlay"
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: {
              duration: reducedDuration ?? 0.3,
              ease: 'easeOut' as const,
            },
          }}
          exit={{
            opacity: 0,
            transition: {
              duration: reducedDuration ?? 0.5,
              ease: 'easeInOut' as const,
            },
          }}
          // Block all pointer events behind overlay while visible
          className="fixed inset-0 z-9999 flex flex-col items-center justify-center"
          style={{
            background:
              'radial-gradient(ellipse 120% 100% at 50% 0%, #0f2240 0%, #020617 55%, #020617 100%)',
          }}
          aria-modal="true"
          aria-label="صفحه معرفی"
          role="dialog"
        >
          {/* Subtle grid texture */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(to right, #3b82f6 1px, transparent 1px)',
              backgroundSize: '64px 64px',
            }}
          />

          {/* Glow blob */}
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full opacity-20 blur-[80px]"
            style={{
              background:
                'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
            }}
          />

          {/* Main content */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: {
                transition: {
                  staggerChildren: prefersReducedMotion ? 0 : 0.18,
                },
              },
            }}
            className="relative z-10 flex flex-col items-center gap-3 text-center select-none"
            dir="rtl"
          >
            {/* Persian greeting */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: reducedDuration ?? 0.55,
                    ease: EASE_OUT_EXPO,
                  },
                },
              }}
              className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl"
              style={{ fontFamily: 'Vazirmatn, system-ui, sans-serif' }}
            >
              سلام، من امیدم
            </motion.h1>

            {/* Accent divider — grows from right to left (RTL-aware) */}
            <motion.span
              variants={{
                hidden: { scaleX: 0, opacity: 0 },
                visible: {
                  scaleX: 1,
                  opacity: 1,
                  transition: {
                    duration: reducedDuration ?? 0.45,
                    delay: prefersReducedMotion ? 0 : 0.5,
                    ease: EASE_OUT_EXPO,
                  },
                },
              }}
              className="block h-px w-32 origin-right rounded-full"
              style={{
                background: 'linear-gradient(to left, #3b82f6, #22d3ee)',
              }}
            />

            {/* Sub-title */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: reducedDuration ?? 0.55,
                    ease: EASE_OUT_EXPO,
                  },
                },
              }}
              className="text-base font-medium tracking-widest uppercase text-sky-400 sm:text-lg"
              style={{
                fontFamily: 'system-ui, sans-serif',
                letterSpacing: '0.2em',
              }}
              dir="ltr"
            >
              Full-Stack Developer
            </motion.p>
          </motion.div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: {
                delay: prefersReducedMotion ? 0 : 0.6,
                duration: reducedDuration ?? 0.3,
              },
            }}
            onClick={dismiss}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 cursor-pointer rounded-full border border-slate-700 bg-slate-800/60 px-5 py-2 text-sm text-slate-400 backdrop-blur-sm transition-colors hover:border-slate-500 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="رد کردن صفحه معرفی"
          >
            رد کردن
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
