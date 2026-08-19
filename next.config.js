/**
 * Next.js configuration.
 *
 * Security headers (CSP, HSTS, frame/embed protection, referrer policy) are
 * applied to every response. The CSP is intentionally pragmatic for this
 * site: Next.js inline scripts need 'unsafe-inline' (no nonce wiring in the
 * current app), and the embedded project demos require
 * frame-src https: http: — acceptable for a portfolio that embeds third-party
 * demos in sandboxed iframes.
 */

const SELF = "'self'";

/**
 * Allowed dev origins come from the single source of truth for the site
 * domain (SITE_URL env), matching src/lib/site.ts. Without SITE_URL the
 * project's official domain is used.
 */
function allowedDevOrigins() {
  const fromEnv = process.env.SITE_URL;
  if (fromEnv && fromEnv.trim()) {
    try {
      const host = new URL(fromEnv.trim()).host;
      return [host, `www.${host}`];
    } catch {
      // fall through to the default
    }
  }
  return ['ghanbariomid.ir', 'www.ghanbariomid.ir'];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],
  allowedDevOrigins: allowedDevOrigins(),
  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'mysql2'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src ${SELF} 'unsafe-inline' 'unsafe-eval'`,
              `style-src ${SELF} 'unsafe-inline'`,
              `img-src ${SELF} data: blob:`,
              `font-src ${SELF} data:`,
              `connect-src ${SELF}`,
              `frame-src ${SELF} https: http:`,
              `object-src 'none'`,
              `base-uri ${SELF}`,
              `form-action ${SELF}`,
              `frame-ancestors ${SELF}`,
            ].join('; '),
          },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;