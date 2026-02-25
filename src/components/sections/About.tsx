'use client';

import { motion } from 'framer-motion';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import { TECH_MAP } from '@/components/icons/TechIcons';
import portfolio from '@/data/portfolio';

// Ordered list of technologies to feature
const FEATURED_TECHS = [
  'Node.js',
  'Express',
  'Next.js',
  'React',
  'TailwindCSS',
  'MongoDB',
  'PostgreSQL',
  'WebSocket',
  'Leaflet',
  'Nginx',
  'Git',
  'Figma',
  'Postman',
  'WordPress',
];

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

export default function About() {
  return (
    <Section id="about" className="bg-slate-950/60 relative">
      {/* Subtle top separator */}
      <div className="absolute top-0 inset-x-0 h-px bg-linear-to-r from-transparent via-slate-700/40 to-transparent" />
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* ── Left column: text + KPI stats ── */}
          <div dir="rtl">
            <SectionHeader
              label="درباره من"
              title="کمی بیشتر آشنا شویم"
              description={portfolio.summary}
            />

            {/* KPI stat cards */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {portfolio.stats.map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="glass-card p-5 group hover:border-blue-500/40 hover:shadow-glow transition-all duration-300"
                >
                  <div className="text-3xl font-bold text-gradient mb-1 tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-slate-400 text-xs leading-relaxed">
                    {stat.label}
                  </div>
                  <div className="mt-3 h-0.5 w-0 group-hover:w-full bg-linear-to-r from-blue-500 to-cyan-400 transition-all duration-500 rounded-full" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Right column: tech stack with brand-colored chips ── */}
          <div>
            <p className="text-sm font-semibold text-slate-400 mb-5 uppercase tracking-wider text-right">
              تکنولوژی‌هایی که استفاده می‌کنم
            </p>
            <div className="flex flex-wrap gap-2.5 justify-start sm:justify-end">
              {FEATURED_TECHS.map((tech, i) => {
                const info = TECH_MAP[tech];
                if (!info) return null;
                const rgb = hexToRgb(info.color);
                const Icon = info.Icon;
                return (
                  <motion.div
                    key={tech}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04, duration: 0.35 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-105 cursor-default"
                    style={{
                      backgroundColor: `rgba(${rgb}, 0.12)`,
                      border: `1px solid rgba(${rgb}, 0.28)`,
                      color: info.color,
                    }}
                  >
                    <Icon
                      className="w-4 h-4 shrink-0"
                      style={{ color: info.color }}
                    />
                    <span className="leading-none">{info.name}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
