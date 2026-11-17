ALTER TABLE "products" ADD COLUMN "stones" text[] DEFAULT '{}'::text[] NOT NULL;
--> statement-breakpoint
-- Przeniesienie dotychczasowego pojedynczego kamienia do listy kamieni
UPDATE "products" SET "stones" = ARRAY["stone"] WHERE "stone" <> '' AND cardinality("stones") = 0;