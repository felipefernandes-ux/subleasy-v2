import type { NextConfig } from "next";

// Redirecionamentos permanentes (308, que o Google trata como 301). Mantenha por pelo menos 1 ano.
// Os do site antigo no WordPress valem só no domínio público: em admin.* o /anuncios é do Super Admin.
const publicHost = [{ type: "host" as const, value: "admin\\..*" }];
const legacy = (source: string, destination: string) => ({ source, destination, permanent: true, missing: publicHost });

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  async redirects() {
    return [
      // 2.0: o anúncio passou de /sala/ para /espaco/ e a busca de /salas para /espacos.
      // Só o caminho exato: /salas/*.webp são imagens da pasta public.
      { source: "/sala/:slug", destination: "/espaco/:slug", permanent: true },
      { source: "/salas", destination: "/espacos", permanent: true },
      // WordPress: índice e busca antigos. Os anúncios, cidades e tipos são resolvidos em route.ts (precisam do banco).
      legacy("/anuncios", "/espacos"),
      legacy("/buscar", "/espacos"),
      legacy("/comodidades/:slug", "/espacos"),
      // WordPress: páginas de tipo de sala, com o filtro equivalente da busca.
      legacy("/sublocacao-de-consultorio-odontologico", "/espacos?tipo=odontologia"),
      legacy("/sublocacao-de-consultorio-medico", "/espacos?tipo=consultorio_medico"),
      legacy("/sublocacao-de-salas-para-psicologos", "/espacos?tipo=psicologia"),
      legacy("/perguntas-frequentes", "/como-funciona"),
    ];
  },
  images: {
    // Fotos das salas no Supabase Storage (bucket público listing-photos).
    remotePatterns: [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`)],
  },
};

export default nextConfig;
