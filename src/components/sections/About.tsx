"use client";

import { motion } from "framer-motion";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import portfolio from "@/data/portfolio";

export default function About() {
  return (
    <Section id="about" className="bg-slate-950">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left: Text */}
          <div dir="rtl">
            <SectionHeader
              label="درباره من"
              title="کمی بیشتر بشناسیدم"
              description={portfolio.summary}
            />

            {/* Tech badges */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
                تکنولوژی‌هایی که استفاده می‌کنم
              </p>
              <div className="flex flex-wrap gap-2">
                {portfolio.techBadges.map((tech) => (
                  <span key={tech} className="skill-chip">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
            {portfolio.stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card p-6 group hover:border-blue-500/40 hover:shadow-glow transition-all duration-300"
                dir="rtl"
              >
                <div className="text-4xl font-bold text-gradient mb-2 tracking-tight">
                  {stat.value}
                </div>
                <div className="text-slate-400 text-sm leading-relaxed">
                  {stat.label}
                </div>
                <div className="mt-3 h-0.5 w-0 group-hover:w-full bg-linear-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full" />
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </Section>
  );
}
