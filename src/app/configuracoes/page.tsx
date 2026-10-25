import { redirect } from "next/navigation";

/** A primeira aba abre por padrão. */
export default function SettingsPage() {
  redirect("/configuracoes/informacoes-pessoais");
}
