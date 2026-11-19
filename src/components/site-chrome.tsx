import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icons";

/**
 * Nagłówek i stopka dla podstron sklepu (np. strony kamieni). Strona główna ma własny, rozbudowany nagłówek
 * w `shop.tsx`; tutaj linki prowadzą do niej (koszyk: /?koszyk=1).
 */
export function SiteChrome({ children }: { children: ReactNode }) {
  return <>
    <div className="announcement"><span><Icon name="gift" size={14}/> Darmowa dostawa od 299 zł</span><span className="announcement-divider"/><span className="announcement-extra">Małe dzieła, wielkie emocje</span></div>
    <header className="site-header"><div className="header-inner container">
      <Link href="/" className="chrome-back"><Icon name="arrow-left" size={18}/><span>Sklep</span></Link>
      <Link className="brand-link" href="/" aria-label="M.art — strona główna"><span className="brand"><img className="brand-logo" src="/brand/logo.svg" alt="M.art — Pracownia Biżuterii" width={1290} height={1219}/></span></Link>
      <div className="header-actions"><Link className="cart-toggle" href="/?koszyk=1" aria-label="Koszyk"><Icon name="bag"/><span className="cart-text">Koszyk</span></Link></div>
    </div></header>
    <main>{children}</main>
    <footer className="site-footer"><div className="footer-bottom container"><span>© {new Date().getFullYear()} M.art · Pracownia Biżuterii</span><span>Tworzone powoli. Noszone z miłością.</span><Link href="/" className="footer-location">WRÓĆ DO SKLEPU</Link></div></footer>
  </>;
}
