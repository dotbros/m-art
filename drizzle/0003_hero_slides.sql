CREATE TABLE "hero_slides" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "hero_slides_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"eyebrow" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"title_accent" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"media_type" text DEFAULT 'image' NOT NULL,
	"media_url" text NOT NULL,
	"poster_url" text,
	"focus" text DEFAULT 'center' NOT NULL,
	"stone" text DEFAULT '' NOT NULL,
	"product_id" text,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

--> statement-breakpoint
-- Dotychczasowe 3 slajdy ze wzoru — od teraz edytowalne w panelu
INSERT INTO "hero_slides" ("eyebrow", "title", "title_accent", "description", "media_type", "media_url", "focus", "stone", "product_id", "position") VALUES
('BIŻUTERIA INSPIROWANA NATURĄ', 'Z natury', 'wyjątkowa.', E'Prawdziwe kamienie. Ręczna praca. Twoja historia.\nOdkryj biżuterię, która jest tak niepowtarzalna jak Ty.', 'image', '/images/hero-jewelry.svg', 'right', 'Jaspis cesarski', 'komplet-jaspis', 1),
('NATURALNY BLASK, KTÓRY ZOSTAJE', 'Małe perły,', 'wielkie emocje.', E'Subtelne, organiczne, nieidealnie idealne.\nPozwól naturalnym perłom opowiedzieć Twoją historię.', 'image', '/images/hero-pearl.svg', 'right', 'Perła naturalna', 'kolczyki-perly', 2),
('ODROBINA SPOKOJU NA CO DZIEŃ', 'Blisko natury.', 'Blisko Ciebie.', E'Zatrzymaj piękno lasu w małym detalu.\nPoznaj biżuterię z naturalnym agatem mszystym.', 'image', '/images/hero-agate.svg', 'right', 'Agat mszysty', 'bransoletka-agat', 3);