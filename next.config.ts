import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // Limit CPU usage during build to avoid memory issues (OOM) in docker/CI/QEMU environments
    cpus: 1,
    workerThreads: false,
  },
};

export default nextConfig;
