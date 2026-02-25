import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, ExternalLink, Github, CheckCircle2 } from 'lucide-react';
import type { Metadata } from 'next';
import portfolio from '@/data/portfolio';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Container from '@/components/ui/Container';
import Gallery from '@/components/projects/Gallery';
import { getCategoryStyle } from '@/lib/categoryColors';

interface Props {
  params: { slug: string };
}

export async function generateStaticParams() {
  return portfolio.projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = portfolio.projects.find((p) => p.slug === params.slug);
  if (!project) return { title: 'پروژه یافت نشد' };
  return {
    title: `${project.title} | امید قنبری`,
    description: project.description,
  };
}

export default function ProjectDetailPage({ params }: Props) {
  const project = portfolio.projects.find((p) => p.slug === params.slug);
  if (!project) notFound();

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 pt-20">
        {/* Hero band */}
        <div className="relative overflow-hidden bg-linear-to-b from-slate-900 to-slate-950 border-b border-slate-800/60 py-16">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-75 bg-blue-600/8 rounded-full blur-3xl" />
          </div>
          <Container>
            {/* Breadcrumb */}
            <nav
              aria-label="breadcrumb"
              className="mb-6 flex items-center gap-2 text-sm text-slate-500"
              dir="rtl"
            >
              <Link
                href="/#projects"
                className="flex items-center gap-1 hover:text-blue-400 transition-colors"
              >
                <ArrowRight size={14} />
                پروژه‌ها
              </Link>
              <span>/</span>
              <span className="text-slate-300">{project.title}</span>
            </nav>

            {/* Title block */}
            <div dir="rtl">
              <div className="flex flex-wrap gap-2 mb-4">
                {project.category.map((cat) => (
                  <span
                    key={cat}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${getCategoryStyle(cat).tag}`}
                  >
                    {cat}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-slate-100 mb-3">
                {project.title}
              </h1>
              <p className="text-blue-400 text-xl mb-6">{project.subtitle}</p>
              <p className="text-slate-300 text-lg leading-relaxed max-w-3xl">
                {project.description}
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-8">
                {/* Demo button — always rendered */}
                {project.demoUrl ? (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    <ExternalLink size={16} />
                    دموی زنده
                  </a>
                ) : (
                  <div className="relative group/demo inline-block">
                    <button
                      disabled
                      className="btn-primary opacity-40 cursor-not-allowed"
                    >
                      <ExternalLink size={16} />
                      دموی زنده
                    </button>
                    <div className="absolute bottom-full mb-2 right-0 w-64 px-3 py-2 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg opacity-0 group-hover/demo:opacity-100 transition-opacity duration-200 pointer-events-none z-20 text-right leading-relaxed">
                      فعلاً برای این پروژه دمویی وجود ندارد
                    </div>
                  </div>
                )}
                {project.githubUrl && (
                  <a
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary"
                  >
                    <Github size={16} />
                    GitHub
                  </a>
                )}
                <Link href="/#projects" className="btn-secondary">
                  <ArrowRight size={16} />
                  بازگشت
                </Link>
              </div>
            </div>
          </Container>
        </div>

        {/* Main content */}
        <Container className="py-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* Main column */}
            <div className="lg:col-span-2 space-y-10">
              {/* Gallery */}
              <section aria-label="گالری تصاویر" dir="rtl">
                <h2 className="text-xl font-bold text-slate-100 mb-5">
                  گالری تصاویر
                </h2>
                <Gallery images={project.images} title={project.title} />
              </section>

              {/* Long description */}
              <section aria-label="توضیحات" dir="rtl">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  درباره پروژه
                </h2>
                <div className="glass-card p-6">
                  <p className="text-slate-300 leading-8 text-base">
                    {project.longDescription}
                  </p>
                </div>
              </section>

              {/* Features */}
              <section aria-label="ویژگی‌ها" dir="rtl">
                <h2 className="text-xl font-bold text-slate-100 mb-4">
                  ویژگی‌های کلیدی
                </h2>
                <div className="glass-card p-6">
                  <ul className="space-y-3">
                    {project.features.map((f, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-3 text-slate-300"
                      >
                        <CheckCircle2
                          size={18}
                          className="text-blue-400 mt-0.5 shrink-0"
                        />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="space-y-6" dir="rtl">
              {/* Tech stack */}
              <div className="glass-card p-6">
                <h3 className="text-base font-bold text-slate-100 mb-4">
                  تکنولوژی‌ها
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.stack.map((tech) => {
                    const cat = project.category[0] ?? 'Full-Stack';
                    const style = getCategoryStyle(cat);
                    return (
                      <span
                        key={tech}
                        className={`px-3 py-1.5 text-sm rounded-lg border ${style.tag}`}
                      >
                        {tech}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Demo section */}
              <div className="glass-card p-6">
                <h3 className="text-base font-bold text-slate-100 mb-4">
                  دموی زنده
                </h3>
                {project.demoType === 'embed' && project.demoUrl ? (
                  <div className="overflow-hidden rounded-lg border border-slate-700/60">
                    <iframe
                      src={project.demoUrl}
                      title={`دموی ${project.title}`}
                      className="w-full h-64"
                      sandbox="allow-scripts allow-same-origin allow-forms"
                      loading="lazy"
                    />
                  </div>
                ) : project.demoUrl ? (
                  <a
                    href={project.demoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary w-full justify-center text-sm"
                  >
                    <ExternalLink size={15} />
                    مشاهده دمو
                  </a>
                ) : (
                  <div className="relative group/demo">
                    <button
                      disabled
                      className="btn-primary w-full justify-center text-sm opacity-40 cursor-not-allowed"
                    >
                      <ExternalLink size={15} />
                      دموی زنده
                    </button>
                    <p className="mt-3 text-xs text-slate-500 text-center leading-relaxed">
                      فعلاً برای این پروژه دمویی وجود ندارد
                    </p>
                  </div>
                )}
              </div>

              {/* Back */}
              <Link
                href="/#projects"
                className="btn-secondary w-full justify-center"
              >
                <ArrowRight size={16} />
                بازگشت به پروژه‌ها
              </Link>
            </aside>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
