/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],
  allowedDevOrigins: ['ghanbariomid.ir', 'www.ghanbariomid.ir'],
  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'mysql2'],
  },
};

module.exports = nextConfig;
