import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Large managed-content saves / base64 file uploads (App Router).
  experimental: {
    serverActions: {
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
