import { describe, expect, it } from "vitest";
import { validateHeroSlide } from "@/lib/hero";
import { detectMediaKind } from "@/lib/media";
import { validateStone } from "@/lib/stones";

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
  it("proporcje obrazu: poprawna liczba zapisana, brak lub bzdura → null (serwer odczyta z pliku)", () => {
    const ok = validateHeroSlide(form({ ...base, aspect: "0.5625" }));
    expect(ok.ok && ok.data.aspect).toBe(0.5625);
    for (const bad of ["", "abc", "0", "-1", "99"]) {
      const r = validateHeroSlide(form({ ...base, aspect: bad }));
      expect(r.ok && r.data.aspect).toBeNull();
    }
  });
  it("przycisk dźwięku tylko dla filmu i tylko gdy zaznaczony", () => {
    const video = { ...base, mediaType: "video", mediaUrl: "/media/0123456789abcdef0123456789abcdef.mp4" };
    const on = validateHeroSlide(form({ ...video, hasAudio: "on" }));
    expect(on.ok && on.data.hasAudio).toBe(true);
    const off = validateHeroSlide(form(video));
    expect(off.ok && off.data.hasAudio).toBe(false);
    const image = validateHeroSlide(form({ ...base, hasAudio: "on" }));
    expect(image.ok && image.data.hasAudio).toBe(false);
  });
  it("nieznane kadrowanie zamienia na środek, opis normalizuje końce linii", () => {
    const r = validateHeroSlide(form({ ...base, focus: "gora", description: "a\r\nb" }));
    expect(r.ok && [r.data.focus, r.data.description]).toEqual(["center", "a\nb"]);
  });
});

describe("walidacja kamienia (panel)", () => {
  const f = (data: Record<string, string>, images: string[] = []) => { const x = form(data); for (const i of images) x.append("images", i); return x; };
  it("tworzy adres z nazwy, ujednolica wielką literę, usuwa duplikaty zdjęć", () => {
    const r = validateStone(f({ name: "kwarc  różowy", showOnHome: "on", isActive: "on" }, ["/images/necklace-jasper.svg", "/images/necklace-jasper.svg"]));
    expect(r.ok && r.data).toMatchObject({ name: "Kwarc różowy", slug: "kwarc-rozowy", showOnHome: true, isActive: true, images: ["/images/necklace-jasper.svg"] });
  });
  it("wymaga nazwy; odrzuca obce adresy zdjęć i za długi podpis", () => {
    const r = validateStone(f({ name: "", caption: "x".repeat(81) }, ["https://zly.pl/a.jpg"]));
    expect(!r.ok && Object.keys(r.errors).sort()).toEqual(["caption", "images", "name", "slug"]);
  });
  it("maksymalnie 8 zdjęć", () => {
    const imgs = Array.from({ length: 9 }, (_, i) => `/media/${String(i).padStart(32, "0")}.jpg`);
    expect(validateStone(f({ name: "Opal" }, imgs)).ok).toBe(false);
  });
});
describe("slajd z własną kolekcją produktów", () => {
  const base = { title: "Zimowa", titleAccent: "kolekcja.", mediaUrl: "/media/0123456789abcdef0123456789abcdef.jpg", mediaType: "image", isActive: "on" };
  const f = (data: Record<string, string>, ids: string[] = []) => { const x = form(data); for (const id of ids) x.append("productIds", id); return x; };
  it("„Wybrane produkty” zapisuje listę (bez duplikatów, w kolejności) i czyści kamień", () => {
    const r = validateHeroSlide(f({ ...base, stone: "__produkty__" }, ["b", "a", "b"]));
    expect(r.ok && [r.data.productIds, r.data.stone]).toEqual([["b", "a"], ""]);
  });
  it("wymaga co najmniej jednego produktu", () => {
    const r = validateHeroSlide(f({ ...base, stone: "__produkty__" }));
    expect(!r.ok && r.errors.productIds).toBeTruthy();
  });
  it("przy kamieniu lub całej kolekcji lista produktów jest ignorowana", () => {
    const r = validateHeroSlide(f({ ...base, stone: "Agat mszysty" }, ["a"]));
    expect(r.ok && [r.data.stone, r.data.productIds]).toEqual(["Agat mszysty", []]);
  });
});