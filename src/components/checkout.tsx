"use client";

import { useState, type FormEvent } from "react";
import { FREE_SHIPPING_FROM, money, shippingCost, stoneList, type Product } from "@/lib/catalog";
import { Icon } from "./icons";

export type ResolvedCartItem = { product: Product; quantity: number };

export function Checkout({ items, onComplete, onContinue }: { items: ResolvedCartItem[]; onComplete: () => void; onContinue: () => void }) {
  const [delivery, setDelivery] = useState("courier");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ number: string; total: number } | null>(null);
  const subtotal = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = shippingCost(subtotal, delivery);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true); setError("");
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...Object.fromEntries(data), delivery, consent: data.get("consent") === "on", items: items.map(({ product, quantity }) => ({ id: product.id, quantity })) }) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error);
      setResult(json); onComplete();
    } catch (err) { setError(err instanceof Error ? err.message : "Nie udało się złożyć zamówienia. Sprawdź połączenie i spróbuj ponownie."); }
    finally { setPending(false); }
  }

  if (result) return <div className="order-success"><span className="success-symbol"><Icon name="check" size={34}/></span><p className="eyebrow">DZIĘKUJEMY ZA ZAUFANIE</p><h3>Małe piękno już na Ciebie czeka.</h3><p>Twoje zamówienie zostało zapisane w pracowni.</p><div className="order-number"><span>Numer zamówienia</span><strong>{result.number}</strong><span>Łączna kwota: {money(result.total)}</span></div><p className="muted">Pracownia potwierdzi dostępność, termin realizacji i sposób płatności, korzystając z podanych danych kontaktowych. Żadne środki nie zostały pobrane. Zachowaj numer zamówienia.</p><button className="button button-dark" onClick={onContinue}>Wróć do małych zachwytów <Icon name="arrow" size={18}/></button></div>;

  return <form className="checkout-layout" onSubmit={submit}>
    <div className="checkout-fields"><p className="checkout-intro">Jeszcze chwila i Twoje małe dzieło trafi w dobre ręce.</p><h3><span>01</span> Twoje dane</h3><div className="field-grid"><label className="field full">Imię i nazwisko<input name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Anna Kowalska"/></label><label className="field">Adres e-mail<input name="email" type="email" autoComplete="email" required maxLength={200} placeholder="anna@przyklad.pl"/></label><label className="field">Numer telefonu<input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={20} placeholder="600 000 000"/></label></div>
    <h3><span>02</span> Adres i dostawa</h3><div className="field-grid"><label className="field full">Ulica, numer domu i mieszkania<input name="street" autoComplete="street-address" required maxLength={200} placeholder="ul. Kwiatowa 12 / 4"/></label><label className="field">Kod pocztowy<input name="postalCode" autoComplete="postal-code" pattern="[0-9]{2}-[0-9]{3}" required placeholder="00-001" title="Kod pocztowy w formacie 00-001" maxLength={6}/></label><label className="field">Miejscowość<input name="city" autoComplete="address-level2" required maxLength={100} placeholder="Warszawa"/></label></div>
    <div className="delivery-options"><label className={delivery === "courier" ? "selected" : ""}><input type="radio" name="deliveryChoice" checked={delivery === "courier"} onChange={() => setDelivery("courier")}/><span><strong>Przesyłka kurierska</strong><small>Starannie zapakowana, prosto do Ciebie</small></span><b>{subtotal >= FREE_SHIPPING_FROM ? "Gratis" : money(shippingCost(subtotal, "courier"))}</b></label><label className={delivery === "pickup" ? "selected" : ""}><input type="radio" name="deliveryChoice" checked={delivery === "pickup"} onChange={() => setDelivery("pickup")}/><span><strong>Odbiór osobisty</strong><small>Miejsce i termin po uzgodnieniu</small></span><b>Gratis</b></label></div>
    <div className="payment-note"><Icon name="shield" size={23}/><div><strong>Płatność po potwierdzeniu</strong><p>To zgłoszenie zamówienia. Dostępność i płatność ustalisz z pracownią. Nie pobieramy teraz żadnych środków.</p></div></div>
    <details className="checkout-terms"><summary>Zasady składania zamówień</summary><p>Wysłanie formularza zapisuje zamówienie w pracowni M.art. Realizacja następuje po indywidualnym potwierdzeniu dostępności, danych sprzedawcy, ostatecznych warunków oraz płatności. Standardowo przygotowanie biżuterii trwa 2–4 dni robocze od potwierdzenia. Przysługuje Ci prawo do odstąpienia od zakupu w terminie 14 dni od otrzymania standardowego produktu. Produkty personalizowane mogą podlegać wyjątkom ustawowym. Dane podane w formularzu służą wyłącznie obsłudze zamówienia.</p></details>
    <label className="checkbox-label"><input type="checkbox" name="consent" required/><span>Akceptuję powyższe zasady zamówienia i przetwarzanie danych w celu jego realizacji.</span></label>
    {error && <p className="form-message error" role="alert">{error}</p>}<button className="button button-dark checkout-submit" type="submit" disabled={pending || !items.length}>{pending ? "Zapisujemy zamówienie…" : "Złóż zamówienie"}<Icon name="arrow" size={18}/></button></div>
    <aside className="checkout-summary"><p className="eyebrow">TWÓJ WYBÓR</p>{items.map(({ product, quantity }) => <div className="summary-item" key={product.id}><img src={product.image} alt={product.name} width={64} height={78}/><div><strong>{product.name}</strong><span>{quantity} szt.{product.stones.length ? ` · ${stoneList(product.stones)}` : ""}</span><b>{money(product.price * quantity)}</b></div></div>)}<div className="summary-line"><span>Wartość produktów</span><span>{money(subtotal)}</span></div><div className="summary-line"><span>Dostawa</span><span>{shipping ? money(shipping) : "Gratis"}</span></div><div className="summary-line total"><span>Razem</span><strong>{money(subtotal + shipping)}</strong></div><p className="gift-note"><Icon name="gift" size={20}/> Każde zamówienie pakujemy jak prezent.</p></aside>
  </form>;
}
