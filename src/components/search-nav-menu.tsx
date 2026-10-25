"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretDownIcon } from "@phosphor-icons/react";
import { SPACE_TYPES, type SpaceType } from "@/lib/listing-options";
import { SPACE_ICONS } from "@/lib/space-type-icons";

/**
 * "Buscar salas" no cabeçalho, com os tipos de sala num menu suspenso: abre ao passar o
 * mouse ou ao clicar, e cada tipo leva à busca já filtrada.
 */
export function SearchNavMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    const onClick = (event: MouseEvent) => !rootRef.current?.contains(event.target as Node) && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Pequena folga ao sair com o mouse, para dar tempo de chegar ao menu.
  const show = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hide = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div ref={rootRef} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((current) => !current)}
        className="focus-ring inline-flex items-center gap-1 rounded-control px-3 py-2 text-sm text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900"
      >
        Buscar salas
        <CaretDownIcon className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} weight="bold" aria-hidden />
      </button>
      {open && (
        <div className="absolute top-full left-0 z-50 pt-2">
          <ul className="w-72 animate-fade-up rounded-card bg-white py-2 shadow-raised ring-1 ring-ink-900/8 [animation-duration:0.2s]">
            <li>
              <Link href="/salas" onClick={() => setOpen(false)} className="block px-4 py-2.5 text-sm font-bold text-ink-900 hover:bg-ink-100 hover:text-brand-700">
                Todas as salas
              </Link>
            </li>
            <li className="my-1 border-t border-ink-200" aria-hidden />
            {(Object.keys(SPACE_TYPES) as SpaceType[]).map((key) => {
              const TypeIcon = SPACE_ICONS[key];
              return (
                <li key={key}>
                  <Link
                    href={`/salas?tipo=${key}`}
                    onClick={() => setOpen(false)}
                    className="group flex items-center gap-3 px-4 py-2.5 text-sm text-ink-800 hover:bg-ink-100 hover:text-brand-700"
                  >
                    <TypeIcon className="size-5 shrink-0 text-ink-500 group-hover:text-brand-600" aria-hidden />
                    {SPACE_TYPES[key]}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
