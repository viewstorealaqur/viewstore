/**
 * Builds a wa.me deep link that pre-fills a WhatsApp message.
 */
export function buildWhatsAppUrl(
  productName: string,
  priceInRs: number,
  overridePhone?: string | null
): string | null {
  const envPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  const phone = (overridePhone ? overridePhone.replace(/\D/g, "") : envPhone);

  if (!phone) return null;

  const text = encodeURIComponent(
    `Hi! I'd like to order the *${productName}* (${formatPrice(priceInRs)}).\n\nCould you please share availability and delivery details?`
  );

  return `https://wa.me/${phone}?text=${text}`;
}

export function formatPrice(price: number): string {
  return `Rs. ${price.toLocaleString("en-PK")}`;
}
