import "./_env.mts";
import { createDb } from "../src/db/index.ts";
import { seedDemoData } from "../src/lib/seed.ts";

const handle = await createDb();
try {
  const done = await seedDemoData(handle.db);
  console.log(done ? "✔ Wgrano kategorie i produkty demonstracyjne." : "ℹ Baza zawiera już kategorie — pominięto dane demo.");
} finally {
  await handle.close();
}
