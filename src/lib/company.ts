/**
 * Seller-of-record snapshot embedded on every invoice.
 * Admin-configurable in a later phase.
 */
export const COMPANY = {
  name: "Giftty India Pvt. Ltd.",
  addressLines: ["221B, Baker Street", "New Delhi, DL 110001", "India"],
  gstin: "07AABCG1234H1Z5",
  email: "support@giftty.example",
  phone: "+91 98100 00000",
  website: "giftty.example",
  terms: [
    "All prices are inclusive of GST unless otherwise stated.",
    "Fresh cakes & flowers are non-returnable once dispatched.",
    "Personalised products cannot be cancelled after production begins.",
  ],
} as const;
