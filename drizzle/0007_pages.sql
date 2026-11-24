CREATE TABLE "pages" (
	"slug" text PRIMARY KEY NOT NULL,
	"eyebrow" text DEFAULT '' NOT NULL,
	"title" text NOT NULL,
	"title_accent" text DEFAULT '' NOT NULL,
	"intro" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"images" text[] DEFAULT '{}'::text[] NOT NULL,
	"teaser_image" text,
	"teaser_title" text DEFAULT '' NOT NULL,
	"teaser_accent" text DEFAULT '' NOT NULL,
	"teaser_text" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- Treści ze wzoru (okno „O pracowni”, sekcja na stronie głównej, okno „Pielęgnacja”) — od teraz edytowalne w panelu
INSERT INTO "pages" ("slug", "eyebrow", "title", "title_accent", "intro", "body", "images", "teaser_image", "teaser_title", "teaser_accent", "teaser_text") VALUES
('pracownia', 'POZNAJ PRACOWNIĘ M.ART', 'Nie z fabryki.', 'Z pasji.',
 'M.art to mała pracownia, w której natura spotyka się z rzemiosłem. Wierzymy, że biżuteria nie musi krzyczeć, aby wyrażać to, co najważniejsze.',
 E'Każdy kamień wybieramy osobno. Zwracamy uwagę na jego kolor, rysunek i to nieuchwytne „coś”, które sprawia, że nie można oderwać wzroku. Potem, krok po kroku, ręcznie tworzymy z niego małe dzieło.\n\nNasze kolekcje powstają w krótkich seriach. Naturalne różnice między kamieniami i perłami są ich największym atutem — Twoja biżuteria jest naprawdę tylko Twoja.',
 ARRAY['/images/atelier.svg'], '/images/atelier.svg', 'Nie z fabryki.', 'Z pasji.',
 E'Wierzymy, że najpiękniejsze rzeczy powstają powoli. Z uważnością, czułością i zachwytem nad tym, co daje nam natura.\n\nW M.art każdy kamień dobieramy ręcznie, a każdy detal ma znaczenie. Tworzymy biżuterię, którą chce się nosić blisko — nie tylko od święta.'),
('pielegnacja', 'PIĘKNO NA DŁUŻEJ', 'Odrobina troski', 'wystarczy.',
 'Naturalne kamienie i perły lubią delikatne traktowanie. Kilka małych rytuałów pozwoli im zachować blask na długie lata.',
 E'## Ostatnia rzecz przed wyjściem\nZakładaj biżuterię po nałożeniu kosmetyków i perfum. Zdejmuj ją przed kąpielą, treningiem, snem i pracami domowymi.\n\n## Miękko i osobno\nPrzechowuj biżuterię w dołączonym pudełeczku lub miękkim woreczku, z dala od wilgoci i bezpośredniego słońca. Poszczególne elementy trzymaj oddzielnie.\n\n## Naturalnie czysta\nPrzecieraj miękką, suchą ściereczką. Nie używaj środków chemicznych, myjek ultradźwiękowych ani past do srebra. Perły są szczególnie wrażliwe na detergenty i kwasy.',
 ARRAY['/images/pearl-necklace.svg'], NULL, '', '', '')
ON CONFLICT ("slug") DO NOTHING;
