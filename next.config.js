/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Sans le paquet optionnel `sharp`, Next optimise les images avec un module
  // WebAssembly très gourmand en mémoire : sur Render gratuit (512 Mo), ça fait
  // dépasser la limite et redémarrer le service. Les seules images du site
  // sont le logo (petit), on les sert donc telles quelles.
  images: { unoptimized: true },
};

module.exports = nextConfig;
