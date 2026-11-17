import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "node:crypto";

const scrypt = (password: string, salt: Buffer, keylen: number, options: ScryptOptions) =>
  new Promise<Buffer>((resolve, reject) => scryptCb(password, salt, keylen, options, (err, key) => (err ? reject(err) : resolve(key))));

const N = 16384, R = 8, P = 1, KEYLEN = 64;

/** Format: scrypt$N$r$p$soleBase64$hashBase64 — parametry zapisane w hashu pozwalają je później zmienić. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scrypt(password, salt, KEYLEN, { N, r: R, p: P });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [algo, n, r, p, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(password, Buffer.from(salt, "base64"), expected.length, { N: Number(n), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

export function validatePasswordStrength(password: string) {
  if (password.length < 10) return "Hasło musi mieć co najmniej 10 znaków.";
  if (password.length > 200) return "Hasło jest za długie.";
  return null;
}

/** Hash „atrapa” — sprawdzany, gdy e-mail nie istnieje, by czas odpowiedzi nie zdradzał kont. */
let dummyHash: Promise<string> | undefined;
export function getDummyHash() {
  return (dummyHash ??= hashPassword(randomBytes(12).toString("hex")));
}
