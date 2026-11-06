"use client";

import { useActionState, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftIcon, CaretDownIcon, CheckCircleIcon, CircleNotchIcon, MapPinIcon, MagnifyingGlassIcon, TrendUpIcon, XIcon } from "@phosphor-icons/react";
import posthog from "posthog-js";
import { requestCity, suggestCities, type CityRequestState } from "@/app/actions/city-demand";
import { normalizeCity, type CityOption } from "@/lib/city-text";
import { UFS } from "@/lib/listing-options";
import { buttonClasses } from "../ui";

const FIELD =
  "mt-1.5 h-11 w-full rounded-control border border-ink-300 bg-white px-3.5 text-base font-normal text-ink-900 shadow-xs outline-none transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15";

const salas = (count: number) => (count === 1 ? "1 sala" : `${count} salas`);

/**
 * Pedido de uma cidade sem sala no ar. Aparece no filtro de cidade e na página sem resultado.
 * O e-mail é opcional e só serve para avisar uma vez, quando a primeira sala da cidade entrar.
 */
export function CityRequestForm({
  initialCity = "",
  tipo = "",
  source,
  onBack,
}: {
  initialCity?: string;
  tipo?: string;
  source: "filtro" | "sem_resultado";
  onBack?: () => void;
}) {
  const [state, formAction, isPending] = useActionState<CityRequestState, FormData>(requestCity, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="py-2 text-center">
        <CheckCircleIcon className="mx-auto size-10 text-mint-700" weight="fill" aria-hidden />
        <p className="mt-3 font-bold text-ink-900">Pedido enviado</p>
        <p className="mt-1 text-sm text-ink-600">
          {state.withEmail ? `Avisamos você por e-mail quando entrar a primeira sala em ${state.city}.` : `Anotamos o seu pedido para ${state.city}.`}
        </p>
        {onBack && (
          <button type="button" onClick={onBack} className={`${buttonClasses("ghost")} mt-3`}>
            Voltar às cidades
          </button>
        )}
      </div>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={() => posthog.capture("city_request_submitted", { source })}
      className="space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-ink-900">Peça salas na sua cidade</p>
        {onBack && (
          <button type="button" onClick={onBack} className={`${buttonClasses("ghost", "sm")} -mr-2`}>
            <ArrowLeftIcon className="size-4" aria-hidden />
            Voltar
          </button>
        )}
      </div>
      <CityNameField initialCity={initialCity} />
      <label className="block text-sm font-bold text-ink-800">
        E-mail <span className="font-normal text-ink-500">(opcional)</span>
        <input name="email" type="email" inputMode="email" autoComplete="email" placeholder="nome@exemplo.com" className={FIELD} />
        <span className="mt-1.5 block text-xs font-normal text-ink-600">
          Se informar, avisamos uma vez, quando a primeira sala da cidade entrar no ar. Só usamos o e-mail para isso.
        </span>
      </label>
      <input type="hidden" name="source" value={source} />
      <input type="hidden" name="tipo" value={tipo} />
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Não preencha
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-sm font-semibold text-danger-600">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={isPending} className={`${buttonClasses("primary")} w-full`}>
        {isPending && <CircleNotchIcon className="size-4 animate-spin" weight="bold" aria-hidden />}
        Enviar pedido
      </button>
    </form>
  );
}

/**
 * Cidade e UF lado a lado. O UF já vem selecionado: ao escolher uma sugestão, ou quando o nome digitado
 * existe em um estado só ("Campinas" vira SP). Se o nome existe em mais de um estado, o campo fica vazio
 * para a pessoa escolher. Mexer no UF à mão vale até a próxima mudança no nome da cidade.
 */
