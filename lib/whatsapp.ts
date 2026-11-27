/**
 * Builds a wa.me deep link that pre-fills a WhatsApp message.
 */
export function buildWhatsAppUrl(
  productName: string,
  priceInRs: number,
  overridePhone?: string | null
): string | null {
  let phone = "";
  if (overridePhone !== undefined) {
    phone = overridePhone ? overridePhone.replace(/\D/g, "") : "";
  } else {
    phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  }

  if (!phone) return null;

  const text = encodeURIComponent(
    `Hi! I'd like to order *${productName}* (${formatPrice(priceInRs)}).\n\nCould you please share availability and delivery details?`
  );

  return `https://wa.me/${phone}?text=${text}`;
}

export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}
