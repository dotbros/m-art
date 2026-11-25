import { sql } from "drizzle-orm";
import { boolean, customType, datetime, double, index, int, json, mysqlTable, text, varchar } from "drizzle-orm/mysql-core";

/*
 * Schemat dla MariaDB 10.11 / MySQL 8 (D-018: hosting ma tylko MariaDB).
 * - listy (kamienie, zdjęcia, produkty kolekcji) to kolumny JSON z tablicą napisów;
 * - daty to DATETIME(3) w UTC (połączenie ustawia time_zone = '+00:00');
 * - klucze i pola unikalne to VARCHAR (MariaDB nie indeksuje TEXT bez długości).
 */

/** Lista napisów w kolumnie JSON. MariaDB zwraca JSON jako tekst — parsujemy go sami. */
const list = customType<{ data: string[]; driverData: string }>({
  dataType: () => "json",
  toDriver: (value) => JSON.stringify(value ?? []),
  fromDriver: (value) => {
    if (Array.isArray(value)) return value as string[];
    try { const parsed = JSON.parse(String(value ?? "[]")); return Array.isArray(parsed) ? parsed.map(String) : []; } catch { return []; }
  },
});

/** Data w UTC, z milisekundami. */
const ts = (name: string) => datetime(name, { mode: "date", fsp: 3 });
const now = sql`CURRENT_TIMESTAMP(3)`;

