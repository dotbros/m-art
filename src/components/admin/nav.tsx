"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "../icons";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Pulpit", icon: "sparkle" },
  { href: "/admin/produkty", label: "Produkty", icon: "gift" },
  { href: "/admin/kategorie", label: "Kategorie", icon: "filter" },
  { href: "/admin/kamienie", label: "Kamienie", icon: "leaf" },
  { href: "/admin/zamowienia", label: "Zamówienia", icon: "bag" },
  { href: "/admin/strona", label: "Strona", icon: "star" },
];

/** Na telefonie: dolny pasek w zasięgu kciuka. Na desktopie: boczne menu. */
export function AdminNav() {
  const path = usePathname();
  return <nav className="adm-nav" aria-label="Panel administracyjny">
    {links.map((link) => {
      const active = link.href === "/admin" ? path === "/admin" : path.startsWith(link.href);
      return <Link key={link.href} href={link.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><Icon name={link.icon} size={20}/><span>{link.label}</span></Link>;
    })}
  </nav>;
}
