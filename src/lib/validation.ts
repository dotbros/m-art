import { MAX_PER_PRODUCT, MAX_STONES, slugify } from "./catalog";

/** Wynik walidacji: albo poprawne dane, albo słownik błędów pole → komunikat. */
export type Result<T> = { ok: true; data: T } | { ok: false; errors: Record<string, string> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (value: unknown) => (typeof value === "string" ? value.trim() : "");

export function isEmail(value: string) {
  return EMAIL.test(value) && value.length <= 254;
}

// ---------- Zamówienie ----------
export type OrderInput = {
  email: string; name: string; phone: string; street: string; postalCode: string; city: string;
  delivery: "courier" | "pickup";
  items: { id: string; quantity: number }[];
};

export function validateOrder(body: Record<string, unknown>): Result<OrderInput> {
  const errors: Record<string, string> = {};
  const email = str(body.email).toLowerCase();
  const name = str(body.name), phone = str(body.phone), street = str(body.street), postalCode = str(body.postalCode), city = str(body.city);
  if (name.length < 2 || name.length > 100) errors.name = "Podaj imię i nazwisko.";
  if (!isEmail(email)) errors.email = "Podaj poprawny adres e-mail.";
  if (!/^[+\d\s()-]{7,20}$/.test(phone)) errors.phone = "Podaj poprawny numer telefonu.";
  if (!street || street.length > 200) errors.street = "Podaj ulicę i numer.";
  if (!/^\d{2}-\d{3}$/.test(postalCode)) errors.postalCode = "Kod pocztowy w formacie 00-000.";
  if (!city || city.length > 100) errors.city = "Podaj miejscowość.";
  if (body.delivery !== "courier" && body.delivery !== "pickup") errors.delivery = "Wybierz sposób dostawy.";
  if (body.consent !== true) errors.consent = "Zaakceptuj zasady zamówienia.";

  const quantities = new Map<string, number>();
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 20) {
    errors.items = "Koszyk jest pusty lub zawiera zbyt wiele produktów.";
  } else {
    for (const item of body.items as { id?: unknown; quantity?: unknown }[]) {
      const quantity = Number(item?.quantity);
      if (typeof item?.id !== "string" || item.id.length > 100 || !Number.isInteger(quantity) || quantity < 1) { errors.items = "Nieprawidłowa zawartość koszyka."; break; }
      const total = (quantities.get(item.id) || 0) + quantity;
      if (total > MAX_PER_PRODUCT) { errors.items = `Możesz zamówić maksymalnie ${MAX_PER_PRODUCT} sztuk jednego produktu.`; break; }
      quantities.set(item.id, total);
    }
  }
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { email, name, phone, street, postalCode, city, delivery: body.delivery as "courier" | "pickup", items: [...quantities].map(([id, quantity]) => ({ id, quantity })) } };
}

// ---------- Kategoria (panel admina) ----------
export type CategoryInput = { name: string; slug: string; description: string; position: number; isActive: boolean };

export function validateCategory(form: FormData): Result<CategoryInput> {
  const errors: Record<string, string> = {};
  const name = str(form.get("name"));
  const slug = slugify(str(form.get("slug")) || name);
  const description = str(form.get("description"));
  const position = Number(str(form.get("position")) || 0);
  if (name.length < 2 || name.length > 60) errors.name = "Nazwa musi mieć od 2 do 60 znaków.";
  if (!slug) errors.slug = "Adres (slug) nie może być pusty.";
  if (description.length > 1000) errors.description = "Opis może mieć maksymalnie 1000 znaków.";
  if (!Number.isInteger(position) || position < 0 || position > 9999) errors.position = "Kolejność to liczba 0–9999.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: { name, slug, description, position, isActive: form.get("isActive") === "on" } };
}

// ---------- Produkt (panel admina) ----------
export type ProductInput = {
  id: string; name: string; subtitle: string; categoryId: number; stones: string[]; material: string; size: string;
  price: number; compareAtPrice: number | null; badge: string | null; description: string; stock: number; position: number; isActive: boolean;
};

/** „189,90” / „189.9” / „189” → 18990 groszy. Zwraca NaN, gdy format jest błędny. */
export function parsePrice(value: string): number {
  const normalized = value.replace(/\s/g, "").replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(normalized)) return NaN;
  return Math.round(Number(normalized) * 100);
}

export function validateProduct(form: FormData): Result<ProductInput> {
  const errors: Record<string, string> = {};
  const name = str(form.get("name"));
  const id = slugify(str(form.get("slug")) || name);
  const price = parsePrice(str(form.get("price")));
  const compareRaw = str(form.get("compareAtPrice"));
  const compareAtPrice = compareRaw ? parsePrice(compareRaw) : null;
  const stock = Number(str(form.get("stock")) || 0);
  const position = Number(str(form.get("position")) || 0);
  const categoryId = Number(str(form.get("categoryId")));
  const description = str(form.get("description"));
  if (name.length < 2 || name.length > 80) errors.name = "Nazwa musi mieć od 2 do 80 znaków.";
  if (!id) errors.slug = "Adres (slug) nie może być pusty.";
  if (!Number.isInteger(categoryId) || categoryId < 1) errors.categoryId = "Wybierz kategorię.";
  if (!Number.isFinite(price) || price <= 0) errors.price = "Podaj cenę, np. 189,00.";
  if (compareAtPrice !== null && (!Number.isFinite(compareAtPrice) || compareAtPrice <= price)) errors.compareAtPrice = "Cena przed obniżką musi być wyższa od ceny.";
  if (!Number.isInteger(stock) || stock < 0 || stock > 100000) errors.stock = "Stan magazynowy to liczba całkowita ≥ 0.";
  if (!Number.isInteger(position) || position < 0 || position > 9999) errors.position = "Kolejność to liczba 0–9999.";
  if (description.length > 5000) errors.description = "Opis może mieć maksymalnie 5000 znaków.";
  const stones = parseStones(form.getAll("stones"));
  if (stones.length > MAX_STONES) errors.stones = `Maksymalnie ${MAX_STONES} kamieni.`;
  else if (stones.some((s) => s.length > 60)) errors.stones = "Nazwa kamienia może mieć maksymalnie 60 znaków.";
  for (const field of ["subtitle", "material", "size", "badge"] as const) if (str(form.get(field)).length > 120) errors[field] = "Maksymalnie 120 znaków.";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, data: {
    id, name, subtitle: str(form.get("subtitle")), categoryId, stones, material: str(form.get("material")), size: str(form.get("size")),
    price, compareAtPrice, badge: str(form.get("badge")).toUpperCase() || null, description, stock, position, isActive: form.get("isActive") === "on",
  } };
}

/**
 * Lista kamieni z formularza: przycina spacje, usuwa puste i duplikaty (bez względu na wielkość liter),
 * zachowuje kolejność wyboru. Pierwsza litera wielka, by „agat mszysty” i „Agat mszysty” były jednym kamieniem.
 */
export function parseStones(values: FormDataEntryValue[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (typeof value !== "string") continue;
    const name = value.replace(/\s+/g, " ").trim();
    if (!name) continue;
    const normalized = name.charAt(0).toLocaleUpperCase("pl-PL") + name.slice(1);
    const key = normalized.toLocaleLowerCase("pl-PL");
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(normalized);
  }
  return result;
}