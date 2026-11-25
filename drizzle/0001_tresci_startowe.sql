-- Treści startowe (te same co w dawnych migracjach PostgreSQL 0003 i 0007): slajdy HERO i podstrony.
-- Wszystko można później zmienić w panelu (/admin/strona). Przy przenoszeniu danych skrypt importu je zastępuje.
INSERT INTO `hero_slides` (`eyebrow`, `title`, `title_accent`, `description`, `media_type`, `media_url`, `focus`, `stone`, `product_id`, `position`) VALUES
('BIŻUTERIA INSPIROWANA NATURĄ', 'Z natury', 'wyjątkowa.', 'Prawdziwe kamienie. Ręczna praca. Twoja historia.\nOdkryj biżuterię, która jest tak niepowtarzalna jak Ty.', 'image', '/images/hero-jewelry.svg', 'right', 'Jaspis cesarski', 'komplet-jaspis', 1),
('NATURALNY BLASK, KTÓRY ZOSTAJE', 'Małe perły,', 'wielkie emocje.', 'Subtelne, organiczne, nieidealnie idealne.\nPozwól naturalnym perłom opowiedzieć Twoją historię.', 'image', '/images/hero-pearl.svg', 'right', 'Perła naturalna', 'kolczyki-perly', 2),
('ODROBINA SPOKOJU NA CO DZIEŃ', 'Blisko natury.', 'Blisko Ciebie.', 'Zatrzymaj piękno lasu w małym detalu.\nPoznaj biżuterię z naturalnym agatem mszystym.', 'image', '/images/hero-agate.svg', 'right', 'Agat mszysty', 'bransoletka-agat', 3);
--> statement-breakpoint
INSERT IGNORE INTO `pages` (`slug`, `eyebrow`, `title`, `title_accent`, `intro`, `body`, `images`, `teaser_image`, `teaser_title`, `teaser_accent`, `teaser_text`) VALUES
('pracownia', 'POZNAJ PRACOWNIĘ M.ART', 'Nie z fabryki.', 'Z pasji.',
 'M.art to mała pracownia, w której natura spotyka się z rzemiosłem. Wierzymy, że biżuteria nie musi krzyczeć, aby wyrażać to, co najważniejsze.',
 'Każdy kamień wybieramy osobno. Zwracamy uwagę na jego kolor, rysunek i to nieuchwytne „coś”, które sprawia, że nie można oderwać wzroku. Potem, krok po kroku, ręcznie tworzymy z niego małe dzieło.\n\nNasze kolekcje powstają w krótkich seriach. Naturalne różnice między kamieniami i perłami są ich największym atutem — Twoja biżuteria jest naprawdę tylko Twoja.',
 '["/images/atelier.svg"]', '/images/atelier.svg', 'Nie z fabryki.', 'Z pasji.',
 'Wierzymy, że najpiękniejsze rzeczy powstają powoli. Z uważnością, czułością i zachwytem nad tym, co daje nam natura.\n\nW M.art każdy kamień dobieramy ręcznie, a każdy detal ma znaczenie. Tworzymy biżuterię, którą chce się nosić blisko — nie tylko od święta.'),
('pielegnacja', 'PIĘKNO NA DŁUŻEJ', 'Odrobina troski', 'wystarczy.',
 'Naturalne kamienie i perły lubią delikatne traktowanie. Kilka małych rytuałów pozwoli im zachować blask na długie lata.',
 '## Ostatnia rzecz przed wyjściem\nZakładaj biżuterię po nałożeniu kosmetyków i perfum. Zdejmuj ją przed kąpielą, treningiem, snem i pracami domowymi.\n\n## Miękko i osobno\nPrzechowuj biżuterię w dołączonym pudełeczku lub miękkim woreczku, z dala od wilgoci i bezpośredniego słońca. Poszczególne elementy trzymaj oddzielnie.\n\n## Naturalnie czysta\nPrzecieraj miękką, suchą ściereczką. Nie używaj środków chemicznych, myjek ultradźwiękowych ani past do srebra. Perły są szczególnie wrażliwe na detergenty i kwasy.',
 '["/images/pearl-necklace.svg"]', NULL, '', '', '');
