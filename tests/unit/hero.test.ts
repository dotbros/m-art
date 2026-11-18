import { describe, expect, it } from "vitest";
import { validateHeroSlide } from "@/lib/hero";
import { detectMediaKind } from "@/lib/media";

const form = (data: Record<string, string>) => { const f = new FormData(); for (const [k, v] of Object.entries(data)) f.set(k, v); return f; };
const bytes = (...parts: (number[] | string)[]) => new Uint8Array(parts.flatMap((p) => (typeof p === "string" ? [...p].map((c) => c.charCodeAt(0)) : p)));

describe("rozpoznawanie zdjęć i filmów", () => {
  it("rozpoznaje zdjęcia (JPG, PNG, WEBP, HEIC z iPhone'a)", () => {
    expect(detectMediaKind(bytes([0xff, 0xd8, 0xff, 0xe0]))).toBe("image");
    expect(detectMediaKind(bytes([0x89], "PNG"))).toBe("image");
    expect(detectMediaKind(bytes("RIFF", [0, 0, 0, 0], "WEBP"))).toBe("image");
    expect(detectMediaKind(bytes([0, 0, 0, 0x18], "ftypheic"))).toBe("image");
  });
  it("rozpoznaje filmy (MP4, MOV z iPhone'a, WEBM)", () => {
    expect(detectMediaKind(bytes([0, 0, 0, 0x20], "ftypisom"))).toBe("video");
    expect(detectMediaKind(bytes([0, 0, 0, 0x14], "ftypqt  "))).toBe("video");
    expect(detectMediaKind(bytes([0x1a, 0x45, 0xdf, 0xa3]))).toBe("video");
  });
  it("odrzuca inne pliki (skrypty, SVG, PDF)", () => {
    expect(detectMediaKind(bytes("<svg onload=x>"))).toBeNull();
    expect(detectMediaKind(bytes("%PDF-1.7"))).toBeNull();
    expect(detectMediaKind(bytes("#!/bin/sh"))).toBeNull();
  });
});

describe("walidacja slajdu HERO", () => {
  const base = { title: "Z natury", mediaUrl: "/media/0123456789abcdef0123456789abcdef.jpg", mediaType: "image", isActive: "on" };
  it("przyjmuje poprawny slajd ze zdjęciem i ignoruje poster dla zdjęcia", () => {
    const r = validateHeroSlide(form({ ...base, posterUrl: "/media/0123456789abcdef0123456789abcdef.jpg", focus: "left" }));
    expect(r.ok && r.data).toMatchObject({ title: "Z natury", mediaType: "image", posterUrl: null, focus: "left", isActive: true });
  });
  it("przyjmuje slajd z filmem MP4 i kadrem startowym", () => {
    const r = validateHeroSlide(form({ ...base, mediaType: "video", mediaUrl: "/media/0123456789abcdef0123456789abcdef.mp4", posterUrl: "/media/fedcba9876543210fedcba9876543210.jpg" }));
    expect(r.ok && r.data.posterUrl).toBe("/media/fedcba9876543210fedcba9876543210.jpg");
  });
  it("wymaga tytułu i pliku; odrzuca obce adresy i niezgodny typ", () => {
    const r = validateHeroSlide(form({ title: "", mediaUrl: "" }));
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["media", "title"]);
    expect(validateHeroSlide(form({ ...base, mediaUrl: "https://zly-serwer.pl/x.jpg" })).ok).toBe(false);
    expect(validateHeroSlide(form({ ...base, mediaUrl: "/media/../../.env.local" })).ok).toBe(false);
    expect(validateHeroSlide(form({ ...base, mediaType: "video" })).ok).toBe(false); // .jpg jako film
  });
  it("nieznane kadrowanie zamienia na środek, opis normalizuje końce linii", () => {
    const r = validateHeroSlide(form({ ...base, focus: "gora", description: "a\r\nb" }));
    expect(r.ok && [r.data.focus, r.data.description]).toEqual(["center", "a\nb"]);
  });
});
