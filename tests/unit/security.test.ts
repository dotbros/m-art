import { describe, expect, it } from "vitest";
import { hashPassword, validatePasswordStrength, verifyPassword } from "@/lib/auth/password";
import { clearAttempts, isRateLimited, registerFailedAttempt } from "@/lib/auth/sessions";
import { detectImageType, MEDIA_NAME } from "@/lib/uploads";

describe("hasła", () => {
  it("hash jest solony i weryfikuje tylko poprawne hasło", async () => {
    const a = await hashPassword("BardzoTajne123");
    const b = await hashPassword("BardzoTajne123");
    expect(a).not.toBe(b);
    expect(a.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("BardzoTajne123", a)).toBe(true);
    expect(await verifyPassword("bardzotajne123", a)).toBe(false);
    expect(await verifyPassword("x", "zepsuty-hash")).toBe(false);
  });
  it("wymaga min. 10 znaków", () => {
    expect(validatePasswordStrength("krotkie")).toBeTruthy();
    expect(validatePasswordStrength("wystarczajaco")).toBeNull();
  });
});

describe("limit prób logowania", () => {
  it("blokuje po 5 nieudanych próbach i odblokowuje po 15 min", () => {
    const key = "test@x.pl|1.2.3.4", now = 1_000_000;
    for (let i = 0; i < 5; i++) registerFailedAttempt(key, now);
    expect(isRateLimited(key, now)).toBe(true);
    expect(isRateLimited(key, now + 15 * 60 * 1000 + 1)).toBe(false);
    clearAttempts(key);
    expect(isRateLimited(key, now)).toBe(false);
  });
});

describe("upload zdjęć", () => {
  it("rozpoznaje format po zawartości, nie po nazwie", () => {
    expect(detectImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0]))).toBe("jpg");
    expect(detectImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))).toBe("png");
    expect(detectImageType(new TextEncoder().encode("RIFF\0\0\0\0WEBPVP8 "))).toBe("webp");
    expect(detectImageType(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(detectImageType(new TextEncoder().encode("<?php echo 1; ?>"))).toBeNull();
  });
  it("route /media przyjmuje tylko bezpieczne nazwy plików (brak path traversal)", () => {
    expect(MEDIA_NAME.test("0123456789abcdef0123456789abcdef.webp")).toBe(true);
    for (const bad of ["../.env.local", "..%2F.env", "abc.jpg", "0123456789abcdef0123456789abcdef.svg", "0123456789abcdef0123456789abcdef.jpg/../x"]) expect(MEDIA_NAME.test(bad)).toBe(false);
  });
});
