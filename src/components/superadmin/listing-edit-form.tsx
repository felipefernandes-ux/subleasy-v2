"use client";

import { startTransition, useActionState, type ReactNode } from "react";
import { adminSaveListing, type AdminListingState } from "@/app/superadmin/anuncios/actions";
import { Button, ButtonLink, Card, CardHeader, Field } from "@/components/superadmin/ui";
import {
  AMENITIES,
  BILLING_TYPES,
  HIGHLIGHTS,
  MAX_HIGHLIGHTS,
  OFFERS,
  SPACE_TYPES,
  UFS,
  formatWhatsApp,
} from "@/lib/listing-options";
import { ADMIN_STATUSES } from "@/lib/superadmin/listing-status";

export type EditableAdminListing = {
  id: string;
  title: string;
  short_summary: string | null;
  description: string | null;
  space_type: string;
  space_type_other: string | null;
  billing_type: string;
  price: number;
  zip_code: string | null;
  neighborhood: string;
  city: string;
  state: string;
  min_rental_period: string | null;
  rules: string[];
  amenities: string[];
  highlights: string[];
  offers: string[];
  show_exact_location: boolean;
  email_contact: boolean;
  status: string;
  /** AAAA-MM-DD, no fuso de São Paulo. */
  expires_on: string;
  review_note: string | null;
  whatsapp: string;
  contact_email: string;
  street_address: string;
};

const CHECK = "size-4 shrink-0 accent-brand-600";

function Check({ name, value, label, defaultChecked }: { name: string; value?: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sa-base text-sa-body">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className={CHECK} />
      {label}
    </label>
  );
}

