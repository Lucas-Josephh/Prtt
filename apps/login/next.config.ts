import type { NextConfig } from "next";

/** Application de connexion à l'espace administration, déployée sur son propre domaine. */
const nextConfig: NextConfig = {
  reactCompiler: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
