import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "امید قنبری | Full-Stack Web Developer",
  description:
    "توسعه‌دهنده فول‌استک با تخصص در Node.js، React و Next.js. تجربه در پروژه‌های سازمانی، داشبوردهای Real-Time و بهینه‌سازی عملکرد.",
  keywords: [
    "Omid Ghanbari",
    "امید قنبری",
    "Full-Stack Developer",
    "Node.js",
    "React",
    "Next.js",
    "Web Developer Tehran",
  ],
  authors: [{ name: "Omid Ghanbari" }],
  creator: "Omid Ghanbari",
  openGraph: {
    type: "website",
    locale: "fa_IR",
    url: "https://omidghanbari.dev",
    title: "امید قنبری | Full-Stack Web Developer",
    description: "توسعه‌دهنده فول‌استک با تخصص در Node.js، React و Next.js.",
    siteName: "Omid Ghanbari Portfolio",
  },
  twitter: {
    card: "summary_large_image",
    title: "امید قنبری | Full-Stack Web Developer",
    description: "توسعه‌دهنده فول‌استک با تخصص در Node.js، React و Next.js.",
  },
  robots: "index, follow",
  icons: {
    icon: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={vazirmatn.variable}>
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#1e293b",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: "0.75rem",
            },
          }}
        />
      </body>
    </html>
  );
}
