import type { NextConfig } from "next";

// Redirecionamentos permanentes (308, que o Google trata como 301). Mantenha por pelo menos 1 ano.
// Os do site antigo no WordPress valem só no domínio público: em admin.* o /anuncios é do Super Admin.
const publicHost = [{ type: "host" as const, value: "admin\\..*" }];
const legacy = (source: string, destination: string) => ({ source, destination, permanent: true, missing: publicHost });

// Blog do WordPress, hoje em blog.subleasy.com.br. São os posts do site antigo (post-sitemap.xml).
const BLOG = "https://blog.subleasy.com.br";
const BLOG_POSTS = [
  "aluguel-tradicional-vs-sublocacao-flexivel-qual-a-melhor-para-voce",
  "como-a-subleasy-pode-ajudar-coworkings-a-atrair-profissionais-do-trabalho-remoto",
  "direitos-e-deveres-de-quem-subloca-uma-sala",
  "gestao-de-clinicas-de-psicologia",
  "sua-sala-comercial-esta-vaga-descubra-como-rentabilizar-com-sublocacao",
  "sublocacao-de-consultorio-medico",
  "sublocacao-de-consultorio-odontologico",
  "sublocacao-de-consultorios-por-hora",
  "sublocacao-de-sala-de-estetica-e-bem-estar",
  "sublocacao-de-salas-a-solucao-flexivel-para-psicologos-e-terapeutas",
  "sublocacao-de-salas-para-psicologos",
  "sublocacao-de-salas-para-psicologos-iniciantes",
];

// Comodidades do WordPress (/comodidades/salas-para-sublocacao-com-<slug>) que viraram filtro da busca.
const AMENITY_SLUGS: Record<string, string> = {
  "wi-fi": "wifi",
  "ar-condicionado": "ar_condicionado",
  limpeza: "limpeza_inclusa",
  estacionamento: "estacionamento",
  acessibilidade: "acessibilidade",
};

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
      legacy("/publico/medicos", "/espacos?tipo=consultorio_medico"),
      // WordPress: comodidades que existem como filtro; as outras caem na busca.
      ...Object.entries(AMENITY_SLUGS).map(([slug, key]) => legacy(`/comodidades/salas-para-sublocacao-com-${slug}`, `/espacos?comodidades=${key}`)),
      legacy("/comodidades/:slug", "/espacos"),
      // WordPress: o blog passou para blog.subleasy.com.br, com os mesmos endereços dos posts.
      // A barra final evita um salto extra: o WordPress redireciona o endereço sem barra.
      legacy("/blog", `${BLOG}/`),
      legacy("/blog-2", `${BLOG}/`),
      legacy("/category/:slug", `${BLOG}/category/:slug/`),
      ...BLOG_POSTS.map((slug) => legacy(`/${slug}`, `${BLOG}/${slug}/`)),
      // WordPress: páginas institucionais e da conta que têm equivalente no 2.0.
      legacy("/perguntas-frequentes", "/como-funciona"),
      legacy("/termos-de-uso", "/termos"),
      legacy("/politica-de-privacidade", "/privacidade"),
      legacy("/anuncie-seu-espaco-na-subleasy", "/anunciar"),
      legacy("/login", "/entrar"),
      legacy("/meus-anuncios", "/painel/anuncios"),
      legacy("/minha-conta", "/configuracoes"),
    ];
  },
  images: {
    // Fotos das salas no Supabase Storage (bucket público listing-photos).
    remotePatterns: [new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/**`)],
  },
};

export default nextConfig;
