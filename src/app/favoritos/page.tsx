import { Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { HeartIcon, ImageIcon } from "@phosphor-icons/react/ssr";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonClasses } from "@/components/ui";
import { photoUrl } from "@/lib/listing-options";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Favoritos",
  robots: { index: false, follow: false },
};

export default function FavoritosPage() {
  return (
    <>
      <SiteHeader />
      <main className="container-page flex-1 pt-8 pb-24 sm:pt-12">
        <h1 className="text-h2 font-bold text-ink-900">Favoritos</h1>
        <Suspense fallback={<div className="mt-8 h-64 animate-pulse rounded-panel bg-ink-100" />}>
          <Lists />
        </Suspense>
      </main>
      <SiteFooter />
    </>
  );
}

async function Lists() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/entrar?next=/favoritos");

  const { data: lists } = await supabase
    .from("favorite_lists")
    .select("id, name, favorite_items(created_at, listings(photos))")
    .order("created_at", { ascending: false });

  if (!lists || lists.length === 0) {
    return (
      <div className="mt-10 max-w-md">
        <HeartIcon className="size-10 text-ink-400" aria-hidden />
        <h2 className="mt-4 text-h3 font-bold text-ink-900">Crie sua primeira lista</h2>
        <p className="mt-2 text-ink-600">Enquanto procura sala, toque em Salvar para guardar as que você gostou e comparar depois.</p>
        <Link href="/salas" className={`${buttonClasses("primary", "lg")} mt-6`}>
          Buscar salas
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {lists.map((list) => {
        // Capas das salas mais recentes da lista: até 3, em mosaico.
        const covers = [...list.favorite_items]
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((item) => item.listings?.photos[0])
          .filter((path): path is string => Boolean(path))
          .slice(0, 3);
        const count = list.favorite_items.length;
        return (
          <li key={list.id}>
            <Link href={`/favoritos/${list.id}`} className="group focus-ring block rounded-card">
              <Collage covers={covers} />
              <span className="mt-3 block truncate font-bold text-ink-900 group-hover:text-brand-700">{list.name}</span>
              <span className="mt-0.5 block text-sm text-ink-600">
                {count} {count === 1 ? "sala salva" : "salas salvas"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Mosaico da capa da lista: uma foto grande e, com 3 ou mais salas, duas menores ao lado. */
function Collage({ covers }: { covers: string[] }) {
  if (covers.length === 0) {
    return (
      <span className="grid aspect-square place-items-center rounded-panel bg-ink-100 shadow-card">
        <ImageIcon className="size-10 text-ink-400" aria-hidden />
      </span>
    );
  }
  if (covers.length < 3) {
    return (
      <span className="relative block aspect-square overflow-hidden rounded-panel bg-ink-100 shadow-card">
        <Image src={photoUrl(covers[0])} alt="" fill sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
      </span>
    );
  }
  return (
    <span className="grid aspect-square grid-cols-3 grid-rows-2 gap-1 overflow-hidden rounded-panel bg-white shadow-card">
      {covers.map((cover, index) => (
        <span key={cover} className={`relative bg-ink-100 ${index === 0 ? "col-span-2 row-span-2" : ""}`}>
          <Image src={photoUrl(cover)} alt="" fill sizes={index === 0 ? "(min-width: 640px) 33vw, 66vw" : "20vw"} className="object-cover" />
        </span>
      ))}
    </span>
  );
}
