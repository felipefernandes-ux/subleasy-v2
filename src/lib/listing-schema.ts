import { z } from "zod";
import {
  BILLING_TYPE_KEYS,
  HIGHLIGHT_KEYS,
  MAX_HIGHLIGHTS,
  MAX_PHOTOS,
  MIN_PHOTOS,
  OFFER_KEYS,
  SPACE_TYPE_KEYS,
  UFS,
  parsePhotoSizes,
} from "./listing-options";

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || null);

// O cadastro passo a passo chega inteiro de uma vez, no último passo.
export const newListingSchema = z.object({
  id: z.uuid(),
  space_type: z.enum(SPACE_TYPE_KEYS),
  space_type_other: optionalText.pipe(z.string().max(80).nullable()),
  zip_code: optionalText.pipe(z.string().regex(/^[0-9]{5}-?[0-9]{3}$/).nullable()),
  street_address: optionalText,
  neighborhood: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().toUpperCase().pipe(z.enum(UFS)),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  show_exact_location: z.boolean(),
  amenities: z.array(z.string().trim().min(1)).max(40),
  photos: z.array(z.string()).min(MIN_PHOTOS).max(MAX_PHOTOS),
  photo_sizes: z.unknown().transform(parsePhotoSizes),
  highlights: z.array(z.enum(HIGHLIGHT_KEYS)).max(MAX_HIGHLIGHTS),
  title: z.string().trim().min(10).max(70),
  short_summary: optionalText.pipe(z.string().max(120).nullable()),
  description: z.string().trim().min(40),
  billing_type: z.enum(BILLING_TYPE_KEYS),
  price: z.number().min(10),
  min_rental_period: optionalText,
  rules: z.array(z.string().trim().min(1)).max(20),
  offers: z.array(z.enum(OFFER_KEYS)),
  whatsapp: z.string(),
  contact_email: z.string().trim().toLowerCase().pipe(z.email()),
});

// Índice do passo de contato no cadastro, para levar a pessoa até o erro.
export const CONTACT_STEP = 8;

