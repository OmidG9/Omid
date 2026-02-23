import { ReactNode } from "react";

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
    <div className={`mb-14 ${center ? "text-center" : ""}`}>
      <p className="section-label">{label}</p>
      <h2 className="section-heading">{title}</h2>
      {description && (
        <p className="section-subheading mt-3 max-w-2xl">{description}</p>
      )}
      {children}
    </div>
  );
}
