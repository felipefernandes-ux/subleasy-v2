import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { acceptTerms } from "@/app/actions/terms";
import { signOut } from "@/app/actions/auth";
import { safeNextPath } from "@/lib/auth-redirect";
import { LEGAL, TERMS_UPDATED_LABEL } from "@/lib/legal";
import { Logo, buttonClasses } from "@/components/ui";

export const metadata: Metadata = {
  title: "Atualizamos os Termos",
  robots: { index: false, follow: false },
};

export default function AceitarTermosPage({ searchParams }: PageProps<"/aceitar-termos">) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center px-5 py-10 sm:justify-center sm:py-16">
      <div className="flex w-full max-w-lg flex-col items-center">
        <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring mb-10 rounded-control">
          <Logo className="h-8 w-auto" />
        </Link>
        {/* A URL (?next=, ?erro=) só existe na requisição. */}
        <Suspense fallback={null}>
          <Notice searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}

async function Notice({ searchParams }: { searchParams: PageProps<"/aceitar-termos">["searchParams"] }) {
  await connection();
  const params = await searchParams;
  const pick = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
  const next = safeNextPath(pick(params.next));
  const failed = pick(params.erro) === "1";

  return (
    <section aria-labelledby="termos-titulo" className="w-full rounded-panel bg-white p-6 shadow-raised ring-1 ring-ink-900/8 sm:p-8">
      <h1 id="termos-titulo" className="text-h3 font-bold text-ink-900">
        Atualizamos os Termos e a Política de privacidade
      </h1>
      <p className="mt-2 text-ink-600">Para continuar usando sua conta, leia o que mudou e aceite.</p>

      <h2 className="mt-6 text-sm font-bold tracking-wide text-ink-500 uppercase">O que mudou</h2>
      <ul className="mt-3 space-y-3 text-ink-700">
        <li>
          <strong className="text-ink-900">Divulgação paga dos anúncios.</strong> Passamos a usar as fotos e os textos públicos dos seus
          anúncios em publicidade online que nós pagamos, no Google e na Meta (Facebook e Instagram). Você não paga nem recebe nada por
          isso e pode retirar a autorização quando quiser.
        </li>
        <li>
          <strong className="text-ink-900">O que não entra.</strong> Seu WhatsApp, seu e-mail e o endereço completo da sala nunca são
          usados na divulgação.
        </li>
        <li>
          <strong className="text-ink-900">Política de privacidade.</strong> Agora ela lista o Google e a Meta como fornecedores de
          publicidade.
        </li>
      </ul>

      <p className="mt-5 text-sm text-ink-600">
        Leia os textos completos:{" "}
        <Link href="/termos" target="_blank" className="focus-ring rounded-sm font-bold text-brand-600 hover:text-brand-700">
          Termos de uso
        </Link>{" "}
        e{" "}
        <Link href="/privacidade" target="_blank" className="focus-ring rounded-sm font-bold text-brand-600 hover:text-brand-700">
          Política de privacidade
        </Link>
        , versão de {TERMS_UPDATED_LABEL}.
      </p>

      {failed && (
        <p role="alert" className="mt-4 text-sm font-semibold text-danger-600">
          Não foi possível registrar o aceite. Tente de novo.
        </p>
      )}

      <form action={acceptTerms} className="mt-6">
        <input type="hidden" name="next" value={next} />
        <button type="submit" className={`${buttonClasses("primary", "lg")} w-full`}>
          Aceitar e continuar
        </button>
      </form>
      <p className="mt-3 text-center text-xs text-ink-500">Ao aceitar, guardamos a versão e a data do seu aceite.</p>

      <div className="mt-6 border-t border-ink-200 pt-5 text-center">
        <p className="text-sm text-ink-600">
          Não concorda? Você pode sair agora. Para retirar seus anúncios ou apagar a conta, escreva para {LEGAL.contactEmail}.
        </p>
        <form action={signOut} className="mt-3">
          <button type="submit" className={buttonClasses("ghost")}>
            Sair da conta
          </button>
        </form>
      </div>
    </section>
  );
}
