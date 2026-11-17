// Bez zależności — może być importowane także w komponentach klienckich.
export const ORDER_STATUSES = ["awaiting_confirmation", "confirmed", "paid", "shipped", "completed", "cancelled"] as const;
export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
