# امید قنبری – Portfolio Website

A professional, dark-themed full-stack developer portfolio built with **Next.js 14**, **TypeScript**, **TailwindCSS**, **Framer Motion**, and **GSAP**.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout (Vazirmatn font, RTL, metadata)
│   ├── page.tsx             # Homepage (all sections)
│   ├── globals.css          # Global Tailwind styles + gradient keyframes
│   ├── api/
│   │   └── contact/
│   │       └── route.ts     # POST /api/contact handler
│   └── projects/
│       └── [slug]/
│           └── page.tsx     # Project detail page with demo section
├── components/
│   ├── icons/
│   │   └── TechIcons.tsx    # SVG tech icons + TECH_MAP brand colors
│   ├── layout/
│   │   ├── Navbar.tsx       # Sticky navbar (no border flicker)
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── Hero.tsx         # CSS-animated gradient circles
│   │   ├── About.tsx        # Two-column: text+stats / branded tech chips
│   │   ├── Skills.tsx
│   │   ├── Experience.tsx   # GSAP ScrollTrigger animations
│   │   ├── Projects.tsx     # Category-colored filter chips
│   │   └── Contact.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx  # Always-visible demo button + category colors
│   │   └── Gallery.tsx
│   ├── contact/
│   │   └── ContactForm.tsx
│   └── ui/
│       ├── Section.tsx
│       ├── Container.tsx
│       └── SectionHeader.tsx  # Framer Motion whileInView entrance
├── data/
│   └── portfolio.ts           # ← ALL content lives here
└── lib/
    ├── categoryColors.ts      # Category → Tailwind color tokens
    └── contactSchema.ts       # Zod schema
```

---

## ✏️ How to Edit Content

All text content, projects, skills, experience, and social links are in:

```
src/data/portfolio.ts
```

---

## 🖼️ How to Add a New Project

1. Add an entry in `src/data/portfolio.ts` under `projects`:

```typescript
{
  slug: 'my-project',
  title: 'عنوان پروژه',
  subtitle: 'زیرعنوان',
  description: 'توضیح کوتاه',
  longDescription: 'توضیح کامل...',
  stack: ['Next.js', 'MongoDB'],
  category: ['Full-Stack'],               // Full-Stack | Frontend | UI/UX | WordPress
  coverImage: '/projects/my-project/cover.jpg',
  images: [{ src: '/projects/my-project/cover.jpg', alt: 'Cover' }],
  liveUrl: 'https://your-live-site.com',  // optional
  githubUrl: 'https://github.com/...',    // optional
  demoUrl: 'https://demo.example.com',   // optional — activates demo button
  demoType: 'link',                       // 'link' (default) | 'embed' (iframe)
  features: ['ویژگی ۱', 'ویژگی ۲'],
}
```

2. Add images to `public/projects/my-project/` (recommended: 1200×630px cover).

---

## 🎬 Enabling a Live Demo

Each project card and detail page renders a **"دموی زنده"** button:

| State                                   | Behaviour                            |
| --------------------------------------- | ------------------------------------ |
| `demoUrl` present + `demoType: 'link'`  | Opens the URL in a new tab           |
| `demoUrl` present + `demoType: 'embed'` | Renders an `<iframe>` in the sidebar |
| `demoUrl` absent                        | Disabled button + Persian tooltip    |

### To add an iframe embed demo:

```typescript
demoUrl: 'https://codesandbox.io/embed/...',
demoType: 'embed',
```

---

## 🎨 Tech Logo Icons

Icons are stored as inline SVG React components in `src/components/icons/TechIcons.tsx`.

The `TECH_MAP` object maps technology names to their icon component and brand colour:

```typescript
import { TECH_MAP } from "@/components/icons/TechIcons";
const { Icon, color, name } = TECH_MAP["React"];
```

### To add a new technology:

1. Create an SVG component in `TechIcons.tsx`:

```typescript
export const MyTechIcon = ({ className, style }: IconProps) => (
  <svg className={className} style={style} viewBox="0 0 24 24" ...>
    {/* paths */}
  </svg>
);
```

2. Register it in `TECH_MAP`:

```typescript
"My Tech": { name: "My Tech", Icon: MyTechIcon, color: "#HEXCOLOR" },
```

3. Add it to `FEATURED_TECHS` array in `About.tsx` to display it in the About section.

---

## 🏷️ Category Color System

Category colors are centralised in `src/lib/categoryColors.ts`:

| Category   | Colour          |
| ---------- | --------------- |
| Full-Stack | Blue            |
| Frontend   | Cyan / Sky      |
| UI/UX      | Violet / Purple |
| WordPress  | Indigo          |

Used by filter chips in `Projects.tsx`, tag badges in `ProjectCard.tsx`, and the detail page.

---

## 📧 Contact Form

Posts to `/api/contact`. Add email service in `src/app/api/contact/route.ts`.

**Recommended: [Resend](https://resend.com)**

```bash
npm install resend
```

---

## 📄 Resume

Place your PDF at `public/resume.pdf`. The navbar button links to it automatically.

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Deploy — Vercel auto-detects Next.js

---

## 🎨 Color Palette

| Token        | Value               | Usage               |
| ------------ | ------------------- | ------------------- |
| Background   | `#020617` slate-950 | Page background     |
| Surface      | `#0f172a` slate-900 | Cards               |
| Accent       | `#3b82f6` blue-500  | Buttons, highlights |
| Text primary | `#f1f5f9` slate-100 | Headings            |
| Text muted   | `#94a3b8` slate-400 | Body                |

