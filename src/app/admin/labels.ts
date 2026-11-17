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

export const dateTime = (date: Date) => new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Warsaw" }).format(date);
