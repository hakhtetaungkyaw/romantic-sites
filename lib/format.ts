export function formatPrice(amountInKyat: number): string {
  return `${amountInKyat.toLocaleString("en-US")} Ks`;
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
