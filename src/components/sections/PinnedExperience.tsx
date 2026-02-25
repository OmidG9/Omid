'use client';

/**
 * ROOT CAUSE & FIX (black overlay when scrolling down):
 *
 * The previous <Section> wrapper applied Framer Motion's initial state
 * { opacity: 0, transform: translateY(40px) } on the parent element.
 * CSS rule: any ancestor with a `transform` becomes the containing block for
 * `position: fixed` descendants — overriding the viewport. GSAP's pin sets
 * `position: fixed` on the pinned element, so while Framer Motion was
 * mid-animation (translating the parent), the "fixed" child was actually
 * fixed to a shifting, semi-transparent parent instead of the viewport.
 * This produced the black/invisible section when scrolling DOWN (the phase
 * where Framer Motion's animation is active) but NOT when scrolling UP
 * (animation already finished, transform cleared).
 *
 * Fix: Experience.tsx now uses a plain <section> — no Framer Motion
 * transform on the ancestor, so GSAP's position:fixed pin attaches
 * correctly to the viewport in both scroll directions.
 *
 * Additional fixes applied here:
 *  - clearProps after entry animations (GSAP inline opacity:1 blocked
 *    Tailwind's opacity-30 dimming on non-active cards)
 *  - anticipatePin: 1  (prevents jump when pin fires)
 *  - invalidateOnRefresh: true  (recalcs sizes on resize/refresh)
 *  - ScrollTrigger.refresh() after init
 *  - resize listener → ScrollTrigger.refresh()
 *  - start: 'top top+=64'  (offset for fixed h-16 navbar)
 *  - scrub removed from pin trigger  (no effect without animation target)
 *  - bg-[#020617] + relative z-10 on pinned div (explicit background so
 *    scrolled-behind content doesn't bleed through the fixed element)
 *  - DEBUG flag for GSAP markers
 */

import { useEffect, useRef, useState } from 'react';
import { Briefcase, Calendar, CheckCircle2 } from 'lucide-react';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import { type Experience } from '@/data/portfolio';

// Set to true locally to show GSAP ScrollTrigger start/end markers.
const DEBUG = false;

interface Props {
  items: Experience[];
}

