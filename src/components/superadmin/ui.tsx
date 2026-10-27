import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowUpRightIcon, HourglassMediumIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/ssr";
import type { Icon } from "@phosphor-icons/react";
import type { ListingOrigin, ListingStatus, Role, UserStatus } from "@/app/superadmin/_data/mock";

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(" ");

/* ——— Cabeçalho de página ——— */

export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 pb-6">
      <div className="min-w-0 max-w-2xl">
        {eyebrow && <div className="mb-2">{eyebrow}</div>}
        <h1 className="sa-display text-sa-h1 font-semibold text-sa-ink">{title}</h1>
        {description && <p className="mt-1.5 text-sa-base text-sa-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/* ——— Selos ——— */

type Tone = "neutral" | "brand" | "success" | "warning" | "danger";

// Selos discretos: fundo claro, texto escuro com contraste, ponto na cor do estado.
const TONES: Record<Tone, { box: string; dot: string }> = {
  neutral: { box: "bg-sa-haze text-sa-body", dot: "bg-sa-subtle" },
  brand: { box: "bg-brand-100 text-brand-900", dot: "bg-brand-500" },
  success: { box: "bg-mint-100 text-[#064e3b]", dot: "bg-mint-500" },
  warning: { box: "bg-[#fdebd0] text-[#6b2a0c]", dot: "bg-warning-500" },
  danger: { box: "bg-[#fde4e1] text-[#7a1b12]", dot: "bg-danger-600" },
};

export function Badge({ tone = "neutral", dot, children }: { tone?: Tone; dot?: boolean; children: ReactNode }) {
  return (
    <span className={cx("sa-badge", TONES[tone].box)}>
      {dot && <span aria-hidden className={cx("size-1.5 rounded-full", TONES[tone].dot)} />}
      {children}
    </span>
  );
}

/** O selo "Soon" marca o que ainda não existe (Fase 2 e Depois). Fica quieto de propósito. */
export function SoonBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-[5px] bg-brand-100 px-1 py-px text-sa-micro leading-[1.3] text-brand-900",
        className,
      )}
    >
      Soon
    </span>
  );
}

const LISTING_STATUS: Record<ListingStatus, [string, Tone]> = {
  em_revisao: ["Em revisão", "warning"],
  no_ar: ["No ar", "success"],
  pausado: ["Pausado", "neutral"],
  devolvido: ["Devolvido", "danger"],
  convite_pendente: ["Convite pendente", "brand"],
  removido: ["Removido", "neutral"],
};

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  const [label, tone] = LISTING_STATUS[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

const ORIGIN: Record<ListingOrigin, string> = { anunciante: "Anunciante", admin: "Criado pelo admin", importado: "Importado" };

export function OriginLabel({ origin }: { origin: ListingOrigin }) {
  return <span className="text-sa-muted">{ORIGIN[origin]}</span>;
}

const USER_STATUS: Record<UserStatus, [string, Tone]> = {
  ativo: ["Ativo", "success"],
  convite_pendente: ["Convite pendente", "brand"],
  suspenso: ["Suspenso", "danger"],
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  const [label, tone] = USER_STATUS[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}

const ROLE: Record<Role, string> = { anunciante: "Anunciante", cliente: "Cliente", admin: "Admin" };

export function RoleBadges({ roles }: { roles: Role[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <Badge key={role} tone={role === "admin" ? "brand" : "neutral"}>
          {ROLE[role]}
        </Badge>
      ))}
    </span>
  );
}

/* ——— Botões ——— */

type ButtonVariant = "primary" | "outline" | "ghost" | "danger";

const variantClass: Record<ButtonVariant, string> = {
  primary: "sa-btn-primary",
  outline: "sa-btn-outline",
  ghost: "sa-btn-ghost",
  danger: "sa-btn-danger",
};

export function buttonClass(variant: ButtonVariant = "outline", small?: boolean) {
  return cx("sa-btn", variantClass[variant], small && "sa-btn-sm");
}

export function ButtonLink({
  variant = "outline",
  small,
  className,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; small?: boolean }) {
  return <Link {...props} className={cx(buttonClass(variant, small), className)} />;
}

export function Button({
  variant = "outline",
  small,
  className,
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; small?: boolean }) {
  return <button {...props} type={type} className={cx(buttonClass(variant, small), className)} />;
}

/* ——— Cards e blocos ——— */

export function Card({ className, ...props }: ComponentProps<"section">) {
  return <section {...props} className={cx("sa-card", className)} />;
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-sa-haze px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-sa-lg font-semibold text-sa-ink">{title}</h2>
        {description && <p className="mt-0.5 text-sa-sm text-sa-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  series,
}: {
  label: string;
  value: string | number;
  hint?: string;
  series?: number[];
}) {
  const max = series ? Math.max(...series) : 0;
  return (
    <Card className="p-5">
      <p className="text-sa-sm text-sa-muted">{label}</p>
      <div className="mt-2 flex items-end justify-between gap-4">
        <p className="sa-display text-sa-stat font-semibold text-sa-ink">{value}</p>
        {series && (
          <div aria-hidden className="flex h-9 items-end gap-0.5">
            {series.map((point, index) => (
              <span
                key={index}
                className={cx("w-1.5 rounded-sm", index === series.length - 1 ? "bg-brand-600" : "bg-sa-line-strong")}
                style={{ height: `${Math.max(14, (point / max) * 100)}%` }}
              />
            ))}
          </div>
        )}
      </div>
      {hint && <p className="mt-1.5 text-sa-xs text-sa-muted">{hint}</p>}
    </Card>
  );
}

