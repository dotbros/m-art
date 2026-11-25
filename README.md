# M.art — sklep internetowy pracowni biżuterii

Sklep z ręcznie robioną biżuterią z naturalnych kamieni i panel administracyjny do zarządzania produktami, kategoriami i zamówieniami. Projekt jest **mobile-first**. Zbudowany na Next.js 16, React 19, Drizzle ORM i MariaDB 10.11 / MySQL (lokalnie przenośna MariaDB — patrz SRODOWISKO.md).

## Szybki start

```bash
npm install
cp .env.example .env.local     # PowerShell: Copy-Item .env.example .env.local
npm run dev                    # sklep: http://localhost:3000  •  panel: http://localhost:3000/admin
```

Domyślne konto admina (z `.env.local`): `admin@mart.local` / `ZmienMnie123!` — **zmień je** (`npm run admin:create -- twoj@email.pl "NoweHaslo123"`).

Co trzeba mieć zainstalowane → **[SRODOWISKO.md](SRODOWISKO.md)**

## Dokumentacja (`docs/`)

| Plik | Zawartość |
|---|---|
| [01-OPIS-PROJEKTU.md](docs/01-OPIS-PROJEKTU.md) | Cel, zakres, architektura, struktura katalogów |
| [02-ETAPY-BUDOWY.md](docs/02-ETAPY-BUDOWY.md) | Plan etapów i ich status |
| [03-DZIENNIK-WDROZEN.md](docs/03-DZIENNIK-WDROZEN.md) | Co zostało zrobione, kiedy i dlaczego |
| [04-RAPORTY-TESTOW.md](docs/04-RAPORTY-TESTOW.md) | Wyniki testów po każdym etapie |
| [DECYZJE.md](docs/DECYZJE.md) | Rejestr decyzji technicznych |
| [WDROZENIE-NA-SERWER.md](docs/WDROZENIE-NA-SERWER.md) | Przeniesienie na serwer produkcyjny |

## Testy

```bash
npm run test:all     # typecheck + lint + Vitest + Playwright (Pixel 7, iPhone 14, desktop)
```

## Praca z GitHubem (z różnych komputerów)

Jednorazowo (na pierwszym komputerze):

```bash
# 1. Utwórz PRYWATNE, puste repozytorium na github.com (bez README), np. „m-art-sklep”
git remote add origin https://github.com/<twoje-konto>/m-art-sklep.git
git push -u origin main
```

Na każdym kolejnym komputerze: `git clone …`, `npm install`, `cp .env.example .env.local`.

Codzienna praca:

```bash
git pull                        # pobierz zmiany z innego komputera
# … praca …
npm run test:all                # sprawdź, czy nic się nie zepsuło
git add -A && git commit -m "Opis zmiany"
git push
```

## Agenci-doradcy (Claude Code)

`.claude/agents/doradca-techniczny.md` i `.claude/agents/doradca-ux.md` są w repozytorium, więc są dostępni na każdym komputerze, na którym otworzysz projekt w Claude Code.
