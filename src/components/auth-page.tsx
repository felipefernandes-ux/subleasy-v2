import { Suspense } from "react";
import Link from "next/link";
import type { AuthMode } from "@/app/actions/auth";
import { AuthForm, AuthFormFromUrl } from "./auth-form";
import { Logo } from "./ui";

/** Tela de login e cadastro: só o logo e o formulário, sem menu nem rodapé. */
export function AuthPage({ mode }: { mode: AuthMode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center px-5 py-10 sm:justify-center sm:py-16">
      <div className="flex w-full max-w-sm flex-col items-center">
        <Link href="/" aria-label="Subleasy, página inicial" className="focus-ring mb-10 rounded-control">
          <Logo className="h-8 w-auto" />
        </Link>
        {/* A URL (?next=, ?erro=) só existe na requisição; o formulário padrão segura o lugar. */}
        <Suspense fallback={<AuthForm mode={mode} />}>
          <AuthFormFromUrl mode={mode} />
        </Suspense>
      </div>
    </main>
  );
}
