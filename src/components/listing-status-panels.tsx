import Link from "next/link";
import { CheckIcon } from "@phosphor-icons/react/ssr";
import { REVIEW_TIME } from "@/lib/email";
import { buttonClasses } from "./ui";

const JOURNEY = ["Enviado", "Em revisão", "No ar"];

/** Depois do envio: o que acontece agora e quando. */
export function SubmittedPanel({ title, email }: { title: string; email: string }) {
  return (
    <div className="overflow-hidden rounded-panel bg-white shadow-raised ring-1 ring-ink-900/8">
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
          <Link href="/painel/anuncios" className={buttonClasses("secondary", "lg")}>
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