function CityNameField({ initialCity }: { initialCity: string }) {
  const [text, setText] = useState(initialCity);
  const [uf, setUf] = useState("");
  const [options, setOptions] = useState<{ name: string; uf: string }[]>([]);
  const latest = useRef(0);
  const manual = useRef(false);

  async function lookup(value: string, id: number) {
    const found = await suggestCities(value);
    // Só a resposta da última digitação vale; as antigas chegam fora de ordem.
    if (id !== latest.current) return;
    const exact = found.filter((option) => normalizeCity(option.name) === normalizeCity(value));
    if (exact.length === 1 && !manual.current) {
      setUf(exact[0].uf);
      setText(exact[0].name);
      setOptions([]);
    } else {
      setOptions(found);
    }
  }

  function change(value: string) {
    setText(value);
    setUf("");
    manual.current = false;
    const id = ++latest.current;
    if (value.trim().length < 2) {
      setOptions([]);
      return;
    }
    window.setTimeout(() => void lookup(value, id), 200);
  }

  // Cidade já preenchida pela busca (o que a pessoa digitou no filtro): completa o UF na abertura.
  useEffect(() => {
    if (initialCity.trim().length >= 2) void lookup(initialCity, ++latest.current);
    // Só na abertura do formulário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="grid grid-cols-[1fr_5.5rem] gap-2">
        <label className="block text-sm font-bold text-ink-800">
          Cidade
          <input
            name="city"
            required
            value={text}
            onChange={(event) => change(event.target.value)}
            autoComplete="off"
            placeholder="Digite o nome da cidade"
            className={FIELD}
          />
        </label>
        <label className="block text-sm font-bold text-ink-800">
          UF
          {/* Seta própria: a do navegador cola na borda direita e não aceita espaçamento. */}
          <span className="relative mt-1.5 block">
            <select
              name="state"
              required
              value={uf}
              onChange={(event) => {
                manual.current = true;
                setUf(event.target.value);
              }}
              className={`${FIELD} mt-0! appearance-none pr-9`}
            >
              <option value="" disabled />
              {UFS.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
            <CaretDownIcon className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-ink-500" weight="bold" aria-hidden />
          </span>
        </label>
      </div>
      {options.length > 0 && (
        <ul className="mt-1.5 overflow-hidden rounded-control border border-ink-200 bg-white" aria-label="Sugestões de cidade">
          {options.map((option) => (
            <li key={`${option.name}-${option.uf}`}>
              <button
                type="button"
                onClick={() => {
                  latest.current += 1;
                  manual.current = false;
                  setText(option.name);
                  setUf(option.uf);
                  setOptions([]);
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left text-sm text-ink-800 hover:bg-ink-100"
              >
                <MapPinIcon className="size-4 shrink-0 text-ink-500" aria-hidden />
                {option.name}, {option.uf}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/**
 * Filtro de cidade: ao tocar no campo abre a lista das cidades com sala no ar, e ao digitar a lista
 * se reduz. Só dá para escolher uma cidade da lista, para ninguém buscar onde não há anúncio.
 * Quem não acha a sua cidade pede salas ali mesmo.
 */
export function CityFilter({
  value,
  cities,
  tipo,
  onSelect,
}: {
  value: string;
  cities: CityOption[];
  tipo: string;
  onSelect: (city: string) => void;
}) {
  const listId = useId();
  const [text, setText] = useState(value);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"list" | "request">("list");
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // A pílula inteira é a âncora do painel: o input fica dentro dela, com ícone e margem.
  const fieldRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // A URL muda por fora (limpar filtros, voltar): o campo acompanha.
  const [seen, setSeen] = useState(value);
  if (seen !== value) {
    setSeen(value);
    setText(value);
  }

  const query = normalizeCity(text);
  const matches = useMemo(
    () => (query && query !== normalizeCity(value) ? cities.filter((option) => option.key.split("|")[0].includes(query)) : cities),
    [cities, query, value],
  );

  function place() {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const width = Math.min(360, window.innerWidth - 32);
    // Borda esquerda do painel na borda esquerda do campo, 8 px abaixo dele.
    setPosition({ top: rect.bottom + 8, left: Math.max(16, Math.min(rect.left, window.innerWidth - 16 - width)), width });
  }

  function openPanel() {
    place();
    setOpen(true);
  }

  function close(revert = true) {
    if (open && revert && text.trim() && text.trim() !== value && !matches.length) {
      posthog.capture("city_search_no_match", { query: text.trim().slice(0, 80) });
    }
    setOpen(false);
    setMode("list");
    if (revert) setText(value);
  }

  function choose(option: CityOption) {
    setText(option.city);
    setOpen(false);
    setMode("list");
    inputRef.current?.blur();
    onSelect(option.city);
  }

  // A faixa de filtros rola na horizontal e a página na vertical: o painel acompanha o campo.
  useEffect(() => {
    if (!open) return;
    const reposition = place;
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!panelRef.current?.contains(target) && !inputRef.current?.contains(target)) close();
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
    // close lê o texto atual; refazer o ouvinte a cada mudança mantém o valor certo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, text, value, matches.length]);

  return (
    <>
      <div ref={fieldRef} className="flex h-10 w-56 shrink-0 items-center gap-2 rounded-full bg-white pr-1 pl-3.5 ring-1 ring-ink-300 focus-within:ring-2 focus-within:ring-brand-600">
        <MagnifyingGlassIcon className="size-4.5 shrink-0 text-ink-500" aria-hidden />
        <input
          ref={inputRef}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && mode === "list" && matches[active] ? `${listId}-${active}` : undefined}
          aria-label="Cidade"
          autoComplete="off"
          value={text}
          placeholder="Em qual cidade?"
          onFocus={openPanel}
          onClick={() => !open && openPanel()}
          onChange={(event) => {
            setText(event.target.value);
            setActive(0);
            setMode("list");
            if (!open) openPanel();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              close();
              inputRef.current?.blur();
            } else if (event.key === "ArrowDown") {
              event.preventDefault();
              if (!open) openPanel();
              setActive((index) => Math.min(index + 1, Math.max(matches.length - 1, 0)));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive((index) => Math.max(index - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              if (open && mode === "list" && matches[active]) choose(matches[active]);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-500"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              setText("");
              setOpen(false);
              onSelect("");
            }}
            aria-label="Limpar cidade"
            className="grid size-7 shrink-0 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
          >
            <XIcon className="size-3.5" weight="bold" aria-hidden />
          </button>
        )}
      </div>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: position.top, left: position.left, width: position.width }}
            className="fixed z-50 animate-fade-up rounded-card bg-white shadow-raised ring-1 ring-ink-900/8 [animation-duration:0.2s]"
          >
            {mode === "list" ? (
              <>
                <ul id={listId} role="listbox" aria-label="Cidades com salas no ar" className="max-h-64 overflow-y-auto p-2">
                  {matches.map((option, index) => (
                    <li key={option.key} id={`${listId}-${index}`} role="option" aria-selected={normalizeCity(value) === option.key.split("|")[0]}>
                      <button
                        type="button"
                        tabIndex={-1}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => choose(option)}
                        className={`flex w-full items-center justify-between gap-3 rounded-control px-3 py-2.5 text-left text-sm transition-colors ${
                          index === active ? "bg-ink-100" : ""
                        } ${normalizeCity(value) === option.key.split("|")[0] ? "font-bold text-brand-700" : "text-ink-800"}`}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <MapPinIcon className="size-4 shrink-0 text-ink-500" aria-hidden />
                          <span className="truncate">
                            {option.city}, {option.state}
                          </span>
                          {option.trending && (
                            <TrendUpIcon className="size-4 shrink-0 text-brand-600" weight="bold" aria-label="Em alta: mais anúncios na última semana" role="img">
                              <title>Em alta: mais anúncios na última semana</title>
                            </TrendUpIcon>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-ink-500">{salas(option.count)}</span>
                      </button>
                    </li>
                  ))}
                  {!matches.length && (
                    <li role="presentation" className="px-3 py-3 text-sm text-ink-700">
                      Ainda não há salas em “{text.trim()}”.
                    </li>
                  )}
                </ul>
                <div className="border-t border-ink-200 p-4">
                  <p className="text-sm font-bold text-ink-900">Não encontrou a cidade que buscava?</p>
                  <p className="mt-1 text-xs text-ink-600">Peça salas na sua cidade. Usamos os pedidos para trazer anunciantes para lá.</p>
                  <button type="button" onClick={() => setMode("request")} className={`${buttonClasses("secondary", "sm")} mt-3 w-full`}>
                    Pedir salas na minha cidade
                  </button>
                </div>
              </>
            ) : (
              <div className="p-4">
                <CityRequestForm initialCity={matches.length ? "" : text.trim()} tipo={tipo} source="filtro" onBack={() => setMode("list")} />
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