/** Item da fila do dia: número grande, título e atalho para a tela. */
export function QueueCard({
  href,
  label,
  count,
  detail,
  icon: IconComponent,
  soon,
}: {
  href: string;
  label: string;
  count: number | string;
  detail: string;
  icon: Icon;
  soon?: boolean;
}) {
  return (
    <Link
      href={href}
      className="sa-card group flex flex-col gap-3 p-5 transition-shadow hover:shadow-sa-raised"
    >
      <div className="flex items-center justify-between">
        <span className="grid size-8 place-items-center rounded-sa-control bg-sa-paper text-sa-body">
          <IconComponent className="size-4" weight="bold" aria-hidden />
        </span>
        {soon ? (
          <SoonBadge />
        ) : (
          <ArrowUpRightIcon
            className="size-4 text-sa-subtle transition-colors group-hover:text-brand-600"
            weight="bold"
            aria-hidden
          />
        )}
      </div>
      <div>
        <p className="sa-display text-sa-stat font-semibold text-sa-ink">{count}</p>
        <p className="mt-1 text-sa-base font-semibold text-sa-ink">{label}</p>
        <p className="mt-0.5 text-sa-sm text-sa-muted">{detail}</p>
      </div>
    </Link>
  );
}

/* ——— Formulários ——— */

export function Field({
  label,
  hint,
  children,
  htmlFor,
}: {
  label: string;
  hint?: ReactNode;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-sa-sm font-semibold text-sa-ink">
        {label}
      </label>
      {children}
      {hint && <p className="text-sa-xs text-sa-muted">{hint}</p>}
    </div>
  );
}

export function SearchInput({ placeholder, className }: { placeholder: string; className?: string }) {
  return (
    <div className={cx("relative", className)}>
      <MagnifyingGlassIcon
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sa-subtle"
        aria-hidden
      />
      <input type="search" aria-label={placeholder} placeholder={placeholder} className="sa-input pl-9" />
    </div>
  );
}

export function Select({ label, options, className }: { label: string; options: string[]; className?: string }) {
  return (
    <select aria-label={label} defaultValue="" className={cx("sa-input w-auto min-w-36 pr-8", className)}>
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  );
}

/** Abas de filtro: só visual, sem estado. A aba ativa vem por parâmetro. */
export function Segmented({ items, active }: { items: Array<{ label: string; count?: number }>; active: string }) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-sa-line">
      {items.map((item) => {
        const current = item.label === active;
        return (
          <span
            key={item.label}
            role="tab"
            aria-selected={current}
            className={cx(
              "-mb-px flex items-center gap-1.5 border-b-2 px-3 pb-2.5 pt-1 text-sa-base",
              current ? "border-brand-600 font-semibold text-brand-700" : "border-transparent text-sa-muted",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className="rounded-sa-badge bg-sa-haze px-1.5 text-sa-xs text-sa-body">{item.count}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .replace(/^(Dr\.|Dra\.)\s/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const dimension = size === "sm" ? "size-6 text-sa-micro" : size === "lg" ? "size-14 sa-display text-sa-title" : "size-8 text-sa-xs";
  return (
    <span
      aria-hidden
      className={cx("grid shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-900", dimension)}
    >
      {initials}
    </span>
  );
}

export function DefinitionList({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="divide-y divide-sa-haze">
      {items.map(([term, value]) => (
        <div key={term} className="grid grid-cols-[9rem_1fr] gap-4 px-5 py-3 text-sa-base">
          <dt className="text-sa-muted">{term}</dt>
          <dd className="min-w-0 text-sa-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TableCard({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className="flex items-center justify-between border-t border-sa-line px-4 py-3 text-sa-sm text-sa-muted">{footer}</div>}
    </Card>
  );
}

export function Pagination({ total, shown }: { total: number; shown: number }) {
  return (
    <>
      <span>
        Mostrando {shown} de {total}
      </span>
      <span className="flex gap-1.5">
        <Button small disabled>
          Anterior
        </Button>
        <Button small disabled={shown >= total}>
          Próxima
        </Button>
      </span>
    </>
  );
}

/* ——— Tela "Soon" ——— */

export function SoonNotice({ summary, note, phase }: { summary: string; note?: string; phase: "fase2" | "depois" }) {
  return (
    <Card className="mx-auto mt-4 flex max-w-xl flex-col items-center gap-4 px-8 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-sa-card bg-brand-50 text-brand-600">
        <HourglassMediumIcon className="size-6" weight="duotone" aria-hidden />
      </span>
      <div className="flex items-center gap-2">
        <SoonBadge />
        <span className="text-sa-sm text-sa-muted">{phase === "fase2" ? "Planejado para a Fase 2" : "Planejado para depois da Fase 2"}</span>
      </div>
      <p className="text-sa-lg text-sa-ink">{summary}</p>
      {note && <p className="text-sa-sm text-sa-muted">{note}</p>}
    </Card>
  );
}

export { cx };
