"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface SectionHeaderProps {
  label: string;
  title: string;
  description?: string;
  center?: boolean;
  children?: ReactNode;
}

export default function SectionHeader({
  label,
  title,
  description,
  center = false,
  children,
}: SectionHeaderProps) {
  return (
    <motion.div
      className={`mb-14 ${center ? "text-center" : ""}`}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
    >
      <p className="section-label">{label}</p>
      <h2 className="section-heading">{title}</h2>
      {description && (
        <p className="section-subheading mt-3 max-w-2xl">{description}</p>
      )}
      {children}
    </motion.div>
  );
}
