import { ALL_ITEMS } from "./nav";
import { PageHeader, SoonBadge, SoonNotice } from "./ui";

/** Tela de espera para funções da Fase 2 e "Depois". Recebe o href do item em nav.ts. */
export function SoonPage({ href }: { href: string }) {
  const item = ALL_ITEMS.find((entry) => entry.href === href);
  if (!item || item.phase === "mvp") throw new Error(`SoonPage: ${href} não é um item Soon`);
  return (
    <>
      <PageHeader
        eyebrow={<SoonBadge />}
        title={item.label}
        description="Esta área ainda não foi construída."
      />
      <SoonNotice summary={item.summary ?? ""} note={item.note} phase={item.phase} />
    </>
  );
}
