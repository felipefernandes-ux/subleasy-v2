import Link from "next/link";
import { CheckIcon, PauseCircleIcon } from "@phosphor-icons/react/ssr";
import { REVIEW_TIME } from "@/lib/email";
import { ShareLink } from "./share-link";
import { buttonClasses } from "./ui";

const JOURNEY = ["Enviado", "Em revisão", "No ar"];

/** Depois do envio: o que acontece agora e quando. */
export function SubmittedPanel({ title, email }: { title: string; email: string }) {
  return (
    <div className="overflow-hidden rounded-panel bg-white shadow-raised ring-1 ring-ink-900/8">
      <div aria-hidden="true" className="ai-glow h-1" />
      <div className="p-6 sm:p-10">
        <span className="grid size-12 place-items-center rounded-full bg-mint-400 text-brand-900">
          <CheckIcon className="size-6 animate-pop" weight="bold" aria-hidden />
        </span>
        <h1 className="mt-5 text-h2 font-bold text-ink-900">Anúncio enviado para revisão</h1>
        <p className="mt-3 text-lg leading-snug font-bold text-brand-700">“{title}”</p>
        <p className="mt-4 text-ink-600">
          A equipe do Subleasy confere as fotos e as informações em até {REVIEW_TIME}. Mandamos a
          confirmação para <strong className="font-bold [overflow-wrap:anywhere] text-ink-900">{email}</strong>.
          Quando o anúncio for aprovado, você recebe o link da sala para compartilhar.
        </p>

        <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Etapas do anúncio">
          {JOURNEY.map((step, index) => {
            const done = index === 0;
            const current = index === 1;
            return (
              <li key={step} aria-current={current ? "step" : undefined}>
                <span className={`block h-1.5 rounded-full ${done ? "bg-brand-600" : current ? "animate-pulse bg-brand-300" : "bg-ink-200"}`} />
                <span className={`mt-2 block text-sm ${done || current ? "font-bold text-ink-900" : "text-ink-500"}`}>{step}</span>
              </li>
            );
          })}
        </ol>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Link href="/painel" className={buttonClasses("secondary", "lg")}>
            Ver meus anúncios
          </Link>
          <Link href="/anunciar" className={buttonClasses("ghost", "lg")}>
            Anunciar outra sala
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Anúncio aprovado: o link para compartilhar é a ação principal. */
export function PublishedPanel({ title, url }: { title: string; url: string }) {
  return (
    <div className="overflow-hidden rounded-panel bg-white shadow-raised ring-1 ring-ink-900/8">
      <div className="p-6 sm:p-10">
        <span className="inline-flex items-center gap-2 rounded-full bg-mint-100 px-3 py-1 text-sm font-bold text-mint-700">
          <span className="size-2 rounded-full bg-mint-500" aria-hidden />
          No ar
        </span>
        <h1 className="mt-5 text-h2 font-bold text-ink-900">Sua sala está no ar</h1>
        <p className="mt-3 text-lg leading-snug font-bold text-brand-700">“{title}”</p>
        <p className="mt-4 text-ink-600">
          Compartilhe o link no Instagram, nos grupos de WhatsApp e com colegas. Quem se interessar
          fala com você direto pelo WhatsApp.
        </p>
        <ShareLink url={url} title={title} />
      </div>
    </div>
  );
}

export function PausedPanel({ title, url }: { title: string; url: string }) {
  return (
    <div className="rounded-panel bg-white p-6 shadow-card ring-1 ring-ink-900/8 sm:p-10">
      <PauseCircleIcon className="size-10 text-ink-500" weight="fill" aria-hidden />
      <h1 className="mt-4 text-h2 font-bold text-ink-900">Anúncio pausado</h1>
      <p className="mt-3 text-ink-600">
        “{title}” não recebe contatos agora. A página continua no ar com o aviso de que a sala não
        está disponível.
      </p>
      <Link href={url} className={`${buttonClasses("secondary", "lg")} mt-6`}>
        Ver página da sala
      </Link>
    </div>
  );
}
