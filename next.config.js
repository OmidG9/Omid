/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['framer-motion'],
  allowedDevOrigins: ['ghanbariomid.ir', 'www.ghanbariomid.ir'],
  experimental: {
    serverComponentsExternalPackages: ['nodemailer'],
  },
};

module.exports = nextConfig;
