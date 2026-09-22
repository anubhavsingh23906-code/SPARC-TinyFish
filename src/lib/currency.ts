export const INR_SYMBOL = "\u20B9";

export function formatINR(amount: number) {
  return `${INR_SYMBOL}${amount.toLocaleString("en-IN")}`;
}
