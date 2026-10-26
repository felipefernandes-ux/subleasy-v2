"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CaretDownIcon, MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";
import { AMENITIES, BILLING_TYPES, SPACE_TYPES, amenityLabel } from "@/lib/listing-options";
import { formatMoneyInput } from "../listing-fields";
import { buttonClasses } from "../ui";

/** Valores dos filtros, lidos da URL: a busca pode ser compartilhada e volta igual. */
export type Filters = { local: string; tipos: string[]; cobranca: string; min: string; max: string; comodidades: string[] };

const list = (value: string | null) => (value ? value.split(",").filter(Boolean) : []);
export function filtersFrom(params: URLSearchParams): Filters {
  return {
    local: params.get("local") ?? "",
    tipos: list(params.get("tipo")),
    cobranca: params.get("cobranca") ?? "",
    min: params.get("min") ?? "",
    max: params.get("max") ?? "",
    comodidades: list(params.get("comodidades")),
  };
}

/**
 * Linha de filtros rápidos, cada um num dropdown (como no QuintoAndar).
 * Aplicar troca a URL; a página busca de novo no servidor.
 */
export function FilterBar({ aside }: { aside?: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const filters = filtersFrom(new URLSearchParams(params.toString()));

  function apply(changes: Record<string, string | string[]>) {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      const text = Array.isArray(value) ? value.join(",") : value;
      if (text) next.set(key, text);
      else next.delete(key);
    }
    router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false });
  }

  const active = Boolean(filters.local || filters.tipos.length || filters.cobranca || filters.min || filters.max || filters.comodidades.length);
  const reais = (value: string) => `R$ ${Number(value).toLocaleString("pt-BR")}`;
  const priceLabel =
    filters.min && filters.max ? `${reais(filters.min)} a ${reais(filters.max)}` : filters.min ? `A partir de ${reais(filters.min)}` : filters.max ? `Até ${reais(filters.max)}` : "Preço";

  return (
    <div className="flex items-center gap-2">
      <div
        onScroll={() => document.dispatchEvent(new MouseEvent("mousedown"))}
        className="-mx-1 flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:none]"
      >
        <LocalSearch value={filters.local} onSubmit={(local) => apply({ local })} />

        <Dropdown label={filters.tipos.length ? countLabel("Tipo de sala", filters.tipos.length) : "Tipo de sala"} active={filters.tipos.length > 0}>
          {(close) => (
            <ChecklistPanel
              options={Object.entries(SPACE_TYPES).map(([value, label]) => ({ value, label }))}
              selected={filters.tipos}
              onApply={(tipos) => {
                apply({ tipo: tipos });
                close();
              }}
            />
          )}
        </Dropdown>

        <Dropdown label={filters.cobranca ? BILLING_TYPES[filters.cobranca as keyof typeof BILLING_TYPES] ?? "Cobrança" : "Cobrança"} active={Boolean(filters.cobranca)}>
          {(close) => (
            <div className="w-64 p-2">
              {[{ value: "", label: "Qualquer cobrança" }, ...Object.entries(BILLING_TYPES).map(([value, label]) => ({ value, label }))].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    apply({ cobranca: option.value });
                    close();
                  }}
                  className={`flex w-full items-center rounded-control px-3 py-2.5 text-left text-sm transition-colors hover:bg-ink-100 ${
                    filters.cobranca === option.value ? "font-bold text-brand-700" : "text-ink-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </Dropdown>

        <Dropdown label={priceLabel} active={Boolean(filters.min || filters.max)}>
          {(close) => (
            <PricePanel
              min={filters.min}
              max={filters.max}
              onApply={(min, max) => {
                apply({ min, max });
                close();
              }}
            />
          )}
        </Dropdown>

        <Dropdown label={filters.comodidades.length ? countLabel("Comodidades", filters.comodidades.length) : "Comodidades"} active={filters.comodidades.length > 0}>
          {(close) => (
            <ChecklistPanel
              options={Object.keys(AMENITIES).map((value) => ({ value, label: amenityLabel(value) }))}
              selected={filters.comodidades}
              onApply={(comodidades) => {
                apply({ comodidades });
                close();
              }}
            />
          )}
        </Dropdown>

        {active && (
          <button
            type="button"
            onClick={() => router.replace(pathname, { scroll: false })}
            className="focus-ring shrink-0 rounded-full px-3 py-2 text-sm font-bold text-ink-700 hover:bg-ink-100"
          >
            Limpar filtros
          </button>
        )}
      </div>
      {aside}
    </div>
  );
}

function countLabel(label: string, count: number) {
  return `${label} (${count})`;
}

/** Busca por cidade ou bairro: o primeiro campo da linha. */
function LocalSearch({ value, onSubmit }: { value: string; onSubmit: (value: string) => void }) {
  const [text, setText] = useState(value);
  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(text.trim());
      }}
      className="flex h-10 w-56 shrink-0 items-center gap-2 rounded-full bg-white pr-1 pl-3.5 ring-1 ring-ink-300 focus-within:ring-2 focus-within:ring-brand-600"
    >
      <MagnifyingGlassIcon className="size-4.5 shrink-0 text-ink-500" aria-hidden />
      <input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Cidade ou bairro"
        aria-label="Cidade ou bairro"
        className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500"
      />
      {text && (
        <button
          type="button"
          onClick={() => {
            setText("");
            onSubmit("");
          }}
          aria-label="Limpar local"
          className="grid size-7 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
        >
          <XIcon className="size-3.5" weight="bold" aria-hidden />
        </button>
      )}
    </form>
  );
}

/**
 * Pílula com painel suspenso, 8 px abaixo do botão. O painel fica fora da faixa rolável
 * (position fixed, no body), para não ser cortado; fecha com Esc, clique fora ou ao aplicar.
 * A faixa de pílulas rola na horizontal no celular: rolar ela fecha o painel.
 */
function Dropdown({ label, active, children }: { label: string; active: boolean; children: (close: () => void) => ReactNode }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && (setOpen(false), buttonRef.current?.focus());
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !buttonRef.current?.contains(target)) setOpen(false);
    };
    // A barra de filtros fica presa no topo: rolar a página não desalinha o painel.
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          const rect = buttonRef.current?.getBoundingClientRect();
          if (rect) setPosition({ top: rect.bottom + 8, left: Math.min(rect.left, window.innerWidth - 16 - 288) });
          setOpen((current) => !current);
        }}
        className={`focus-ring inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-sm whitespace-nowrap transition-colors ${
          active ? "bg-brand-50 font-bold text-brand-800 ring-2 ring-brand-600" : open ? "bg-ink-100 text-ink-900 ring-1 ring-ink-400" : "bg-white text-ink-800 ring-1 ring-ink-300 hover:ring-ink-500"
        }`}
      >
        {label}
        <CaretDownIcon className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} weight="bold" aria-hidden />
      </button>
      {/* No body (portal): a barra tem backdrop-blur, que prenderia o painel fixo dentro dela. */}
      {open &&
        position &&
        createPortal(
        <div
          ref={panelRef}
          role="dialog"
          aria-label={label}
          style={{ top: position.top, left: Math.max(16, position.left) }}
          className="fixed z-50 animate-fade-up rounded-card bg-white shadow-raised ring-1 ring-ink-900/8 [animation-duration:0.2s]"
        >
          {children(close)}
        </div>,
          document.body,
        )}
    </>
  );
}

function ChecklistPanel({ options, selected, onApply }: { options: { value: string; label: string }[]; selected: string[]; onApply: (values: string[]) => void }) {
  const [picked, setPicked] = useState(selected);
  return (
    <div className="w-72">
      <div className="max-h-80 overflow-y-auto p-2">
        {options.map((option) => {
          const checked = picked.includes(option.value);
          return (
            <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-control px-3 py-2.5 text-sm text-ink-800 hover:bg-ink-100">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => setPicked((current) => (checked ? current.filter((value) => value !== option.value) : [...current, option.value]))}
                className="size-4.5 accent-brand-600"
              />
              {option.label}
            </label>
          );
        })}
      </div>
      <PanelFooter onClear={() => setPicked([])} onApply={() => onApply(picked)} />
    </div>
  );
}

// Faixas prontas para um clique; o valor exato fica nos campos.
const PRICE_PRESETS: { label: string; min: string; max: string }[] = [
  { label: "Até R$ 50", min: "", max: "50" },
  { label: "R$ 50 a 100", min: "50", max: "100" },
  { label: "R$ 100 a 300", min: "100", max: "300" },
  { label: "Acima de R$ 300", min: "300", max: "" },
];

function PricePanel({ min, max, onApply }: { min: string; max: string; onApply: (min: string, max: string) => void }) {
  const toField = (value: string) => (value ? formatMoneyInput(String(Math.round(Number(value) * 100))) : "");
  const toValue = (field: string) => {
    const digits = field.replace(/\D/g, "");
    return digits ? String(Number(digits) / 100) : "";
  };
  const [low, setLow] = useState(toField(min));
  const [high, setHigh] = useState(toField(max));

  return (
    <div className="w-80">
      <div className="p-4">
        <p className="text-sm font-bold text-ink-900">Preço por hora, turno, dia ou mês</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => onApply(preset.min, preset.max)}
              className="rounded-full bg-ink-100 px-3 py-1.5 text-xs font-bold text-ink-800 transition-colors hover:bg-ink-200"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[
            { label: "Mínimo", value: low, set: setLow },
            { label: "Máximo", value: high, set: setHigh },
          ].map((field) => (
            <label key={field.label} className="text-xs font-bold text-ink-600">
              {field.label}
              <span className="mt-1 flex h-11 items-center gap-1.5 rounded-control px-3 ring-1 ring-ink-300 focus-within:ring-2 focus-within:ring-brand-600">
                <span className="text-sm font-normal text-ink-500">R$</span>
                <input
                  inputMode="numeric"
                  value={field.value}
                  placeholder="0,00"
                  onChange={(event) => field.set(formatMoneyInput(event.target.value))}
                  className="min-w-0 flex-1 bg-transparent text-sm font-normal text-ink-900 tabular-nums outline-none"
                />
              </span>
            </label>
          ))}
        </div>
      </div>
      <PanelFooter
        onClear={() => {
          setLow("");
          setHigh("");
        }}
        onApply={() => onApply(toValue(low), toValue(high))}
      />
    </div>
  );
}

function PanelFooter({ onClear, onApply }: { onClear: () => void; onApply: () => void }) {
  return (
    <div className="flex items-center justify-between border-t border-ink-200 px-4 py-3">
      <button type="button" onClick={onClear} className="focus-ring rounded-sm text-sm font-bold text-ink-700 hover:text-ink-900">
        Limpar
      </button>
      <button type="button" onClick={onApply} className={buttonClasses("primary", "sm")}>
        Aplicar
      </button>
    </div>
  );
}
