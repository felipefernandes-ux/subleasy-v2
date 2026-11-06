import type { NextConfig } from "next";

// Redirecionamentos permanentes (308, que o Google trata como 301). Mantenha por pelo menos 1 ano.
// Os do site antigo no WordPress valem só no domínio público: em admin.* o /anuncios é do Super Admin.
const publicHost = [{ type: "host" as const, value: "admin\\..*" }];
const legacy = (source: string, destination: string) => ({ source, destination, permanent: true, missing: publicHost });

// Blog do WordPress: roda em blog.subleasy.com.br e é servido em subleasy.com.br/blog por rewrite (proxy).
// No WordPress, "Endereço do site (URL)" deve ser https://subleasy.com.br/blog e "Endereço do WordPress" fica no subdomínio.
// Os posts abaixo são os do site antigo (post-sitemap.xml).
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
  // /blog/feed/ e as demais rotas do WordPress precisam da barra final; sem isto o Next a remove com um 308.
  skipTrailingSlashRedirect: true,
  cacheComponents: true,
  partialPrefetching: true,
  // As páginas do blog são geradas em src/app/blog (o Next busca o HTML no WordPress). Aqui ficam só os
  // endereços que não são página: API, feeds, sitemaps e arquivos do WordPress, direto do subdomínio.
  // O prefixo /blog vai junto no destino: o WordPress (home = .../blog) o remove ao rotear.
  async rewrites() {
    const wp = (source: string, destination = source) => ({ source, destination: `${BLOG}${destination}` });
    return {
      beforeFiles: [
        wp("/blog/wp-json/:path*"),
        // Metadados OAuth (RFC 9728 e 8414) que o Novamira CLI lê para autorizar o login em subleasy.com.br/blog.
        // O de servidor de autorização passa por src/app/blog-oauth, que troca o authorization_endpoint para a mesma origem.
        { source: "/blog/.well-known/oauth-authorization-server", destination: "/blog-oauth" },
        { source: "/blog/.well-known/oauth-authorization-server/", destination: "/blog-oauth" },
        wp("/blog/.well-known/:path*"),
        wp("/blog/feed"),
        wp("/blog/feed/"),
        wp("/blog/:path*/feed"),
        wp("/blog/:path*/feed/"),
        // Os sitemaps passam por src/app/blog-xml, que tira a folha XSLT do Rank Math.
        { source: "/blog/:file([\\w-]+\\.xml)", destination: "/blog-xml/:file" },
        wp("/blog/:file([\\w-]+\\.(?:xsl|txt))", "/blog/:file"),
        wp("/blog/wp-content/:path*"),
        wp("/blog/wp-includes/:path*"),
      ],
    };
  },
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
      // WordPress: o blog agora vive em /blog; os posts e categorias antigos (na raiz) apontam para lá.
      // A barra final evita um salto extra: o WordPress redireciona o endereço sem barra.
      legacy("/blog-2", "/blog/"),
      legacy("/category/:slug", "/blog/category/:slug/"),
      ...BLOG_POSTS.map((slug) => legacy(`/${slug}`, `/blog/${slug}/`)),
      // WordPress: páginas institucionais e da conta que têm equivalente no 2.0.
      // Tela de autorização do Novamira CLI: o endereço público existe só para ter a mesma origem do blog (ver src/app/blog-oauth).
      { source: "/blog/novamira-authorize", destination: `${BLOG}/wp-admin/admin.php?page=novamira-oauth-authorize`, permanent: false },
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
