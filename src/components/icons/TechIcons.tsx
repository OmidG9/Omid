import React from 'react';

interface IconProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ReactIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse
      cx="12"
      cy="12"
      rx="10"
      ry="4"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="10"
      ry="4"
      stroke="currentColor"
      strokeWidth="1.3"
      transform="rotate(60 12 12)"
    />
    <ellipse
      cx="12"
      cy="12"
      rx="10"
      ry="4"
      stroke="currentColor"
      strokeWidth="1.3"
      transform="rotate(-60 12 12)"
    />
    <circle cx="12" cy="12" r="1.8" fill="currentColor" />
  </svg>
);

export const NodejsIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polygon
      points="12,2 21.5,7.5 21.5,16.5 12,22 2.5,16.5 2.5,7.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M9 15.5V8.5l6 7V8.5"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const NextjsIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M8 17.5V7L19 17.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14.5 7v5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

export const TailwindIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 54 33"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M27 0C19.8 0 15.3 3.6 13.5 10.8c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C30.744 13.09 33.808 16.2 40.5 16.2c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C36.756 3.11 33.692 0 27 0zM13.5 16.2C6.3 16.2 1.8 19.8 0 27c2.7-3.6 5.85-4.95 9.45-4.05 2.054.514 3.522 2.004 5.147 3.653C17.244 29.29 20.308 32.4 27 32.4c7.2 0 11.7-3.6 13.5-10.8-2.7 3.6-5.85 4.95-9.45 4.05-2.054-.514-3.522-2.004-5.147-3.653C23.256 19.31 20.192 16.2 13.5 16.2z" />
  </svg>
);

export const MongodbIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C12 2 6.5 7.5 6.5 13.5a5.5 5.5 0 0 0 11 0C17.5 7.5 12 2 12 2z"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinejoin="round"
    />
    <path
      d="M12 22V15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 15c1.5-1 3-3 2.5-5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

export const PostgresqlIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <ellipse
      cx="12"
      cy="6"
      rx="8"
      ry="4"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M4 6v8c0 2.2 3.6 4 8 4s8-1.8 8-4V6"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M4 10c0 2.2 3.6 4 8 4s8-1.8 8-4"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <circle cx="10" cy="6" r="1" fill="currentColor" />
    <circle cx="14" cy="6" r="1" fill="currentColor" />
  </svg>
);

export const WebSocketIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 12h14"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M15 7l5 5-5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M9 7L4 12l5 5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const LeafletIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 2C8.7 2 6 4.9 6 8.5c0 5.2 6 13.5 6 13.5s6-8.3 6-13.5C18 4.9 15.3 2 12 2z"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <path
      d="M9 9c1-2 4-3 5.5-1.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
    <path
      d="M12 8v4"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
    />
  </svg>
);

export const NginxIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 19V5l14 14V5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const GitIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth="1.3" />
    <circle cx="18" cy="8" r="2" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M6 8v8"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M6 8c0 0 0-2 4-2h2a4 4 0 0 1 4 4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export const FigmaIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect
      x="4"
      y="2"
      width="7"
      height="7"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <rect
      x="13"
      y="2"
      width="7"
      height="7"
      rx="3.5"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <rect
      x="4"
      y="10.5"
      width="7"
      height="7"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.3"
    />
    <circle cx="16.5" cy="14" r="3.5" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M4 10.5v4a3.5 3.5 0 0 0 7 0v-4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export const PostmanIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M16.5 9a5.5 5.5 0 0 1-9 4.2"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M7.5 9a5.5 5.5 0 0 1 9 4.2"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <circle cx="12" cy="11.6" r="1.8" fill="currentColor" />
  </svg>
);

export const WordPressIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.3" />
    <path
      d="M3 12h18"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M12 2c0 0-5 5-5 10s5 10 5 10"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
    <path
      d="M12 2c0 0 5 5 5 10s-5 10-5 10"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
    />
  </svg>
);

export const ExpressIcon = ({ className, style }: IconProps) => (
  <svg
    className={className}
    style={style}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 8h8M3 12h11M3 16h8"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M17 10l4 2-4 2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// ─── Brand color registry ───────────────────────────────────────────────────

export interface TechInfo {
  name: string;
  Icon: React.FC<IconProps>;
  /** Hex brand color */
  color: string;
}

export const TECH_MAP: Record<string, TechInfo> = {
  'Node.js': { name: 'Node.js', Icon: NodejsIcon, color: '#339933' },
  Express: { name: 'Express', Icon: ExpressIcon, color: '#aaaaaa' },
  'Next.js': { name: 'Next.js', Icon: NextjsIcon, color: '#a8b4c8' },
  React: { name: 'React', Icon: ReactIcon, color: '#61DAFB' },
  TailwindCSS: { name: 'TailwindCSS', Icon: TailwindIcon, color: '#06B6D4' },
  MongoDB: { name: 'MongoDB', Icon: MongodbIcon, color: '#47A248' },
  PostgreSQL: { name: 'PostgreSQL', Icon: PostgresqlIcon, color: '#4169E1' },
  WebSocket: { name: 'WebSocket', Icon: WebSocketIcon, color: '#6366F1' },
  Leaflet: { name: 'Leaflet', Icon: LeafletIcon, color: '#199900' },
  Nginx: { name: 'Nginx', Icon: NginxIcon, color: '#009900' },
  Git: { name: 'Git', Icon: GitIcon, color: '#F05032' },
  Figma: { name: 'Figma', Icon: FigmaIcon, color: '#F24E1E' },
  Postman: { name: 'Postman', Icon: PostmanIcon, color: '#FF6C37' },
  WordPress: { name: 'WordPress', Icon: WordPressIcon, color: '#21759B' },
};
