export function formatPrice(amountInKyat: number): string {
  return `${amountInKyat.toLocaleString("en-US")} Ks`;
}