export default function PinnedExperience({ items }: Props) {
  /**
   * `pinnedRef` is the element that GSAP will pin to the top of the viewport.
   * It wraps the full section content (header + timeline) so the header stays
   * visible while the user scrolls through individual experience cards.
   */
  const pinnedRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  /**
   * -1 → pin has not started yet (all cards visible at full opacity).
   *  0…n-1 → the active card index while pinned.
   */
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const itemCount = items.length;

  useEffect(() => {
    if (typeof window === 'undefined' || itemCount === 0) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActiveIndex(0);
      return;
    }

    // StrictMode double-invoke guard: if cleanup fires before the async
    // import resolves, abort initialisation to avoid double-registration.
    let didCleanup = false;
    let ctx: { revert: () => void } | undefined;

    // Keep a ref to ScrollTrigger so the resize handler can call refresh().
    let STRef: { refresh: () => void } | undefined;
    const onResize = () => STRef?.refresh();

    const init = async () => {
      const { default: gsap } = await import('gsap');
      const { ScrollTrigger } = await import('gsap/ScrollTrigger');
      gsap.registerPlugin(ScrollTrigger);
      STRef = ScrollTrigger;

      if (didCleanup) return;

      ctx = gsap.context(() => {
        // ── 1. Grow the vertical timeline line as the section enters ──────────
        if (lineRef.current) {
          gsap.fromTo(
            lineRef.current,
            { scaleY: 0, transformOrigin: 'top center' },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: timelineRef.current,
                start: 'top 80%',
                end: 'top 20%',
                scrub: 0.6,
              },
            }
          );
        }

        // ── 2. Stagger-in cards ───────────────────────────────────────────
        // FIX: clearProps in onComplete removes GSAP's inline `opacity:1`
        // after the tween. Without it Tailwind's `opacity-30` (applied via
        // React className during pin phase) is overridden and cards never dim.
        const cardEls =
          timelineRef.current?.querySelectorAll<HTMLElement>(
            '.experience-item'
          );
        if (cardEls && cardEls.length > 0) {
          gsap.fromTo(
            Array.from(cardEls),
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.18,
              ease: 'power2.out',
              onComplete() {
                gsap.set(Array.from(cardEls), { clearProps: 'opacity,y' });
              },
              scrollTrigger: {
                trigger: timelineRef.current,
                start: 'top 82%',
                markers: DEBUG,
              },
            }
          );
        }

        // ── 3. Timeline dot pop-in ────────────────────────────────────────
        // FIX: same clearProps pattern so Tailwind dot-size classes take effect.
        const dotEls =
          timelineRef.current?.querySelectorAll<HTMLElement>('.timeline-dot');
        if (dotEls && dotEls.length > 0) {
          gsap.fromTo(
            Array.from(dotEls),
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.4,
              stagger: 0.18,
              ease: 'back.out(1.7)',
              onComplete() {
                gsap.set(Array.from(dotEls), { clearProps: 'opacity,scale' });
              },
              scrollTrigger: {
                trigger: timelineRef.current,
                start: 'top 82%',
                markers: DEBUG,
              },
            }
          );
        }

        // ── 4. Pinned scroll-stepping ─────────────────────────────────────
        // start 'top top+=64': offset for the fixed h-16 (64 px) navbar.
        // anticipatePin: 1 prevents a layout jump when pin fires.
        // invalidateOnRefresh: true recalculates sizes after resize/refresh.
        // pinSpacing: true inserts a spacer so subsequent sections scroll
        //   into view naturally after unpin.
        // scrub removed: only meaningful with an `animation` target; on a
        //   plain pin it adds latency to onUpdate with no visual benefit.
        ScrollTrigger.create({
          trigger: pinnedRef.current,
          start: 'top top+=64',
          end: () => `+=${itemCount * window.innerHeight}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          markers: DEBUG,
          onUpdate(self) {
            const raw = self.progress * itemCount;
            const idx = Math.min(Math.floor(raw), itemCount - 1);
            setActiveIndex(idx);
          },
          onEnter() {
            setActiveIndex(0);
          },
          onLeave() {
            setActiveIndex(itemCount - 1);
          },
          onEnterBack() {
            setActiveIndex(itemCount - 1);
          },
          onLeaveBack() {
            setActiveIndex(-1);
          },
        });

        // Ensure all trigger positions are correct after first render.
        ScrollTrigger.refresh();
      }, pinnedRef);

      window.addEventListener('resize', onResize);
    };

    init();

    return () => {
      didCleanup = true;
      ctx?.revert();
      window.removeEventListener('resize', onResize);
    };
  }, [itemCount]);

  return (
    /*
     * relative z-10: own stacking context so pinned content sits above sibling
     *   sections but below the navbar (z-50).
     * bg-bg-primary: explicit page background (--color-bg-primary). When GSAP
     *   pins this div as position:fixed, the browser renders it over the
     *   viewport; without an explicit background, sections that have scrolled
     *   into view behind it would bleed through any transparent areas.
     */
    <div ref={pinnedRef} className="relative z-10 bg-bg-primary">
      <Container>
        <SectionHeader
          label="تجربیات"
          title="مسیر حرفه‌ای"
          description="سوابق کاری و پروژه‌هایی که در آن‌ها مشارکت داشته‌ام."
        />

        {/* Timeline */}
        <div className="relative" ref={timelineRef}>
          {/* Vertical progress line */}
          <div
            ref={lineRef}
            className="absolute right-4.5 md:right-1/2 top-0 bottom-0 w-px bg-linear-to-b from-blue-500/60 via-slate-700/40 to-transparent"
          />

          <div className="space-y-8">
            {items.map((exp, i) => {
              const isActive = i === activeIndex;
              // While pinning is active (activeIndex >= 0), dim non-active cards.
              const dimmed = activeIndex >= 0 && !isActive;

              return (
                <div
                  key={i}
                  className={[
                    'experience-item relative flex flex-col md:flex-row gap-8',
                    i % 2 === 0 ? 'md:flex-row-reverse' : '',
                    'transition-opacity duration-300',
                    dimmed ? 'opacity-30' : 'opacity-100',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {/* Timeline dot */}
                  <div
                    className={[
                      'timeline-dot absolute right-3.5 md:right-1/2 md:-translate-x-1/2 top-6 rounded-full ring-4 ring-slate-950 z-10',
                      'transition-all duration-300',
                      isActive
                        ? 'w-3.5 h-3.5 bg-blue-400 shadow-[0_0_8px_2px_rgba(96,165,250,0.6)]'
                        : 'w-2.5 h-2.5 bg-blue-500 shadow-glow',
                    ].join(' ')}
                  />

                  {/* Spacer (desktop alternating layout) */}
                  <div className="hidden md:block flex-1" />

                  {/* Card */}
                  <div className="flex-1 mr-10 md:mr-0">
                    <div
                      className={[
                        'glass-card p-6 transition-all duration-300 group',
                        isActive
                          ? 'border-blue-500/60 shadow-[0_0_20px_0px_rgba(59,130,246,0.25)]'
                          : 'hover:border-blue-500/40 hover:shadow-glow',
                      ].join(' ')}
                      dir="rtl"
                    >
                      {/* Company + role */}
                      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Briefcase size={16} className="text-blue-400" />
                            <h3 className="font-bold text-slate-100 text-base">
                              {exp.company}
                            </h3>
                            {exp.current && (
                              <span className="px-2 py-0.5 text-xs bg-green-500/10 border border-green-500/30 text-green-400 rounded-full">
                                فعلی
                              </span>
                            )}
                          </div>
                          <p className="text-blue-400 font-medium text-sm">
                            {exp.role}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Calendar size={13} />
                          <span>{exp.period}</span>
                          <span className="mx-1 text-slate-700">·</span>
                          <span className="text-slate-500">{exp.type}</span>
                        </div>
                      </div>

                      {/* Bullets */}
                      <ul className="space-y-2">
                        {exp.bullets.map((bullet, j) => (
                          <li
                            key={j}
                            className="flex items-start gap-2.5 text-slate-300 text-sm leading-relaxed"
                          >
                            <CheckCircle2
                              size={15}
                              className="text-blue-500/70 mt-0.5 shrink-0"
                            />
                            {bullet}
                          </li>
                        ))}
                      </ul>

                      {/* Bottom accent line (always animate when active) */}
                      <div
                        className={[
                          'mt-4 h-px bg-linear-to-l from-blue-500/50 to-transparent rounded-full transition-all duration-500',
                          isActive ? 'w-full' : 'w-0 group-hover:w-full',
                        ].join(' ')}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </div>
  );
}
