/** @type {import('next').NextConfig} */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,    // ta config actuelle
  output: "export",       // ✅ active l’export statique
  trailingSlash: true,   // optionnel, pour URLs sans slash
  images: {
    unoptimized: true,    // ✅ permet d’exporter les images statiques
  },
  // Si le site est déployé dans un sous-dossier (ex: https://example.com/prtt/), ajoutez :
  // basePath: '/prtt',
};

export default nextConfig;