/** Formulário de edição completa do anúncio. O Super Admin altera qualquer campo, em qualquer status. */
export function ListingEditForm({ listing }: { listing: EditableAdminListing }) {
  const [state, formAction, isPending] = useActionState<AdminListingState, FormData>(adminSaveListing.bind(null, listing.id), { status: "idle" });
  const errors = state.status === "error" ? state.fields : {};
  const err = (name: string): ReactNode => (errors[name] ? <span className="text-danger-600">{errors[name]}</span> : undefined);

  return (
    <form
      noValidate
      className="space-y-6"
      // Sem action={}: o React limparia os campos depois de um erro.
      onSubmit={(event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        startTransition(() => formAction(formData));
      }}
    >
      {state.status === "error" && (
        <p role="alert" className="rounded-sa-card bg-[#fde4e1] p-4 text-sa-base text-[#7a1b12]">
          {state.error}
        </p>
      )}

      <Card>
        <CardHeader title="Sobre a sala" />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Título" htmlFor="title" hint={err("title") ?? "De 10 a 70 caracteres."}>
              <input id="title" name="title" defaultValue={listing.title} className="sa-input" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Resumo" htmlFor="short_summary" hint={err("short_summary") ?? "Até 120 caracteres. Aparece nos cards e na prévia do WhatsApp."}>
              <input id="short_summary" name="short_summary" defaultValue={listing.short_summary ?? ""} className="sa-input" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Descrição" htmlFor="description">
              <textarea id="description" name="description" rows={8} defaultValue={listing.description ?? ""} className="sa-input" />
            </Field>
          </div>
          <Field label="Área de atuação" htmlFor="space_type" hint={err("space_type")}>
            <select id="space_type" name="space_type" defaultValue={listing.space_type} className="sa-input">
              {Object.entries(SPACE_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Qual espaço (se “Outro espaço”)" htmlFor="space_type_other">
            <input id="space_type_other" name="space_type_other" defaultValue={listing.space_type_other ?? ""} className="sa-input" />
          </Field>
          <Field label="Cobrança" htmlFor="billing_type" hint={err("billing_type")}>
            <select id="billing_type" name="billing_type" defaultValue={listing.billing_type} className="sa-input">
              {Object.entries(BILLING_TYPES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Preço (R$)" htmlFor="price" hint={err("price")}>
            <input id="price" name="price" inputMode="decimal" defaultValue={String(listing.price).replace(".", ",")} className="sa-input" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Período mínimo de locação" htmlFor="min_rental_period">
              <input id="min_rental_period" name="min_rental_period" defaultValue={listing.min_rental_period ?? ""} className="sa-input" />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Localização" description="O endereço completo é privado e não aparece na página pública." />
        <div className="grid gap-4 p-5 sm:grid-cols-6">
          <div className="sm:col-span-2">
            <Field label="CEP" htmlFor="zip_code" hint={err("zip_code")}>
              <input id="zip_code" name="zip_code" defaultValue={listing.zip_code ?? ""} className="sa-input" />
            </Field>
          </div>
          <div className="sm:col-span-4">
            <Field label="Endereço completo (privado)" htmlFor="street_address">
              <input id="street_address" name="street_address" defaultValue={listing.street_address} className="sa-input" />
            </Field>
          </div>
          <div className="sm:col-span-3">
            <Field label="Bairro" htmlFor="neighborhood" hint={err("neighborhood")}>
              <input id="neighborhood" name="neighborhood" defaultValue={listing.neighborhood} className="sa-input" />
            </Field>
          </div>
          <div className="sm:col-span-2">
            <Field label="Cidade" htmlFor="city" hint={err("city")}>
              <input id="city" name="city" defaultValue={listing.city} className="sa-input" />
            </Field>
          </div>
          <Field label="UF" htmlFor="state" hint={err("state")}>
            <select id="state" name="state" defaultValue={listing.state.trim().toUpperCase()} className="sa-input">
              {UFS.map((uf) => (
                <option key={uf}>{uf}</option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-6">
            <Check name="show_exact_location" label="Mostrar o ponto exato no mapa (desligado, mostra uma área aproximada)" defaultChecked={listing.show_exact_location} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Comodidades, regras e destaques" />
        <div className="space-y-5 p-5">
          <fieldset>
            <legend className="mb-2 text-sa-sm font-semibold text-sa-ink">Comodidades</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(AMENITIES).map(([key, label]) => (
                <Check key={key} name="amenity" value={key} label={label} defaultChecked={listing.amenities.includes(key)} />
              ))}
            </div>
            {/* Chaves que vieram da importação e não existem no catálogo ficam visíveis, para não se perderem sem ninguém ver. */}
            {listing.amenities.filter((key) => !(key in AMENITIES)).length > 0 && (
              <p className="mt-2 text-sa-xs text-sa-muted">
                Fora do catálogo (serão removidas ao salvar): {listing.amenities.filter((key) => !(key in AMENITIES)).join(", ")}
              </p>
            )}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sa-sm font-semibold text-sa-ink">Destaques (até {MAX_HIGHLIGHTS})</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {Object.entries(HIGHLIGHTS).map(([key, label]) => (
                <Check key={key} name="highlight" value={key} label={label} defaultChecked={listing.highlights.includes(key)} />
              ))}
            </div>
            {errors.highlights && <p className="mt-1 text-sa-xs text-danger-600">{errors.highlights}</p>}
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sa-sm font-semibold text-sa-ink">Ofertas para quem vem pelo Subleasy</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {Object.entries(OFFERS).map(([key, offer]) => (
                <Check key={key} name="offer" value={key} label={offer.title} defaultChecked={listing.offers.includes(key)} />
              ))}
            </div>
          </fieldset>
          <Field label="Regras da sala" htmlFor="rules" hint="Uma regra por linha.">
            <textarea id="rules" name="rules" rows={4} defaultValue={listing.rules.join("\n")} className="sa-input" />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Contato"
          description="Sem WhatsApp, a página esconde o botão e mostra o formulário. As mensagens vão para o e-mail de contato ou, se estiver vazio, para o e-mail da conta do anunciante."
        />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="WhatsApp do anúncio" htmlFor="whatsapp" hint={err("whatsapp") ?? "Deixe vazio para o anúncio receber contatos só pelo formulário."}>
            <input id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={formatWhatsApp(listing.whatsapp)} className="sa-input" />
          </Field>
          <Field label="E-mail de contato" htmlFor="contact_email" hint={err("contact_email")}>
            <input id="contact_email" name="contact_email" type="email" defaultValue={listing.contact_email} className="sa-input" />
          </Field>
          <div className="sm:col-span-2">
            <Check name="email_contact" label="Oferecer o formulário de e-mail também a quem tem WhatsApp" defaultChecked={listing.email_contact} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader title="Publicação" description="Colocar no ar define a data de publicação e, se o prazo estiver vencido ou vazio, mais 30 dias." />
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Status" htmlFor="status">
            <select id="status" name="status" defaultValue={listing.status} className="sa-input">
              {Object.entries(ADMIN_STATUSES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Válido até" htmlFor="expires_on" hint={err("expires_on")}>
            <input id="expires_on" name="expires_on" type="date" defaultValue={listing.expires_on} className="sa-input" />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Nota da revisão" htmlFor="review_note" hint={err("review_note") ?? "O anunciante vê esta nota quando o anúncio volta para ajustes."}>
              <textarea id="review_note" name="review_note" rows={3} defaultValue={listing.review_note ?? ""} className="sa-input" />
            </Field>
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <ButtonLink href={`/anuncios/${listing.id}`} variant="ghost">
          Cancelar
        </ButtonLink>
        <Button type="submit" variant="primary" disabled={isPending}>
          {isPending ? "Salvando…" : "Salvar anúncio"}
        </Button>
      </div>
    </form>
  );
}
