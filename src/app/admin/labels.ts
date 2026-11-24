import type { OrderStatus, PaymentStatus } from "@/lib/statuses";

export const orderStatusLabels: Record<OrderStatus, string> = {
  awaiting_confirmation: "Do potwierdzenia",
  confirmed: "Potwierdzone",
  paid: "Opłacone",
  shipped: "Wysłane",
  completed: "Zrealizowane",
  cancelled: "Anulowane",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  unpaid: "Nieopłacone",
  pending: "Płatność w toku",
  paid: "Opłacone",
  failed: "Płatność nieudana",
  refunded: "Zwrócone",
};

export const deliveryLabels: Record<string, string> = { courier: "Kurier", pickup: "Odbiór osobisty" };

/** Treść potwierdzenia usunięcia — co stanie się ze stanem magazynowym i ostrzeżenie dla sprzedaży „rozliczonej”. */
export function deleteOrderWarning(number: string, status: OrderStatus, paymentStatus: PaymentStatus) {
  const stock = status === "shipped" || status === "completed" ? "Towar został już wysłany — stan magazynowy się nie zmieni."
    : status === "cancelled" ? "Zamówienie było anulowane — produkty wróciły już na stan."
    : "Produkty z zamówienia wrócą na stan magazynowy.";
  const accounting = paymentStatus === "paid" || status === "paid" || status === "shipped" || status === "completed"
    ? " UWAGA: to zamówienie jest opłacone lub zrealizowane — jest dokumentem sprzedaży, który zwykle trzeba przechowywać do celów księgowych." : "";
  return `Usunąć zamówienie ${number}? Tej operacji nie można cofnąć. ${stock}${accounting}`;
}

export const dateTime = (date: Date) => new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(date);
