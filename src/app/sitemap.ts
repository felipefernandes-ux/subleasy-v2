import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Cresce com as páginas por cidade e tipo de sala (fase 2) e com os anúncios
// migrados do WordPress, que precisam manter as URLs ou ter 301.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      lastModified: new Date("2026-10-21"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
