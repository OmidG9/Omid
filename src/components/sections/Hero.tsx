"use client";

import { motion, Variants } from "framer-motion";
import {
  Github,
  Linkedin,
  Send,
  ArrowDown,
  MapPin,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import portfolio from "@/data/portfolio";

const socialIcons: Record<string, React.ElementType> = {
  GitHub: Github,
  LinkedIn: Linkedin,
  Telegram: Send,
};

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] } as object,
  },
};

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center"
      aria-label="معرفی"
    >
      {/* Background gradient circles — extend into About section */}
      <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
        <div className="absolute inset-0 bg-slate-950" />
        {/* Circle 1 — large top-center blue */}
        <div
          className="hero-circle-1 absolute -top-32 left-1/2 -translate-x-1/3 rounded-full"
          style={{
            width: "780px",
            height: "780px",
            background:
              "radial-gradient(circle, rgba(59,130,246,0.16) 0%, rgba(37,99,235,0.08) 50%, transparent 75%)",
          }}
        />
        {/* Circle 2 — large bottom-right cyan */}
        <div
          className="hero-circle-2 absolute top-1/3 -right-40 rounded-full"
          style={{
            width: "640px",
            height: "640px",
            background:
              "radial-gradient(circle, rgba(34,211,238,0.12) 0%, rgba(6,182,212,0.06) 50%, transparent 75%)",
          }}
        />
      </div>

      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8 pt-24 pb-16">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-center text-center"
        >
          {/* Availability badge */}
          <motion.div variants={itemVariants} className="mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-700/60 rounded-full text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-slate-300">{portfolio.availability}</span>
              <span className="text-slate-500 mx-1">·</span>
              <MapPin size={13} className="text-slate-400" />
              <span className="text-slate-400">{portfolio.location}</span>
            </span>
          </motion.div>

          {/* Name */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold text-slate-100 mb-4 tracking-tight"
          >
            {portfolio.nameEn}
          </motion.h1>

          {/* Title */}
          <motion.p
            variants={itemVariants}
            className="text-lg md:text-2xl font-medium text-gradient mb-8"
          >
            {portfolio.titleEn}
          </motion.p>

          {/* Persian value proposition */}
          <motion.div
            variants={itemVariants}
            className="max-w-xl mb-10 px-6 py-4 glass-card text-center"
            dir="rtl"
          >
            {portfolio.heroValue.split("\n").map((line, i) => (
              <p
                key={i}
                className={`text-slate-300 text-base leading-relaxed ${i === 0 ? "mb-1" : ""}`}
              >
                {line}
              </p>
            ))}
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-wrap items-center justify-center gap-4 mb-10"
          >
            <a href="#projects" className="btn-primary text-base px-8 py-3">
              <Briefcase size={18} />
              مشاهده پروژه‌ها
            </a>
            <a href="#contact" className="btn-secondary text-base px-8 py-3">
              تماس با من
            </a>
          </motion.div>

          {/* Social links */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-4"
          >
            {portfolio.socials.map((social) => {
              const Icon = socialIcons[social.platform];
              if (!Icon) return null;
              return (
                <a
                  key={social.platform}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  className="flex items-center gap-2 p-3 glass-card text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-xl group"
                >
                  <Icon size={20} />
                  <span className="text-sm font-medium sr-only">
                    {social.platform}
                  </span>
                </a>
              );
            })}
          </motion.div>

          {/* Scroll indicator */}
          <motion.div variants={itemVariants} className="mt-20">
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-1 text-slate-600 cursor-pointer hover:text-slate-400 transition-colors"
              onClick={() =>
                document
                  .getElementById("about")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <span className="text-xs tracking-widest uppercase">Scroll</span>
              <ArrowDown size={16} />
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
