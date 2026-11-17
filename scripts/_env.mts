// Skrypty działają poza Next.js, więc same ładują .env.local i .env (w tej kolejności, jak Next).
import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });
