// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

/**
 * Trims a URL string and returns `undefined` if it is empty, so optional
 * fields on Project remain truly absent rather than holding an empty string.
 */
function normalizeUrl(value?: string): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface Social {
  platform: string;
  url: string;
  label: string;
}

export interface Skill {
  name: string;
  level?: number;
}

export interface SkillCategory {
  name: string;
  icon: string;
  skills: Skill[];
}

export interface ExperienceBullet {
  text: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  type: string;
  bullets: string[];
  current?: boolean;
}

export interface ProjectImage {
  src: string;
  alt: string;
}

export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  stack: string[];
  category: string[];
  coverImage: string;
  images: ProjectImage[];
  liveUrl?: string;
  githubUrl?: string;
  /** URL for the live demo. If present, the demo button is active. */
  demoUrl?: string;
  /** How the demo is presented: external link (default) or embedded iframe. */
  demoType?: 'link' | 'embed';
  features: string[];
}

export interface PortfolioData {
  name: string;
  nameEn: string;
  title: string;
  titleEn: string;
  location: string;
  email: string;
  telegram: string;
  availability: string;
  summary: string;
  heroValue: string;
  socials: Social[];
  stats: { label: string; value: string }[];
  techBadges: string[];
  skillCategories: SkillCategory[];
  experiences: Experience[];
  projects: Project[];
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const portfolio: PortfolioData = {
  name: 'امید قنبری',
  nameEn: 'Omid Ghanbari',
  title: 'توسعه‌دهنده فول‌استک',
  titleEn: 'Full-Stack Web Developer (Node.js | React | Next.js)',
  location: 'تهران، ایران',
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? '',
  telegram: 'https://t.me/hope3179',
  availability: 'Open to opportunities',
  summary:
    'توسعه‌دهنده فول‌استک با رویکرد محصول‌محور و تجربهٔ عملی در طراحی و پیاده‌سازی اپلیکیشن‌های سازمانی، داشبوردهای Real-Time و سرویس‌های مقیاس‌پذیر. به کیفیت کد، کار تیمی منسجم و تحویل به‌موقع اهمیت می‌دهم و از ابزارهای هوش مصنوعی برای تسریع و ارتقای فرآیند توسعه بهره می‌برم.',
  heroValue:
    'توسعه‌دهنده فول‌استک با تمرکز بر محصول، کار تیمی و تحویل سریع.\nتجربه در پروژه‌های سازمانی، داشبوردهای Real-Time و بهینه‌سازی عملکرد.',

  socials: [
    {
      platform: 'GitHub',
      url: 'https://github.com/OmidG9',
      label: 'GitHub Profile',
    },
    // LinkedIn omitted until a real profile URL is available
    {
      platform: 'Telegram',
      url: 'https://t.me/hope3179',
      label: 'Telegram Contact',
    },
  ],

  stats: [
    { value: '۵۰۰۰+', label: 'کاربر فعال در IQDuel' },
    { value: '۱۲s → ۳s', label: 'کاهش زمان لود صفحه' },
    { value: '۴+', label: 'پروژهٔ سازمانی تحویل‌داده‌شده' },
  ],

  techBadges: [
    'Node.js',
    'Express',
    'React',
    'Next.js',
    'TypeScript',
    'MongoDB',
    'PostgreSQL',
    'TailwindCSS',
    'WebSocket',
    'Leaflet',
    'JWT',
    'Linux',
    'Nginx',
    'Git',
    'Figma',
  ],

  skillCategories: [
    {
      name: 'Backend',
      icon: 'server',
      skills: [
        { name: 'Node.js' },
        { name: 'Express.js' },
        { name: 'MongoDB' },
        { name: 'PostgreSQL' },
        { name: 'JWT & Auth' },
        { name: 'REST API' },
      ],
    },
    {
      name: 'Frontend',
      icon: 'monitor',
      skills: [
        { name: 'React' },
        { name: 'Next.js' },
        { name: 'TailwindCSS' },
        { name: 'JavaScript ES6+' },
        { name: 'TypeScript' },
      ],
    },
    {
      name: 'Real-time & Maps',
      icon: 'map',
      skills: [
        { name: 'WebSocket' },
        { name: 'Socket.io' },
        { name: 'Leaflet.js' },
        { name: 'Real-Time Dashboard' },
      ],
    },
    {
      name: 'DevOps',
      icon: 'terminal',
      skills: [
        { name: 'Linux' },
        { name: 'Nginx' },
        { name: 'Server Deployment' },
        { name: 'PM2' },
      ],
    },
    {
      name: 'Tools & Design',
      icon: 'tool',
      skills: [
        { name: 'Git / GitHub' },
        { name: 'Figma' },
        { name: 'Postman' },
        { name: 'WordPress' },
      ],
    },
  ],

  experiences: [
    {
      company: 'تجارت الکترونیک آرون پایدار',
      role: 'Full-Stack Developer',
      period: '۱۳۹۸ – ۱۴۰۴',
      type: 'Full-time',
      current: true,
      bullets: [
        'مشارکت در طراحی، توسعه و نگهداری بیش از ۴ پروژهٔ سازمانی از جمله آموزینو و سمفا',
        'بهبود Lighthouse Score از ~۷۰٪ به ~۹۵٪ و کاهش زمان لود از ۱۲ ثانیه به ۳ ثانیه',
        'طراحی و پیاده‌سازی APIهای RESTful مقیاس‌پذیر با Node.js و Express',
        'استقرار پروژه‌ها روی سرور Linux و پیکربندی Nginx به‌عنوان Reverse Proxy',
        'همکاری مؤثر با تیم‌های طراحی، محصول و QA در چارچوب Agile',
      ],
    },
    {
      company: 'هواپیمایی آتا – TraTicket',
      role: 'UI/UX Designer',
      period: '۱۴۰۱',
      type: 'Contract',
      current: false,
      bullets: [
        'طراحی رابط کاربری سیستم خرید بلیط هواپیما در هماهنگی با تیم ~۲۵ نفره',
        'تدوین Design System و Component Library کامل در Figma',
        'اجرای User Research و بهبود تجربهٔ کاربری فرآیند رزرو بلیط',
      ],
    },
    {
      company: 'IQDuel',
      role: 'Front-End Developer',
      period: '۱۴۰۲',
      type: 'Contract',
      current: false,
      bullets: [
        'توسعهٔ داشبورد مدیریتی با Next.js و TypeScript برای پلتفرمی با بیش از ۵۰۰۰ کاربر فعال',
        'پیاده‌سازی ارتباط Real-Time با WebSocket برای نمایش لحظه‌ای آمار و رویدادها',
        'همکاری مستمر با تیم Back-End و DevOps در تیمی ~۵۰ نفره',
        'یکپارچه‌سازی داده‌های PostgreSQL و MongoDB برای نمایش اطلاعات پیچیده',
      ],
    },
  ],

  projects: [
    {
      slug: 'nakhsha',
      title: 'نخشا (Nakhsha)',
      subtitle: 'پلتفرم مکان‌محور MVP',
      description:
        'پلتفرم مکان‌محور Full-Stack؛ پروژهٔ MVP با نقشه تعاملی Leaflet، سیستم احراز هویت JWT/OTP و ۱۰۰ محصول آزمایشی',
      longDescription:
        'نخشا یک پلتفرم مکان‌محور Full-Stack است که به‌عنوان MVP توسعه یافته. با Node.js، Express و MongoDB در Back-End و React در Front-End پیاده‌سازی شده. کاربران می‌توانند با OTP ثبت‌نام کنند، مکان‌ها را روی نقشه Leaflet ثبت، ویرایش و مشاهده کنند. سیستم احراز هویت با JWT پیاده‌سازی شده و APIهای RESTful کامل طراحی شده‌اند. در مرحلهٔ MVP با ۱۰۰ محصول آزمایشی راه‌اندازی شد.',
      stack: [
        'Node.js',
        'Express',
        'MongoDB',
        'React',
        'Leaflet.js',
        'JWT',
        'OTP',
      ],
      category: ['Full-Stack'],
      coverImage: '/projects/nakhsha/cover.jpg',
      images: [
        { src: '/projects/nakhsha/cover.jpg', alt: 'نمای کلی نخشا' },
        { src: '/projects/nakhsha/map-view.jpg', alt: 'نمای نخشا' },
        { src: '/projects/nakhsha/dashboard.jpg', alt: 'داشبورد' },
      ],
      liveUrl: normalizeUrl(''),
      githubUrl: normalizeUrl(''),
      features: [
        'احراز هویت با JWT و OTP',
        'نقشه تعاملی با Leaflet.js',
        'CRUD کامل برای مکان‌ها',
        'REST API کامل با Express',
        'آپلود تصویر برای مکان‌ها',
      ],
    },
    {
      slug: 'iqduel-dashboard',
      title: 'IQDuel Dashboard',
      subtitle: 'داشبورد Real-Time مدیریتی',
      description: 'داشبورد مدیریتی Real-Time برای بازی رقابتی با ۵۰۰۰+ کاربر',
      longDescription:
        'داشبورد مدیریتی پلتفرم IQDuel با Next.js و TypeScript ساخته شده. با WebSocket اطلاعات بازی‌ها، کاربران و تراکنش‌ها به صورت Real-Time نمایش داده می‌شوند. داده از PostgreSQL و MongoDB ترکیب شده و در قالب چارت‌های تعاملی به ادمین‌ها نمایش داده می‌شود.',
      stack: [
        'Next.js',
        'TypeScript',
        'WebSocket',
        'PostgreSQL',
        'MongoDB',
        'TailwindCSS',
      ],
      category: ['Frontend', 'Full-Stack'],
      coverImage: '/projects/iqduel-dashboard/cover.jpg',
      images: [
        { src: '/projects/iqduel-dashboard/cover.jpg', alt: 'داشبورد IQDuel' },
        {
          src: '/projects/iqduel-dashboard/realtime.jpg',
          alt: 'آمار Real-Time',
        },
      ],
      liveUrl: normalizeUrl(''),
      githubUrl: normalizeUrl(''),
      features: [
        'آمار Real-Time با WebSocket',
        'مدیریت کاربران و مسابقه‌ها',
        'نمودارهای تعاملی',
        'دسترسی نقش‌محور (RBAC)',
        'گزارش‌گیری و Export',
      ],
    },
    {
      slug: 'traticket',
      title: 'TraTicket – آتا',
      subtitle: 'طراحی UI/UX خرید بلیط هواپیما',
      description: 'طراحی رابط کاربری صفحه رزرو و خرید بلیط هواپیمایی آتا',
      longDescription:
        'در این پروژه به عنوان UI/UX Designer در تیم ~۲۵ نفره هواپیمایی آتا مشارکت داشتم. هدف اصلی طراحی مجدد فرآیند خرید بلیط با تجربه کاربری بهتر بود. Wireframe، Prototype تعاملی و Design System کامل در Figma ارائه شد.',
      stack: ['Figma', 'UI/UX', 'Design System', 'Prototyping'],
      category: ['UI/UX'],
      coverImage: '/projects/traticket/cover.jpg',
      images: [
        { src: '/projects/traticket/cover.jpg', alt: 'TraTicket Cover' },
        { src: '/projects/traticket/wireframe.jpg', alt: 'Wireframes' },
      ],
      liveUrl: normalizeUrl(''),
      githubUrl: normalizeUrl(''),
      features: [
        'طراحی فرآیند خرید ۳ مرحله‌ای',
        'Design System در Figma',
        'Responsive Design',
        'Prototype تعاملی',
        'User Research و Usability Testing',
      ],
    },
    {
      slug: 'aroon-paydar',
      title: 'آرون پایدار',
      subtitle: 'وبسایت سازمانی',
      description: 'طراحی و توسعه وبسایت سازمانی شرکت آرون پایدار با WordPress',
      longDescription:
        'وبسایت معرفی شرکت تجارت الکترونیک آرون پایدار با WordPress طراحی و پیاده‌سازی شده. شامل صفحات خدمات، نمونه کار، وبلاگ و فرم تماس است. سئو و بهینه‌سازی Performance از اولویت‌های اصلی بود.',
      stack: ['WordPress', 'PHP', 'CSS', 'SEO'],
      category: ['WordPress'],
      coverImage: '/projects/aroon-paydar/cover.jpg',
      images: [
        { src: '/projects/aroon-paydar/cover.jpg', alt: 'وبسایت آرون پایدار' },
      ],
      liveUrl: normalizeUrl(''),
      githubUrl: normalizeUrl(''),
      features: [
        'طراحی Custom Theme',
        'بهینه‌سازی SEO',
        'پنل مدیریت محتوا',
        'فرم‌های تماس و استعلام',
        'Performance Optimization',
      ],
    },
    {
      slug: 'amoozino',
      title: 'آموزینو',
      subtitle: 'پلتفرم آموزش آنلاین',
      description: 'بهبود عملکرد و UI/UX پلتفرم آنلاین آموزشی آموزینو',
      longDescription:
        'در پروژه آموزینو مسئول بهبود Performance و UI/UX بودم. زمان لود از ۱۲ ثانیه به ۳ ثانیه کاهش یافت و Lighthouse Score از ~۷۰% به ~۹۵% رسید. بهینه‌سازی تصاویر، Lazy Loading و Caching استراتژی‌های اصلی بودند.',
      stack: ['WordPress', 'UI/UX', 'Performance', 'SEO', 'Figma'],
      category: ['WordPress', 'UI/UX'],
      coverImage: '/projects/amoozino/cover.jpg',
      images: [
        { src: '/projects/amoozino/cover.jpg', alt: 'آموزینو' },
        { src: '/projects/amoozino/performance.jpg', alt: 'نتایج Performance' },
      ],
      liveUrl: normalizeUrl(''),
      githubUrl: normalizeUrl(''),
      features: [
        'بهبود Performance از 70% به 95%',
        'کاهش زمان لود از ۱۲s به ۳s',
        'بازطراحی UI دوره‌ها و پروفایل',
        'بهینه‌سازی SEO',
        'Lazy Loading و Image Optimization',
      ],
    },
  ],
};

export default portfolio;
