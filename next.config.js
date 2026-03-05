const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
    serverComponentsExternalPackages: ["canvas", "pdfjs-dist"],
  },
};

module.exports = withSentryConfig(nextConfig, {
  silent: true,
  disableLogger: true,
});
