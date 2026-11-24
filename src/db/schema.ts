import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

/** Kategorie produktów (Naszyjniki, Kolczyki…). Zarządzane w panelu /admin/kategorie. */
export const categories = pgTable("categories", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/** Produkty. Ceny zawsze w groszach (integer). */
export const products = pgTable("products", {
  id: text("id").primaryKey(), // slug produktu, używany w adresie URL i w koszyku
  name: text("name").notNull(),
  subtitle: text("subtitle").notNull().default(""),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "restrict" }),
  stones: text("stones").array() /* lista kamieni, np. {Agat mszysty,Perła naturalna} */.notNull().default(sql`'{}'::text[]`),
  material: text("material").notNull().default("Złocona stal szlachetna"),
  size: text("size").notNull().default(""),
  price: integer("price").notNull(),
  compareAtPrice: integer("compare_at_price"),
  image: text("image").notNull().default(""),
  badge: text("badge"),
  description: text("description").notNull().default(""),
  stock: integer("stock").notNull().default(0),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [index("products_listing_idx").on(table.categoryId, table.isActive, table.position)]);

import type { OrderStatus, PaymentStatus } from "../lib/statuses";
export { ORDER_STATUSES, PAYMENT_STATUSES, type OrderStatus, type PaymentStatus } from "../lib/statuses";

/**
 * Słownik kamieni naturalnych: opis, zdjęcia, podpis — strony /kamienie/[slug] i sekcja na stronie głównej.
 * Produkty wskazują kamienie po NAZWIE (products.stones); zmiana nazwy w panelu aktualizuje produkty.
 */
export const stones = pgTable("stones", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  caption: text("caption").notNull().default(""), // krótki podpis na karcie, np. „Ciepło ziemi”
  description: text("description").notNull().default(""), // dłuższy opis (akapity rozdzielone pustą linią)
  images: text("images").array().notNull().default(sql`'{}'::text[]`), // pierwsze = główne
  showOnHome: boolean("show_on_home").notNull().default(false),
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/**
 * Podstrony treściowe edytowane w panelu („Poznaj naszą pracownię”, „Pielęgnacja biżuterii”).
 * images: pierwsze = zdjęcie nagłówkowe podstrony, kolejne = galeria na dole.
 * teaser*: zajawka na stronie głównej (dla pracowni) — z osobnym zdjęciem.
 */
export const pages = pgTable("pages", {
  slug: text("slug").primaryKey(), // "pracownia" | "pielegnacja"
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull(),
  titleAccent: text("title_accent").notNull().default(""),
  intro: text("intro").notNull().default(""),
  body: text("body").notNull().default(""), // akapity rozdzielone pustą linią; „## ” na początku linii = śródtytuł
  images: text("images").array().notNull().default(sql`'{}'::text[]`),
  teaserImage: text("teaser_image"),
  teaserTitle: text("teaser_title").notNull().default(""),
  teaserAccent: text("teaser_accent").notNull().default(""),
  teaserText: text("teaser_text").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

/** Slajdy sekcji HERO na stronie głównej — zdjęcie lub wideo, zarządzane w panelu /admin/strona. */
export const heroSlides = pgTable("hero_slides", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  eyebrow: text("eyebrow").notNull().default(""),
  title: text("title").notNull(),
  titleAccent: text("title_accent").notNull().default(""), // druga linia tytułu, kursywą
  description: text("description").notNull().default(""),
  mediaType: text("media_type").$type<"image" | "video">().notNull().default("image"),
  mediaUrl: text("media_url").notNull(),
  posterUrl: text("poster_url"), // kadr startowy wideo
  hasAudio: boolean("has_audio").notNull().default(false), // film ma dźwięk i klient może go włączyć przyciskiem
  aspect: real("aspect"), // proporcje szerokość/wysokość (np. 0.5625 = pionowy 9:16) — pionowe media mają inny układ na komputerze
  focus: text("focus").notNull().default("center"), // kadrowanie na telefonie: left | center | right
  stone: text("stone").notNull().default(""), // przycisk „Odkryj biżuterię” filtruje po tym kamieniu
  productId: text("product_id"), // etykieta w rogu otwiera ten produkt
  position: integer("position").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  number: text("number").notNull().unique(),
  email: text("email").notNull(),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  address: jsonb("address").$type<{ street: string; postalCode: string; city: string }>().notNull(),
  delivery: text("delivery").notNull(),
  subtotal: integer("subtotal").notNull(),
  shipping: integer("shipping").notNull(),
  total: integer("total").notNull(),
  status: text("status").$type<OrderStatus>().notNull().default("awaiting_confirmation"),
  // Pola przygotowane pod integracje (etapy 6 i 7)
  paymentProvider: text("payment_provider").notNull().default("manual"),
  paymentStatus: text("payment_status").$type<PaymentStatus>().notNull().default("unpaid"),
  paymentRef: text("payment_ref").unique(),
  shippingProvider: text("shipping_provider").notNull().default("manual"),
  shippingRef: text("shipping_ref"),
  trackingNumber: text("tracking_number"),
  adminNote: text("admin_note").notNull().default(""),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const orderItems = pgTable("order_items", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  orderId: text("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  // Bez twardego klucza obcego: produkt można usunąć, a historia zamówienia zostaje.
  productId: text("product_id").notNull(),
  productName: text("product_name").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export const subscribers = pgTable("subscribers", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("newsletter-form"),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  email: text("email").notNull().unique(),
  name: text("name").notNull().default(""),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Sesje admina. `id` to SHA-256 tokena z ciasteczka — sam token nigdy nie trafia do bazy. */
export const adminSessions = pgTable("admin_sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("admin_sessions_expires_idx").on(table.expiresAt)]);
