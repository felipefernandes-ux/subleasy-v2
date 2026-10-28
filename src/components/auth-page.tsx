import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import type { AuthMode } from "@/app/actions/auth";
import { AuthForm, AuthFormFromUrl } from "./auth-form";
import { BackButton } from "./back-button";
import { Logo } from "./ui";

/**
 * Moldura das telas de conta: só o logo e o conteúdo, sem menu nem rodapé.
 * `back` põe a seta de voltar no topo, para quem não quer entrar ou criar conta.
 */
export function AuthShell({ children, back = false }: { children: ReactNode; back?: boolean }) {
  return (
    <main className="relative flex min-h-dvh flex-col items-center px-5 py-10 sm:justify-center sm:py-16">
      {back && <BackButton />}
      <div className="flex w-full max-w-sm flex-col items-center">
        <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring mb-10 rounded-control">
          <Logo className="h-8 w-auto" />
        </Link>
        {children}
      </div>
    </main>
  );
}

/** Tela de login e cadastro de conta. */
export function AuthPage({ mode }: { mode: AuthMode }) {
  return (
    <AuthShell back>
      {/* A URL (?next=, ?erro=) só existe na requisição; o formulário padrão segura o lugar. */}
      <Suspense fallback={<AuthForm mode={mode} />}>
        <AuthFormFromUrl mode={mode} />
      </Suspense>
    </AuthShell>
  );
}
