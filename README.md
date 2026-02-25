# Portfolio — Omid Ghanbari

Personal portfolio built with **Next.js 14 App Router**, TypeScript, TailwindCSS v4, Framer Motion, and GSAP.

---

## Getting Started

**Requirements:** Node.js 18+, npm 9+

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start   # production
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values.
See `.env.example` for the list of required keys — **never commit `.env.local`**.

---

## Project Structure

```
src/
 app/
    layout.tsx            # Root layout (font, metadata, intro overlay)
    page.tsx              # Homepage
    globals.css           # Tailwind theme tokens + global styles
    api/contact/          # POST /api/contact  email + rate limiter
    projects/[slug]/      # Dynamic project detail page
 components/
    IntroOverlay.tsx      # First-visit fullscreen intro
    layout/               # Navbar, Footer
    sections/             # Hero, About, Skills, Experience, Projects, Contact
    projects/             # ProjectCard, Gallery
    contact/              # ContactForm
    icons/                # TechIcons + TECH_MAP
    ui/                   # Section, Container, SectionHeader
 data/
    portfolio.ts          # all site content lives here
 lib/
     categoryColors.ts
     contactSchema.ts
     email.ts
     rateLimiter.ts        # Upstash Redis sliding-window (falls back to memory)
```

---

## Editing Content

All text, projects, skills, experience, and social links are in **`src/data/portfolio.ts`** no other files need to change.

---

## Adding a Project

1. Add an entry to the `projects` array in `portfolio.ts`:

```typescript
{
  slug: 'my-project',
  title: '...',
  subtitle: '...',
  description: '...',
  longDescription: '...',
  stack: ['Next.js', 'MongoDB'],
  category: ['Full-Stack'],          // Full-Stack | Frontend | UI/UX | WordPress
  coverImage: '/projects/my-project/cover.jpg',
  images: [{ src: '/projects/my-project/cover.jpg', alt: '...' }],
  liveUrl: 'https://...',            // optional
  githubUrl: 'https://github.com/...', // optional
  demoUrl: 'https://...',            // optional  enables demo button
  demoType: 'link',                  // 'link' | 'embed' (iframe)
  features: ['...'],
}
```

2. Place images in `public/projects/my-project/` (recommended cover: 1200x630 px).

---

## Adding a Tech Icon

1. Create an SVG component in `src/components/icons/TechIcons.tsx`:

```typescript
export const MyTechIcon = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24">...</svg>
);
```

2. Register in `TECH_MAP`:

```typescript
"My Tech": { name: "My Tech", Icon: MyTechIcon, color: "#HEX" },
```

---

## Category Colors

Centralized in `src/lib/categoryColors.ts`.

| Category   | Color           |
| ---------- | --------------- |
| Full-Stack | Blue            |
| Frontend   | Cyan / Sky      |
| UI/UX      | Violet / Purple |
| WordPress  | Indigo          |

---

## Deploy

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com) Next.js is auto-detected
3. Add environment variables in Vercel project settings

---

## Color Palette

| Token      | Value             | Usage               |
| ---------- | ----------------- | ------------------- |
| Background | #020617 slate-950 | Page background     |
| Surface    | #0f172a slate-900 | Cards               |
| Accent     | #3b82f6 blue-500  | Buttons, highlights |
| Text       | #f1f5f9 slate-100 | Headings            |
| Muted      | #94a3b8 slate-400 | Body text           |

---

Built with Next.js 14 · TypeScript · TailwindCSS · Framer Motion · GSAP
