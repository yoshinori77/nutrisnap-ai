import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  images: {
    domains: [process.env.SUPABASE_DOMAIN!],
  },
};

module.exports = nextConfig;