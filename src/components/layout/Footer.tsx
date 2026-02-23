import Link from "next/link";
import { Github } from "lucide-react";
import Container from "@/components/ui/Container";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-slate-800/60 bg-slate-950 py-10">
      <Container>
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-4"
          dir="rtl"
        >
          {/* Logo + copyright */}
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-linear-to-br from-blue-500 to-blue-700 rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-glow">
              OG
            </span>
            <p className="text-slate-400 text-sm">
              © {year} امید قنبری — تمام حقوق محفوظ است
            </p>
          </div>

          {/* Built with + GitHub */}
          <div className="flex items-center gap-4 text-slate-500 text-sm">
            <span>ساخته شده با Next.js & TailwindCSS</span>
            <a
              href="https://github.com/OmidG9"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub Profile"
              className="flex items-center gap-1.5 hover:text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            >
              <Github size={16} />
              GitHub
            </a>
          </div>
        </div>
      </Container>
    </footer>
  );
}