---

Built with Next.js 14 · TypeScript · TailwindCSS · Framer Motion · GSAP

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout (font, metadata, toast)
│   ├── page.tsx             # Homepage (all sections)
│   ├── globals.css          # Global Tailwind styles
│   ├── api/
│   │   └── contact/
│   │       └── route.ts     # POST /api/contact handler
│   └── projects/
│       └── [slug]/
│           └── page.tsx     # Project detail page
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx       # Sticky navbar with blur + active indicator
│   │   └── Footer.tsx
│   ├── sections/
│   │   ├── Hero.tsx
│   │   ├── About.tsx
│   │   ├── Skills.tsx
│   │   ├── Experience.tsx
│   │   ├── Projects.tsx
│   │   └── Contact.tsx
│   ├── projects/
│   │   ├── ProjectCard.tsx
│   │   └── Gallery.tsx
│   ├── contact/
│   │   └── ContactForm.tsx
│   └── ui/
│       ├── Section.tsx
│       ├── Container.tsx
│       └── SectionHeader.tsx
├── data/
│   └── portfolio.ts         # ← ALL content lives here
└── lib/
    └── contactSchema.ts     # Zod schema
```

---

## ✏️ How to Edit Content

All text content, projects, skills, experience, and social links are in one file:

```
src/data/portfolio.ts
```

Edit directly — no other files need to change.

---

## 🖼️ How to Add a New Project

1. Add entry in `src/data/portfolio.ts` under the `projects` array:

```typescript
{
  slug: 'my-new-project',
  title: 'عنوان پروژه',
  subtitle: 'زیرعنوان',
  description: 'توضیح کوتاه',
  longDescription: 'توضیح کامل...',
  stack: ['Next.js', 'MongoDB'],
  category: ['Full-Stack'],
  coverImage: '/projects/my-new-project/cover.jpg',
  images: [
    { src: '/projects/my-new-project/cover.jpg', alt: 'Cover' },
  ],
  liveUrl: 'https://your-live-site.com',
  githubUrl: 'https://github.com/...',
  features: ['ویژگی ۱', 'ویژگی ۲'],
}
```

2. Add images to `public/projects/my-new-project/` (recommended: 1200×630px for cover).

---

## 📧 Contact Form

Posts to `/api/contact`. Add email service in `src/app/api/contact/route.ts`.

**Recommended: [Resend](https://resend.com)**

```bash
npm install resend
```

---

## 📄 Resume

Place your PDF at `public/resume.pdf`. The navbar button links to it automatically.

---

## 🌐 Deploy to Vercel

1. Push to GitHub
2. Import at [vercel.com](https://vercel.com)
3. Deploy — Vercel auto-detects Next.js

---

## 🎨 Color Palette

| Token        | Value               | Usage               |
| ------------ | ------------------- | ------------------- |
| Background   | `#020617` slate-950 | Page background     |
| Surface      | `#0f172a` slate-900 | Cards               |
| Accent       | `#3b82f6` blue-500  | Buttons, highlights |
| Text primary | `#f1f5f9` slate-100 | Headings            |
| Text muted   | `#94a3b8` slate-400 | Body                |

---

Built with Next.js 14 · TypeScript · TailwindCSS · Framer Motion
