CREATE TABLE "stones" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "stones_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"caption" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"show_on_home" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stones_name_unique" UNIQUE("name"),
	CONSTRAINT "stones_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
-- Słownik kamieni z kamieni już użytych w produktach (slug: małe litery, bez polskich znaków, myślniki)
INSERT INTO "stones" ("name", "slug")
SELECT DISTINCT s, trim(both '-' from regexp_replace(lower(translate(s, 'ąćęłńóśźżĄĆĘŁŃÓŚŹŻ', 'acelnoszzACELNOSZZ')), '[^a-z0-9]+', '-', 'g'))
FROM "products", unnest("stones") AS s
WHERE s <> ''
ON CONFLICT DO NOTHING;
--> statement-breakpoint
-- Opisy i zdjęcia startowe trzech kamieni ze wzoru (do edycji w panelu)
UPDATE "stones" SET "caption" = 'Ciepło ziemi', "images" = ARRAY['/images/necklace-jasper.svg'], "show_on_home" = true, "position" = 1,
  "description" = E'Jaspis cesarski zachwyca ciepłymi odcieniami piasku, terakoty i miodu. Jego rysunek przypomina mapy dawnych lądów — nie ma dwóch takich samych kamieni.\n\nUznawany za kamień spokoju i uziemienia. W biżuterii M.art łączymy go ze złoconą stalą, by podkreślić jego naturalne ciepło.'
WHERE "name" = 'Jaspis cesarski';
--> statement-breakpoint
UPDATE "stones" SET "caption" = 'Subtelność i blask', "images" = ARRAY['/images/earrings-pearl.svg'], "show_on_home" = true, "position" = 2,
  "description" = E'Perły słodkowodne powstają powoli, warstwa po warstwie. Każda ma własny kształt i delikatny, opalizujący połysk.\n\nTo symbol kobiecości i czułości — ponadczasowy dodatek, który pasuje zarówno do codziennych stylizacji, jak i na wyjątkowe okazje.'
WHERE "name" = 'Perła naturalna';
--> statement-breakpoint
UPDATE "stones" SET "caption" = 'Bliskość natury', "images" = ARRAY['/images/bracelet-agate.svg'], "show_on_home" = true, "position" = 3,
  "description" = E'Agat mszysty skrywa w swoim wnętrzu zielone wzory przypominające mech, paprocie i leśne runo. Mały fragment lasu, który można nosić przy sobie.\n\nKojarzony z równowagą i nowym początkiem. Pięknie łączy się z naturalnymi tkaninami i ciepłym złotem.'
WHERE "name" = 'Agat mszysty';
