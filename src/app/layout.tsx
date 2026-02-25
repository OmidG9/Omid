import type { Metadata, Viewport } from 'next';
import dynamic from 'next/dynamic';
import '@fontsource/vazirmatn/300.css';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const IntroOverlay = dynamic(() => import('@/components/IntroOverlay'), {
  ssr: false,
});

const BASE_URL = 'https://omidghanbari.dev';

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    template: '%s | امید قنبری',
    default: 'امید قنبری | Full-Stack Web Developer',
  },
  description:
    'توسعه‌دهنده فول‌استک با تخصص در Node.js، React و Next.js. تجربه در پروژه‌های سازمانی، داشبوردهای Real-Time و بهینه‌سازی عملکرد.',
  keywords: [
    'Omid Ghanbari',
    'امید قنبری',
    'Full-Stack Developer',
    'Node.js',
    'React',
    'Next.js',
    'TypeScript',
    'Web Developer Tehran',
    'توسعه‌دهنده وب تهران',
    'برنامه‌نویس فول‌استک',
  ],
  authors: [{ name: 'Omid Ghanbari', url: BASE_URL }],
  creator: 'Omid Ghanbari',
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    alternateLocale: 'en_US',
    url: BASE_URL,
    title: 'امید قنبری | Full-Stack Web Developer',
    description:
      'توسعه‌دهنده فول‌استک با تخصص در Node.js، React و Next.js. تجربه در پروژه‌های سازمانی، داشبوردهای Real-Time و بهینه‌سازی عملکرد.',
    siteName: 'Omid Ghanbari Portfolio',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'امید قنبری – Full-Stack Web Developer',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'امید قنبری | Full-Stack Web Developer',
    description:
      'توسعه‌دهنده فول‌استک با تخصص در Node.js، React و Next.js. تجربه در پروژه‌های سازمانی، داشبوردهای Real-Time و بهینه‌سازی عملکرد.',
    creator: '@omidghanbari',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.svg',
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <IntroOverlay />
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid #334155',
              borderRadius: '0.75rem',
            },
          }}
        />
      </body>
    </html>
  );
}
