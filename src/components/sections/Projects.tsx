"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Section from "@/components/ui/Section";
import Container from "@/components/ui/Container";
import SectionHeader from "@/components/ui/SectionHeader";
import ProjectCard from "@/components/projects/ProjectCard";
import portfolio from "@/data/portfolio";

const allCategories = ["همه", "Full-Stack", "Frontend", "UI/UX", "WordPress"];

export default function Projects() {
  const [active, setActive] = useState("همه");

  const filtered =
    active === "همه"
      ? portfolio.projects
      : portfolio.projects.filter((p) => p.category.includes(active));

  return (
    <Section id="projects" className="bg-slate-950/50">
      <Container>
        <SectionHeader
          label="پروژه‌ها"
          title="نمونه کارها"
          description="انتخابی از پروژه‌هایی که طراحی، توسعه یا بهبود داده‌ام."
          center
        />

        {/* Filter chips */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`px-5 py-2 text-sm font-medium rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95 ${
                active === cat
                  ? "bg-blue-600 border-blue-600 text-white shadow-glow"
                  : "bg-transparent border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div
          layout
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filtered.map((project, i) => (
              <motion.div
                key={project.slug}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectCard project={project} index={i} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-slate-500">
            <p>پروژه‌ای در این دسته‌بندی یافت نشد.</p>
          </div>
        )}
      </Container>
    </Section>
  );
}
