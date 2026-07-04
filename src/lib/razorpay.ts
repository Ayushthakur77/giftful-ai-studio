/**
 * Razorpay Checkout.js loader (client-side only).
 */
declare global {
  interface Window {
    Razorpay?: any;
  }
}

let scriptPromise: Promise<boolean> | null = null;

export function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => { scriptPromise = null; resolve(false); };
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export type RazorpayCheckoutOptions = {
  keyId: string;
  orderId: string;                 // Razorpay order_xxx
  amountPaise: number;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  onSuccess: (payload: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  onDismiss?: () => void;
};

export async function openRazorpayCheckout(opts: RazorpayCheckoutOptions): Promise<void> {
  const ok = await loadRazorpayScript();
  if (!ok || !window.Razorpay) throw new Error("Razorpay failed to load. Check your internet connection.");
  const rzp = new window.Razorpay({
    key: opts.keyId,
    order_id: opts.orderId,
    amount: opts.amountPaise,
    currency: "INR",
    name: opts.name,
    description: opts.description,
    prefill: opts.prefill,
    theme: opts.theme ?? { color: "#e11d48" },
    handler: opts.onSuccess,
    modal: { ondismiss: opts.onDismiss },
  });
  rzp.open();
}
