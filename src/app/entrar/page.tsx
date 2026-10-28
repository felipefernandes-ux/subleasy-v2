import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre no Subleasy com sua conta Google ou com um código de 6 dígitos enviado por e-mail.",
  alternates: { canonical: "/entrar" },
  robots: { index: false, follow: true },
};

export default function EntrarPage() {
  return <AuthPage mode="signin" />;
}
