'use client';

import { motion } from 'framer-motion';
import { Mail, MapPin, Send, Github, Linkedin } from 'lucide-react';
import Section from '@/components/ui/Section';
import Container from '@/components/ui/Container';
import SectionHeader from '@/components/ui/SectionHeader';
import ContactForm from '@/components/contact/ContactForm';
import portfolio from '@/data/portfolio';

const contactInfo = [
  {
    icon: Mail,
    label: 'ایمیل',
    value: portfolio.email,
    href: `mailto:${portfolio.email}`,
  },
  {
    icon: Send,
    label: 'تلگرام',
    value: '@hope3179',
    href: portfolio.telegram,
  },
  {
    icon: MapPin,
    label: 'موقعیت',
    value: portfolio.location,
    href: null,
  },
];

const socialLinks = [
  { icon: Github, label: 'GitHub', href: 'https://github.com/OmidG9' },
  {
    icon: Linkedin,
    label: 'LinkedIn',
    href: 'https://linkedin.com/in/USERNAME',
  },
  { icon: Send, label: 'Telegram', href: 'https://t.me/hope3179' },
];

export default function Contact() {
  return (
    <Section id="contact">
      <Container>
        <SectionHeader
          label="تماس"
          title="در تماس باشیم"
          description="برای همکاری، مشاوره یا هر پرسشی، پیام‌تان را با کمال میل دریافت می‌کنم."
          center
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: Contact Info */}
          <motion.div
            className="space-y-6"
            dir="rtl"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="glass-card p-6 space-y-5">
              {contactInfo.map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">{label}</p>
                    {href ? (
                      <a
                        href={href}
                        target={href.startsWith('http') ? '_blank' : undefined}
                        rel="noopener noreferrer"
                        className="text-slate-200 hover:text-blue-400 transition-colors font-medium text-sm"
                      >
                        {value}
                      </a>
                    ) : (
                      <p className="text-slate-200 font-medium text-sm">
                        {value}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Social quick links */}
            <div className="glass-card p-5" dir="rtl">
              <p className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">
                شبکه‌های اجتماعی
              </p>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex items-center gap-2 px-4 py-2.5 glass-card text-slate-400 hover:text-blue-400 hover:border-blue-500/40 transition-all duration-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <Icon size={16} />
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Availability note */}
            <div
              className="glass-card p-5 border-green-500/20 bg-green-500/5"
              dir="rtl"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shrink-0" />
                <p className="text-green-300 text-sm font-medium">
                  {portfolio.availability} — آماده بررسی فرصت‌های شغلی
                </p>
              </div>
            </div>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <ContactForm />
          </motion.div>
        </div>
      </Container>
    </Section>
  );
}
