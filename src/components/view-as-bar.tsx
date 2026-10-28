import Link from "next/link";
import { ArrowLeftIcon, EyeIcon } from "@phosphor-icons/react/ssr";

/**
 * Barra do Super Admin vendo a conta de outra pessoa. Fica no topo, acima de tudo, e leva de volta
 * ao Super Admin. A tela abaixo é só leitura (o conteúdo fica inerte), por isso o aviso.
 */
export function ViewAsBar({ email, userId, current }: { email: string; userId: string; current: "painel" | "anuncios" }) {
  const base = `/admin/ver-como/${userId}`;
  const tab = (active: boolean) =>
    `focus-ring rounded-control px-3 py-1.5 text-sm font-bold transition-colors ${active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`;
  return (
    <div role="region" aria-label="Acessando como outro usuário" className="sticky top-0 z-50 bg-ink-900 text-white">
      <div className="container-page flex flex-wrap items-center gap-x-4 gap-y-2 py-2.5">
        <p className="flex min-w-0 flex-1 items-center gap-2 text-sm">
          <EyeIcon className="size-5 shrink-0 text-mint-400" weight="bold" aria-hidden />
          <span className="min-w-0 truncate">
            Acessando como <strong className="font-bold">{email}</strong>
            <span className="ml-2 text-white/60 max-sm:hidden">Somente leitura</span>
          </span>
        </p>
        <nav aria-label="Telas do usuário" className="flex items-center gap-1">
          <Link href={base} aria-current={current === "painel" ? "page" : undefined} className={tab(current === "painel")}>
            Painel
          </Link>
          <Link href={`${base}/anuncios`} aria-current={current === "anuncios" ? "page" : undefined} className={tab(current === "anuncios")}>
            Meus anúncios
          </Link>
        </nav>
        <Link href="/" className="focus-ring inline-flex h-9 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-ink-900 transition-colors hover:bg-ink-100">
          <ArrowLeftIcon className="size-4" weight="bold" aria-hidden />
          Voltar ao painel
        </Link>
      </div>
    </div>
  );
}
