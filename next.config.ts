import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Pin the workspace root: a stray lockfile in a parent folder once made
  // Turbopack pick C:\Users\chamo\Desktop\QR as the root, which broke HMR
  // ("Resource path ... needs to be on project filesystem" panics).
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
