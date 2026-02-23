# امید قنبری – Portfolio Website

A professional, dark-themed full-stack developer portfolio built with **Next.js 14**, **TypeScript**, **TailwindCSS**, and **Framer Motion**.

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
