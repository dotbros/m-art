import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./witaj.css";

/**
 * Powitanie nowej właścicielki sklepu (prezent). Projektowane wyłącznie na telefon;
 * na większym ekranie wyświetla się jako kolumna o szerokości telefonu.
 * Strona niewidoczna dla wyszukiwarek i niepodlinkowana w sklepie.
 */
export const metadata: Metadata = {
  title: "Witaj w M.art",
  description: "Teraz jesteś częścią czegoś większego.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = { themeColor: "#15100b" };

const KeyIcon = () => (
  <svg viewBox="0 0 64 24" width="64" height="24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="12" r="7.5" />
    <circle cx="11" cy="12" r="3.2" />
    <path d="M18.5 12H58" />
    <path d="M50 12v6M44 12v4.5M56 12v4" />
  </svg>
);

const Ornament = () => (
  <div className="w-ornament" aria-hidden="true">
    <span />
    <svg viewBox="0 0 24 24" width="14" height="14"><path d="M12 2 15 12 12 22 9 12Z" fill="currentColor" /></svg>
    <span />
  </div>
);

export default function WelcomePage() {
  return (
    <main className="welcome">
      <div className="w-frame" aria-hidden="true"><i /><i /><i /><i /></div>
      <div className="w-glow" aria-hidden="true" />
      <div className="w-sparks" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <span key={i} />)}</div>

      <div className="w-content">
        <p className="w-eyebrow w-in" style={{ "--d": "0.2s" } as React.CSSProperties}>M.art · Pracownia Biżuterii</p>

        <div className="w-seal w-in" style={{ "--d": "0.5s" } as React.CSSProperties}>
          <span className="w-logo" role="img" aria-label="M.art — Pracownia Biżuterii" />
        </div>

        <h1 className="w-title">
          <span className="w-line w-in" style={{ "--d": "1.1s" } as React.CSSProperties}>Teraz jesteś częścią</span>
          <span className="w-script" style={{ "--d": "1.5s" } as React.CSSProperties}>czegoś większego</span>
        </h1>

        <div className="w-in" style={{ "--d": "2s" } as React.CSSProperties}><Ornament /></div>

        <p className="w-text w-in" style={{ "--d": "2.3s" } as React.CSSProperties}>
          Każdy kamień, każda perła i każdy detal, który tworzysz z&nbsp;taką czułością, ma od dziś swój własny dom.
          Miejsce, w&nbsp;którym Twoja pasja spotyka tych, którzy ją pokochają.
        </p>

        <p className="w-wish w-in" style={{ "--d": "2.8s" } as React.CSSProperties}>
          Wierzymy, że ten prezent pozwoli Ci jeszcze bardziej się zrealizować w&nbsp;tym, co robisz najlepiej!
        </p>

        <Link href="/" className="w-cta w-in" style={{ "--d": "3.4s" } as React.CSSProperties}>
          <span>Wejdź do swojego sklepu</span>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"><path d="M4 12h15M14 6.5 19.5 12 14 17.5" /></svg>
        </Link>

        <footer className="w-key w-in" style={{ "--d": "4s" } as React.CSSProperties}>
          <span className="w-key-icon"><KeyIcon /></span>
          <p>Wewnątrz ramki znajdziesz klucz<br />do Twojego królestwa</p>
        </footer>
      </div>
    </main>
  );
}
