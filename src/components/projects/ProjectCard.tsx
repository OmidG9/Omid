"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Github, ArrowUpRight, BookOpen } from "lucide-react";
import { Project } from "@/data/portfolio";

interface ProjectCardProps {
  project: Project;
  index: number;
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.08 }}
      whileHover={{ y: -4 }}
      className="group glass-card overflow-hidden flex flex-col hover:border-blue-500/40 hover:shadow-glow transition-all duration-300"
    >
      {/* Cover image */}
      <div className="relative h-52 bg-linear-to-br from-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-br from-blue-600/10 to-cyan-500/5" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center">
              <BookOpen size={28} className="text-blue-400" />
            </div>
            <p className="text-slate-500 text-xs">{project.slug}</p>
          </div>
        </div>
        {/* Category badges */}
        <div className="absolute top-3 right-3 flex gap-1.5">
          {project.category.slice(0, 2).map((cat) => (
            <span
              key={cat}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-950/70 backdrop-blur-sm border border-slate-700/60 text-slate-300 rounded-full"
            >
              {cat}
            </span>
          ))}
        </div>
        {/* Hover glow overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-linear-to-t from-blue-600/20 to-transparent pointer-events-none" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5" dir="rtl">
        <h3 className="font-bold text-slate-100 text-lg mb-1 group-hover:text-blue-300 transition-colors">
          {project.title}
        </h3>
        <p className="text-blue-400/80 text-sm mb-3">{project.subtitle}</p>
        <p className="text-slate-400 text-sm leading-relaxed line-clamp-2 mb-4">
          {project.description}
        </p>

        {/* Stack chips */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {project.stack.slice(0, 5).map((tech) => (
            <span
              key={tech}
              className="text-xs px-2.5 py-1 bg-slate-800/70 border border-slate-700/40 text-slate-400 rounded-md"
            >
              {tech}
            </span>
          ))}
          {project.stack.length > 5 && (
            <span className="text-xs px-2.5 py-1 text-slate-500">
              +{project.stack.length - 5}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex items-center gap-2 flex-wrap">
          <Link
            href={`/projects/${project.slug}`}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 active:scale-95"
          >
            <ArrowUpRight size={15} />
            مطالعه بیشتر
          </Link>

          {project.liveUrl && (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`Live demo of ${project.title}`}
            >
              <ExternalLink size={14} />
              نمایش زنده
            </a>
          )}

          {project.githubUrl && (
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-transparent border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 text-sm rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={`GitHub repo for ${project.title}`}
            >
              <Github size={14} />
              GitHub
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
