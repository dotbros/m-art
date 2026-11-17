import { sql } from "drizzle-orm";
import { getDbHandle } from "@/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const handle = await getDbHandle();
    await handle.db.execute(sql`select 1`);
    return Response.json({ ok: true, db: handle.kind });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
