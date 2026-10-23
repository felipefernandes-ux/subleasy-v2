import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Criar conta",
  description: "Crie sua conta grátis no Subleasy e anuncie sua sala por turno em minutos.",
  alternates: { canonical: "/criar-conta" },
  robots: { index: false, follow: true },
};

export default function CriarContaPage() {
  return <AuthPage mode="signup" />;
}