/** Kategorie produktów (Naszyjniki, Kolczyki…). Zarządzane w panelu /admin/kategorie. */
export const categories = mysqlTable("categories", {
  id: int("id").primaryKey().autoincrement(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull().default(""),
  position: int("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: ts("created_at").notNull().default(now),
  updatedAt: ts("updated_at").notNull().default(now).$onUpdate(() => new Date()),
});

/** Produkty. Ceny zawsze w groszach (integer). */
export const products = mysqlTable("products", {
  id: varchar("id", { length: 120 }).primaryKey(), // slug produktu, używany w adresie URL i w koszyku
  name: varchar("name", { length: 160 }).notNull(),
  subtitle: varchar("subtitle", { length: 200 }).notNull().default(""),
  categoryId: int("category_id").references(() => categories.id, { onDelete: "restrict" }),
  stones: list("stones").notNull().default([]), // lista kamieni, np. ["Agat mszysty","Perła naturalna"]
  material: varchar("material", { length: 200 }).notNull().default("Złocona stal szlachetna"),
  size: varchar("size", { length: 200 }).notNull().default(""),
  price: int("price").notNull(),
  compareAtPrice: int("compare_at_price"),
  image: varchar("image", { length: 255 }).notNull().default(""), // zdjęcie główne = images[0] (utrzymywane przy zapisie — dla zgodności)
  images: list("images").notNull().default([]), // galeria produktu (pierwsze = główne)
  badge: varchar("badge", { length: 200 }),
  description: text("description").notNull().default(""),
  stock: int("stock").notNull().default(0),
  position: int("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: ts("created_at").notNull().default(now),
  updatedAt: ts("updated_at").notNull().default(now).$onUpdate(() => new Date()),
}, (table) => [index("products_listing_idx").on(table.categoryId, table.isActive, table.position)]);

import type { OrderStatus, PaymentStatus } from "../lib/statuses";
export { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "../lib/statuses";

/**
 * Słownik kamieni naturalnych: opis, zdjęcia, podpis — strony /kamienie/[slug] i sekcja na stronie głównej.
 * Produkty wskazują kamienie po NAZWIE (products.stones); zmiana nazwy w panelu aktualizuje produkty.
 */
export const stones = mysqlTable("stones", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 120 }).notNull().unique(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  caption: varchar("caption", { length: 200 }).notNull().default(""), // krótki podpis na karcie, np. „Ciepło ziemi”
  description: text("description").notNull().default(""), // dłuższy opis (akapity rozdzielone pustą linią)
  images: list("images").notNull().default([]), // pierwsze = główne
  showOnHome: boolean("show_on_home").notNull().default(false),
  position: int("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: ts("created_at").notNull().default(now),
  updatedAt: ts("updated_at").notNull().default(now).$onUpdate(() => new Date()),
});

/**
 * Podstrony treściowe edytowane w panelu („Poznaj naszą pracownię”, „Pielęgnacja biżuterii”).
 * images: pierwsze = zdjęcie nagłówkowe podstrony, kolejne = galeria na dole.
 * teaser*: zajawka na stronie głównej (dla pracowni) — z osobnym zdjęciem.
 */
export const pages = mysqlTable("pages", {
  slug: varchar("slug", { length: 60 }).primaryKey(), // "pracownia" | "pielegnacja"
  eyebrow: varchar("eyebrow", { length: 200 }).notNull().default(""),
  title: varchar("title", { length: 200 }).notNull(),
  titleAccent: varchar("title_accent", { length: 200 }).notNull().default(""),
  intro: text("intro").notNull().default(""),
  body: text("body").notNull().default(""), // akapity rozdzielone pustą linią; „## ” na początku linii = śródtytuł
  images: list("images").notNull().default([]),
  teaserImage: varchar("teaser_image", { length: 255 }),
  teaserTitle: varchar("teaser_title", { length: 200 }).notNull().default(""),
  teaserAccent: varchar("teaser_accent", { length: 200 }).notNull().default(""),
  teaserText: text("teaser_text").notNull().default(""),
  updatedAt: ts("updated_at").notNull().default(now).$onUpdate(() => new Date()),
});

/** Slajdy sekcji HERO na stronie głównej — zdjęcie lub wideo, zarządzane w panelu /admin/strona. */
export const heroSlides = mysqlTable("hero_slides", {
  id: int("id").primaryKey().autoincrement(),
  eyebrow: varchar("eyebrow", { length: 200 }).notNull().default(""),
  title: varchar("title", { length: 200 }).notNull(),
  titleAccent: varchar("title_accent", { length: 200 }).notNull().default(""), // druga linia tytułu, kursywą
  description: text("description").notNull().default(""),
  mediaType: varchar("media_type", { length: 10 }).$type<"image" | "video">().notNull().default("image"),
  mediaUrl: varchar("media_url", { length: 255 }).notNull(),
  posterUrl: varchar("poster_url", { length: 255 }), // kadr startowy wideo
  hasAudio: boolean("has_audio").notNull().default(false), // film ma dźwięk i klient może go włączyć przyciskiem
  aspect: double("aspect"), // proporcje szerokość/wysokość (np. 0.5625 = pionowy 9:16) — pionowe media mają inny układ na komputerze
  focus: varchar("focus", { length: 10 }).notNull().default("center"), // kadrowanie na telefonie: left | center | right
  stone: varchar("stone", { length: 120 }).notNull().default(""), // przycisk „Odkryj biżuterię” filtruje po tym kamieniu
  productId: varchar("product_id", { length: 120 }), // etykieta w rogu otwiera ten produkt
  productIds: list("product_ids").notNull().default([]), // własna kolekcja slajdu („Odkryj biżuterię” pokazuje tylko te produkty)
  position: int("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: ts("created_at").notNull().default(now),
  updatedAt: ts("updated_at").notNull().default(now).$onUpdate(() => new Date()),
});

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 64 }).primaryKey(),
  number: varchar("number", { length: 40 }).notNull().unique(),
  email: varchar("email", { length: 254 }).notNull(),
  customerName: varchar("customer_name", { length: 200 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  address: json("address").$type<{ street: string; postalCode: string; city: string }>().notNull(),
  delivery: varchar("delivery", { length: 40 }).notNull(),
  subtotal: int("subtotal").notNull(),
  shipping: int("shipping").notNull(),
  total: int("total").notNull(),
  status: varchar("status", { length: 40 }).$type<OrderStatus>().notNull().default("awaiting_confirmation"),
  // Pola przygotowane pod integracje (etapy 6 i 7)
  paymentProvider: varchar("payment_provider", { length: 40 }).notNull().default("manual"),
  paymentStatus: varchar("payment_status", { length: 40 }).$type<PaymentStatus>().notNull().default("unpaid"),
  paymentRef: varchar("payment_ref", { length: 191 }).unique(),
  shippingProvider: varchar("shipping_provider", { length: 40 }).notNull().default("manual"),
  shippingRef: varchar("shipping_ref", { length: 191 }),
  trackingNumber: varchar("tracking_number", { length: 100 }),
  adminNote: text("admin_note").notNull().default(""),
  termsAcceptedAt: ts("terms_accepted_at").notNull().default(now),
  createdAt: ts("created_at").notNull().default(now),
  updatedAt: ts("updated_at").notNull().default(now).$onUpdate(() => new Date()),
});

export const orderItems = mysqlTable("order_items", {
  id: int("id").primaryKey().autoincrement(),
  orderId: varchar("order_id", { length: 64 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  // Bez twardego klucza obcego: produkt można usunąć, a historia zamówienia zostaje.
  productId: varchar("product_id", { length: 120 }).notNull(),
  productName: varchar("product_name", { length: 160 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unit_price").notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export const subscribers = mysqlTable("subscribers", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  source: varchar("source", { length: 60 }).notNull().default("newsletter-form"),
  consentAt: ts("consent_at").notNull().default(now),
  createdAt: ts("created_at").notNull().default(now),
});

export const messages = mysqlTable("messages", {
  id: int("id").primaryKey().autoincrement(),
  name: varchar("name", { length: 200 }).notNull(),
  email: varchar("email", { length: 254 }).notNull(),
  message: text("message").notNull(),
  createdAt: ts("created_at").notNull().default(now),
});

export const adminUsers = mysqlTable("admin_users", {
  id: int("id").primaryKey().autoincrement(),
  email: varchar("email", { length: 254 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull().default(""),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: ts("created_at").notNull().default(now),
});

/** Sesje admina. `id` to SHA-256 tokena z ciasteczka — sam token nigdy nie trafia do bazy. */
export const adminSessions = mysqlTable("admin_sessions", {
  id: varchar("id", { length: 64 }).primaryKey(),
  userId: int("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: ts("expires_at").notNull(),
  createdAt: ts("created_at").notNull().default(now),
}, (table) => [index("admin_sessions_expires_idx").on(table.expiresAt)]);
