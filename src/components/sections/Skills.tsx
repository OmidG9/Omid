'use client';

import { motion } from 'framer-motion';
import { Server, Monitor, Map, Terminal, Wrench } from 'lucide-react';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import portfolio from '@/data/portfolio';

const iconMap: Record<string, React.ElementType> = {
  server: Server,
  monitor: Monitor,
  map: Map,
  terminal: Terminal,
  tool: Wrench,
};

export default function Skills() {
  return (
    <Section id="skills" className="bg-slate-950/50">
      <Container>
        <SectionHeader
          label="مهارت‌ها"
          title="چه کاری انجام می‌دهم"
          description="مجموعه‌ای از تکنولوژی‌ها و ابزارهایی که در پروژه‌های واقعی با آن‌ها کار کرده‌ام."
          center
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {portfolio.skillCategories.map((category, i) => {
            const Icon = iconMap[category.icon] || Server;
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="glass-card p-6 group hover:border-blue-500/40 hover:shadow-glow transition-all duration-300"
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors duration-300">
                    <Icon size={20} className="text-blue-400" />
                  </div>
                  <h3 className="font-semibold text-slate-200 text-base">
                    {category.name}
                  </h3>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-2">
                  {category.skills.map((skill) => (
                    <span
                      key={skill.name}
                      className="px-3 py-1.5 bg-slate-800/60 border border-slate-700/40 text-slate-300 text-sm rounded-lg hover:border-blue-500/40 hover:text-blue-300 hover:bg-blue-500/5 transition-all duration-200"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>

                {/* Accent line */}
                <div className="mt-4 h-px w-0 group-hover:w-full bg-linear-to-r from-blue-500/50 to-transparent transition-all duration-500 rounded-full" />
              </motion.div>
            );
          })}
        </div>
      </Container>
    </Section>
  );
}
