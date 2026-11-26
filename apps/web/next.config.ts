import type { NextConfig } from "next";

/**
 * Export statique : `next build` produit le dossier `out/` (HTML, CSS, JS), à envoyer tel quel
 * sur l'hébergement LWS (dossier public_html). Aucun serveur Node n'est nécessaire :
 * toutes les données sont chargées depuis l'API (NEXT_PUBLIC_API_URL) par le navigateur.
 * `next dev` fonctionne comme avant.
 */
const nextConfig: NextConfig = {
  output: "export",
  reactCompiler: true,
  // Chaque page devient un dossier avec un index.html (ex. /tournoi/index.html), servi directement par Apache
  trailingSlash: true,
  images: {
    // L'optimisation d'images de Next demande un serveur : les images sont déjà compressées par l'API
    unoptimized: true,
  },
};

export default nextConfig;
