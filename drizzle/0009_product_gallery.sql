ALTER TABLE "products" ADD COLUMN "images" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
-- Dotychczasowe zdjęcie produktu staje się pierwszym (głównym) zdjęciem galerii
UPDATE "products" SET "images" = ARRAY["image"] WHERE "image" <> '' AND cardinality("images") = 0;
