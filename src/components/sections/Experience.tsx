"use client";

import { useEffect, useRef } from "react";
import { Briefcase, Calendar, CheckCircle2 } from "lucide-react";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import portfolio from "@/data/portfolio";

export default function Experience() {
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced) return;

    let ctx: { revert: () => void } | undefined;

    const initGSAP = async () => {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {
        // Animate the vertical progress line (grows on scroll)
        if (lineRef.current) {
          gsap.fromTo(
            lineRef.current,
            { scaleY: 0, transformOrigin: "top center" },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: {
                trigger: timelineRef.current,
                start: "top 80%",
                end: "bottom 75%",
                scrub: 0.6,
              },
            },
          );
        }

        // Animate each timeline card
        const items = timelineRef.current?.querySelectorAll(".experience-item");
        if (items && items.length > 0) {
          gsap.fromTo(
            items,
            { opacity: 0, y: 28 },
            {
              opacity: 1,
              y: 0,
              duration: 0.65,
              stagger: 0.18,
              ease: "power2.out",
              scrollTrigger: {
                trigger: timelineRef.current,
                start: "top 82%",
              },
            },
          );
        }

        // Animate dots
        const dots = timelineRef.current?.querySelectorAll(".timeline-dot");
        if (dots && dots.length > 0) {
          gsap.fromTo(
            dots,
            { scale: 0, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.4,
              stagger: 0.18,
              ease: "back.out(1.7)",
              scrollTrigger: {
                trigger: timelineRef.current,
                start: "top 82%",
              },
            },
          );
        }
      }, timelineRef);
    };

    initGSAP();

    return () => ctx?.revert();
  }, []);

  return (
    <Section id="experience">
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

          <div className="space-y-10">
            {portfolio.experiences.map((exp, i) => (
              <div
                key={i}
                className={`experience-item relative flex flex-col md:flex-row ${
                  i % 2 === 0 ? "md:flex-row-reverse" : ""
                } gap-8`}
              >
                {/* Timeline dot */}
                <div className="timeline-dot absolute right-3.5 md:right-1/2 md:-translate-x-1/2 top-6 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-950 z-10 shadow-glow" />

                {/* Spacer */}
                <div className="hidden md:block flex-1" />

                {/* Card */}
                <div className="flex-1 mr-10 md:mr-0">
                  <div
                    className="glass-card p-6 hover:border-blue-500/40 hover:shadow-glow transition-all duration-300 group"
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

                    {/* Accent */}
                    <div className="mt-4 h-px w-0 group-hover:w-full bg-linear-to-l from-blue-500/50 to-transparent transition-all duration-500 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
